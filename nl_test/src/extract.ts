/**
 * extract.ts — React ソースコードを静的解析し、セマンティックマップを生成する。
 *
 * 出力: semantic-map.yaml
 *   - routes:   App.tsx の <Route> から「ページ名 → パス」
 *   - elements: 各ページ/コンポーネントのインタラクティブ要素と、
 *               Playwright ロケータの根拠となる属性（aria-label / label / placeholder / text / id）
 *
 * テンプレートリテラルの aria-label（例: `メンバー ${index + 1} の名前`）は
 * パラメータ化された名前 "メンバー {param} の名前" として抽出する。
 */
import * as path from 'node:path';
import {
  JsxAttribute,
  JsxElement,
  JsxSelfClosingElement,
  Node,
  Project,
  SyntaxKind,
} from 'ts-morph';
import { stringify } from 'yaml';

const INTERACTIVE_TAGS = new Set(['button', 'input', 'textarea', 'select', 'a', 'Link']);

export interface ElementEntry {
  /** 自然言語ステップの解決対象となる名前（最優先のセマンティック名） */
  name: string;
  /** name がテンプレートリテラル由来でパラメータを含むか */
  parameterized?: boolean;
  /** 補助的なマッチ対象（テキスト・placeholder・id 等すべて） */
  aliases: string[];
  /** 要素種別 */
  kind: 'button' | 'link' | 'textbox' | 'select';
  /** ロケータ戦略（優先度順に選択済み）。alternatives は条件分岐テキスト（'更新'|'追加'）の選択肢 */
  locator: {
    strategy: 'label' | 'placeholder' | 'role-name' | 'id';
    value: string;
    alternatives?: string[];
  };
  /** 定義元 (ファイル:行) — ソース変更時の差分追跡用 */
  source: string;
}

export interface SemanticMap {
  generatedAt: string;
  targetDir: string;
  routes: Record<string, string>; // ページ名(コンポーネント名) → path
  pages: Record<string, ElementEntry[]>; // ページ/コンポーネント名 → 要素一覧
}

/** JSX属性値を取り出す。テンプレートリテラルは {param} に正規化して返す */
function attrValue(attr: JsxAttribute | undefined): { text: string; parameterized: boolean } | null {
  if (!attr) return null;
  const init = attr.getInitializer();
  if (!init) return null;
  if (Node.isStringLiteral(init)) return { text: init.getLiteralText(), parameterized: false };
  if (Node.isJsxExpression(init)) {
    const expr = init.getExpression();
    if (Node.isStringLiteral(expr)) return { text: expr.getLiteralText(), parameterized: false };
    if (Node.isTemplateExpression(expr)) {
      // `メンバー ${index + 1} の名前` → "メンバー {param} の名前"
      let text = expr.getHead().getLiteralText();
      for (const span of expr.getTemplateSpans()) {
        text += `{param}${span.getLiteral().getLiteralText()}`;
      }
      return { text, parameterized: true };
    }
  }
  return null;
}

/** 子要素の静的テキストを連結（条件式の中の文字列も拾う: loading ? '作成中...' : 'グループを作成'） */
function staticTexts(el: JsxElement): string[] {
  const out: string[] = [];
  for (const child of el.getJsxChildren()) {
    if (Node.isJsxText(child)) {
      const t = child.getText().trim().replace(/\s+/g, ' ');
      if (t) out.push(t);
    } else if (Node.isJsxExpression(child)) {
      // 条件分岐内の文字列リテラルを全部候補に
      for (const lit of child.getDescendantsOfKind(SyntaxKind.StringLiteral)) {
        const t = lit.getLiteralText().trim();
        if (t) out.push(t);
      }
    }
  }
  return out;
}

function tagName(node: JsxElement | JsxSelfClosingElement): string {
  return Node.isJsxElement(node)
    ? node.getOpeningElement().getTagNameNode().getText()
    : node.getTagNameNode().getText();
}

function getAttr(node: JsxElement | JsxSelfClosingElement, name: string): JsxAttribute | undefined {
  const attrs = Node.isJsxElement(node)
    ? node.getOpeningElement().getAttributes()
    : node.getAttributes();
  for (const a of attrs) {
    if (Node.isJsxAttribute(a) && a.getNameNode().getText() === name) return a;
  }
  return undefined;
}

export function extract(frontendDir: string): SemanticMap {
  const project = new Project({
    tsConfigFilePath: path.join(frontendDir, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  });
  project.addSourceFilesAtPaths([
    path.join(frontendDir, 'src/pages/**/*.tsx'),
    path.join(frontendDir, 'src/components/**/*.tsx'),
    path.join(frontendDir, 'src/App.tsx'),
  ]);

  const map: SemanticMap = {
    generatedAt: new Date().toISOString(),
    targetDir: frontendDir,
    routes: {},
    pages: {},
  };

  for (const sf of project.getSourceFiles()) {
    const base = path.basename(sf.getFilePath());
    if (base.includes('.test.') || base.includes('.stories.')) continue;
    const pageName = base.replace(/\.tsx$/, '');

    // ---- ルーティング抽出 (App.tsx の <Route path=... element={<X/>}>) ----
    if (pageName === 'App') {
      for (const route of sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)) {
        if (tagName(route) !== 'Route') continue;
        const p = attrValue(getAttr(route, 'path'))?.text;
        const elAttr = getAttr(route, 'element')?.getInitializer();
        let comp: string | undefined;
        if (elAttr && Node.isJsxExpression(elAttr)) {
          const inner = elAttr.getExpression();
          if (inner && (Node.isJsxSelfClosingElement(inner) || Node.isJsxElement(inner))) {
            comp = tagName(inner as JsxSelfClosingElement);
          }
        }
        if (p && comp) map.routes[comp] = p;
      }
      continue;
    }

    // ---- label[htmlFor] → テキスト の対応表（getByLabel 用） ----
    const labelFor: Record<string, string> = {};
    for (const label of sf.getDescendantsOfKind(SyntaxKind.JsxElement)) {
      if (tagName(label) !== 'label') continue;
      const htmlFor = attrValue(getAttr(label, 'htmlFor'))?.text;
      const texts = staticTexts(label);
      if (htmlFor && texts.length) labelFor[htmlFor] = texts[0];
    }

    // ---- インタラクティブ要素抽出 ----
    const entries: ElementEntry[] = [];
    const nodes: (JsxElement | JsxSelfClosingElement)[] = [
      ...sf.getDescendantsOfKind(SyntaxKind.JsxElement),
      ...sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ];

    for (const node of nodes) {
      const tag = tagName(node);
      if (!INTERACTIVE_TAGS.has(tag)) continue;

      const ariaLabel = attrValue(getAttr(node, 'aria-label'));
      const id = attrValue(getAttr(node, 'id'))?.text;
      const placeholder = attrValue(getAttr(node, 'placeholder'))?.text;
      const inputType = attrValue(getAttr(node, 'type'))?.text;
      const texts = Node.isJsxElement(node) ? staticTexts(node) : [];
      const labelText = id ? labelFor[id] : undefined;

      const kind: ElementEntry['kind'] =
        tag === 'button' || (tag === 'input' && (inputType === 'submit' || inputType === 'button'))
          ? 'button'
          : tag === 'a' || tag === 'Link'
            ? 'link'
            : tag === 'select'
              ? 'select'
              : 'textbox';

      // セマンティック名の優先度: aria-label > label > placeholder > text > id
      const name = ariaLabel?.text ?? labelText ?? placeholder ?? texts[0] ?? id;
      if (!name) continue; // 意味的な手がかりゼロの要素はマップに載せない（lint対象）

      // ロケータ戦略の優先度（Testing Library 流: ユーザー視点 > 実装詳細）
      let locator: ElementEntry['locator'];
      if (ariaLabel) locator = { strategy: 'label', value: ariaLabel.text };
      else if (labelText) locator = { strategy: 'label', value: labelText };
      else if (placeholder) locator = { strategy: 'placeholder', value: placeholder };
      else if (texts[0] && (kind === 'button' || kind === 'link'))
        locator = {
          strategy: 'role-name',
          value: texts[0],
          // {isEdit ? '更新' : '追加'} のような条件分岐テキストはどれが表示されるか
          // 静的には決まらないので、全候補を選択肢として保持する
          ...(texts.length > 1 ? { alternatives: texts } : {}),
        };
      else locator = { strategy: 'id', value: id! };

      const aliases = [
        ...new Set(
          [labelText, placeholder, ...texts, id].filter(
            (s): s is string => !!s && s !== name,
          ),
        ),
      ];

      entries.push({
        name,
        ...(ariaLabel?.parameterized ? { parameterized: true } : {}),
        aliases,
        kind,
        locator,
        source: `${path.relative(frontendDir, sf.getFilePath())}:${node.getStartLineNumber()}`,
      });
    }

    if (entries.length) map.pages[pageName] = entries;
  }
  return map;
}

// ---- CLI ----
if (process.argv[1]?.endsWith('extract.ts')) {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: tsx src/extract.ts <frontend-dir>');
    process.exit(1);
  }
  const map = extract(path.resolve(target));
  const out = stringify(map);
  require('node:fs').writeFileSync('semantic-map.yaml', out);
  const total = Object.values(map.pages).reduce((n, e) => n + e.length, 0);
  console.log(
    `semantic-map.yaml generated: ${Object.keys(map.routes).length} routes, ${Object.keys(map.pages).length} pages/components, ${total} elements`,
  );
}
