/**
 * compile.ts — Maestro フロー形式の YAML を semantic-map 経由で Playwright spec にコンパイルする。
 *
 * フォーマット (https://docs.maestro.dev/maestro-flows 準拠):
 *
 *   page: CreateGroupPage        # Maestro の appId/url に相当。解決スコープ兼初期ルート
 *   use: [ErrorModal]            # 追加スコープ（モーダル等）※本ツール拡張
 *   name: グループを作成する
 *   ---
 *   - launchApp                  # page のルートへ goto
 *   - tapOn: "グループ名"          # クリック（input ならフォーカス）
 *   - inputText: "熱海旅行"        # 直前に tapOn した要素へ入力（Maestro 流ステートフル）
 *   - assertVisible: "..."
 *
 * 解決は完全に決定的（LLM 不使用）:
 *   1. NFKC正規化 + 小文字化 + 空白除去
 *   2. スコープ内の name / aliases に対しスコアリング
 *      (完全一致 > 前方一致 > 包含 > パラメータ化テンプレートのパターン一致)
 *   3. 同点候補が複数なら「曖昧」としてコンパイルエラー（実行時に揺れない）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseAllDocuments } from 'yaml';
import type { ElementEntry, SemanticMap } from './extract';

// ---------------- フロー定義の型 ----------------

interface FlowConfig {
  page: string; // 初期スコープ＝ページ（routes のキー）
  use?: string[]; // 追加スコープ
  name?: string; // テスト名（省略時はファイル名）
}

type TapOnArg = string | { text: string; index?: number };

type Command =
  | 'launchApp'
  | { launchApp: null }
  | { openLink: string } // パス直書き or ページ名
  | { tapOn: TapOnArg }
  | { inputText: string } // 直前の tapOn 対象へ入力
  | { selectOption: string } // 直前の tapOn 対象 (select) のオプション選択 ※拡張
  | { assertVisible: string }
  | { assertNotVisible: string }
  | { assertUrl: string }; // ※拡張（Maestro なら assertTrue + script 相当）

// ---------------- 決定的リゾルバ ----------------

const normalize = (s: string) => s.normalize('NFKC').toLowerCase().replace(/\s+/g, '');

interface Resolved {
  entry: ElementEntry;
  param?: string;
}

function matchParameterized(template: string, query: string): string | null {
  const esc = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${esc.replace(/\\\{param\\\}/g, '(.+?)')}$`);
  const m = query.match(re);
  return m ? m[1] : null;
}

function resolve(map: SemanticMap, scopes: string[], query: string): Resolved {
  const nq = normalize(query);
  const candidates: { score: number; resolved: Resolved }[] = [];

  for (const scope of scopes) {
    for (const entry of map.pages[scope] ?? []) {
      for (const raw of [entry.name, ...entry.aliases]) {
        const n = normalize(raw);
        if (entry.parameterized && raw === entry.name) {
          const param = matchParameterized(n, nq);
          if (param) candidates.push({ score: 95, resolved: { entry, param } });
          continue;
        }
        if (n === nq) candidates.push({ score: 100, resolved: { entry } });
        else if (n.startsWith(nq) || nq.startsWith(n)) {
          // 「説明」→「説明（任意）」のような注釈サフィックスを許容
          candidates.push({ score: 75, resolved: { entry } });
        } else if (n.includes(nq) || nq.includes(n)) {
          const ratio = Math.min(n.length, nq.length) / Math.max(n.length, nq.length);
          if (ratio >= 0.4) candidates.push({ score: Math.round(80 * ratio), resolved: { entry } });
        }
      }
    }
  }

  if (!candidates.length) {
    const available = scopes
      .flatMap((s) => (map.pages[s] ?? []).map((e) => `  - ${e.name} (${e.kind}, ${e.source})`))
      .join('\n');
    throw new Error(`「${query}」を解決できません。スコープ ${scopes.join(', ')} の候補:\n${available}`);
  }
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates[0];
  const ties = candidates.filter(
    (c) => c.score === top.score && c.resolved.entry !== top.resolved.entry,
  );
  if (ties.length) {
    const list = [top, ...ties]
      .map((c) => `  - ${c.resolved.entry.name} (${c.resolved.entry.source})`)
      .join('\n');
    throw new Error(`「${query}」が曖昧です。より具体的に書いてください:\n${list}`);
  }
  return top.resolved;
}

// ---------------- ロケータ生成 ----------------

const js = (s: string) => `'${s.replace(/'/g, "\\'")}'`;

function toLocator({ entry, param }: Resolved, index?: number): string {
  const v = entry.locator.value;
  let loc: string;
  switch (entry.locator.strategy) {
    case 'label': {
      const filled =
        entry.parameterized && param !== undefined ? v.replace(/\{param\}/g, param) : v;
      loc = `page.getByLabel(${js(filled)})`;
      break;
    }
    case 'placeholder':
      loc = `page.getByPlaceholder(${js(v)})`;
      break;
    case 'role-name': {
      const role = entry.kind === 'link' ? 'link' : 'button';
      if (entry.locator.alternatives?.length) {
        // 条件分岐テキスト → /更新|追加/ の正規表現でどちらの状態でもマッチさせる
        const pattern = entry.locator.alternatives
          .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|');
        loc = `page.getByRole('${role}', { name: /${pattern}/ })`;
      } else {
        loc = `page.getByRole('${role}', { name: ${js(v)} })`;
      }
      break;
    }
    case 'id':
      loc = `page.locator('#${v}')`;
      break;
  }
  return index !== undefined ? `${loc}.nth(${index})` : loc;
}

// ---------------- コンパイラ本体 ----------------

export function compileFlow(map: SemanticMap, config: FlowConfig, commands: Command[], fallbackName: string): string {
  const scopes = [config.page, ...(config.use ?? [])];
  const lines: string[] = [];

  // Maestro の inputText は「フォーカス中の要素」に入力する。
  // コンパイル時は直前の tapOn 対象を追跡して再現する。
  let focused: { resolved: Resolved; index?: number; label: string } | null = null;

  const routeOf = (name: string): string => {
    const route =
      map.routes[name] ??
      Object.entries(map.routes).find(([k]) => normalize(k).includes(normalize(name)))?.[1];
    if (!route)
      throw new Error(`ルート「${name}」が見つかりません: ${Object.keys(map.routes).join(', ')}`);
    return route;
  };

  for (const cmd of commands) {
    if (cmd === 'launchApp' || (typeof cmd === 'object' && 'launchApp' in cmd)) {
      lines.push(`  await page.goto('${routeOf(config.page)}'); // launchApp → ${config.page}`);
    } else if ('openLink' in cmd) {
      const target = cmd.openLink.startsWith('/') ? cmd.openLink : routeOf(cmd.openLink);
      lines.push(`  await page.goto('${target}'); // openLink: ${cmd.openLink}`);
    } else if ('tapOn' in cmd) {
      const arg = cmd.tapOn;
      const text = typeof arg === 'string' ? arg : arg.text;
      const index = typeof arg === 'string' ? undefined : arg.index;
      const resolved = resolve(map, scopes, text);
      focused = { resolved, index, label: text };
      lines.push(`  await ${toLocator(resolved, index)}.click(); // tapOn: ${text}`);
    } else if ('inputText' in cmd) {
      if (!focused)
        throw new Error(`inputText: "${cmd.inputText}" の前に tapOn で入力先を指定してください`);
      lines.push(
        `  await ${toLocator(focused.resolved, focused.index)}.fill(${js(cmd.inputText)}); // inputText → ${focused.label}`,
      );
    } else if ('selectOption' in cmd) {
      if (!focused)
        throw new Error(`selectOption: "${cmd.selectOption}" の前に tapOn で対象の select を指定してください`);
      lines.push(
        `  await ${toLocator(focused.resolved, focused.index)}.selectOption({ label: ${js(cmd.selectOption)} }); // selectOption → ${focused.label}`,
      );
    } else if ('assertVisible' in cmd || 'assertNotVisible' in cmd) {
      const negative = 'assertNotVisible' in cmd;
      const text = negative ? (cmd as { assertNotVisible: string }).assertNotVisible : (cmd as { assertVisible: string }).assertVisible;
      // assert はマップ未登録の任意テキスト（見出し・通知等）も対象になりうるので
      // 解決に失敗したら getByText へ決定的にフォールバックする
      let loc: string;
      try {
        loc = toLocator(resolve(map, scopes, text));
      } catch {
        loc = `page.getByText(${js(text)})`;
      }
      lines.push(`  await expect(${loc}).${negative ? 'toBeHidden' : 'toBeVisible'}();`);
    } else if ('assertUrl' in cmd) {
      lines.push(`  await expect(page).toHaveURL(/${cmd.assertUrl.replace(/\//g, '\\/')}/);`);
    } else {
      throw new Error(`未対応のコマンドです: ${JSON.stringify(cmd)}`);
    }
  }

  const title = config.name ?? fallbackName;
  return `// 自動生成: ${title}
// generator: warikan-nl-test / source map: semantic-map.yaml (${map.generatedAt})
// このファイルは決定的に再生成可能です。直接編集せず .flow.yaml を編集してください。
import { expect, test } from '@playwright/test';

test(${js(title)}, async ({ page }) => {
${lines.join('\n')}
});
`;
}

// ---------------- CLI ----------------

if (process.argv[1]?.endsWith('compile.ts')) {
  const [mapFile, flowFile] = process.argv.slice(2);
  if (!mapFile || !flowFile) {
    console.error('Usage: tsx src/compile.ts <semantic-map.yaml> <flow.yaml>');
    process.exit(1);
  }
  const { parse } = require('yaml');
  const map: SemanticMap = parse(fs.readFileSync(mapFile, 'utf8'));

  const docs = parseAllDocuments(fs.readFileSync(flowFile, 'utf8'));
  if (docs.length !== 2) {
    throw new Error(
      `Maestro 形式（設定 → "---" → コマンドリスト）で書いてください。検出ドキュメント数: ${docs.length}`,
    );
  }
  const config = docs[0].toJS() as FlowConfig;
  const commands = docs[1].toJS() as Command[];
  if (!config?.page) throw new Error('設定セクションに page: が必要です');
  if (!Array.isArray(commands)) throw new Error('"---" の後はコマンドのリストにしてください');

  const fallbackName = path.basename(flowFile).replace(/\.flow\.ya?ml$|\.ya?ml$/, '');
  const code = compileFlow(map, config, commands, fallbackName);
  const out = flowFile.replace(/\.flow\.ya?ml$|\.ya?ml$/, '.spec.ts');
  fs.writeFileSync(out, code);
  console.log(`compiled: ${path.basename(flowFile)} → ${path.basename(out)}`);
}
