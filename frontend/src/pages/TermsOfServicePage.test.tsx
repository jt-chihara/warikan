import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TermsOfServicePage from './TermsOfServicePage';

describe('TermsOfServicePage', () => {
  it('renders terms of service page correctly', () => {
    render(<TermsOfServicePage />);

    // ページタイトルが表示されることを確認
    expect(screen.getByText('利用規約')).toBeInTheDocument();

    // 各条項のタイトルが表示されることを確認
    expect(screen.getByText('第1条（適用）')).toBeInTheDocument();
    expect(screen.getByText('第2条（利用登録）')).toBeInTheDocument();
    expect(screen.getByText('第3条（禁止事項）')).toBeInTheDocument();
    expect(screen.getByText('第4条（本サービスの提供の停止等）')).toBeInTheDocument();
    expect(screen.getByText('第5条（著作権）')).toBeInTheDocument();
    expect(screen.getByText('第6条（免責事項）')).toBeInTheDocument();
    expect(screen.getByText('第7条（サービス内容の変更等）')).toBeInTheDocument();
    expect(screen.getByText('第8条（利用規約の変更）')).toBeInTheDocument();
    expect(screen.getByText('第9条（個人情報の取扱い）')).toBeInTheDocument();
    expect(screen.getByText('第10条（通知または連絡）')).toBeInTheDocument();
    expect(screen.getByText('第11条（権利義務の譲渡の禁止）')).toBeInTheDocument();
    expect(screen.getByText('第12条（準拠法・裁判管轄）')).toBeInTheDocument();
  });

  it('displays service description', () => {
    render(<TermsOfServicePage />);

    expect(
      screen.getByText(
        /本利用規約（以下「本規約」）は、jt-chihara（以下「当方」）が提供する割り勘アプリ「warikan」/,
      ),
    ).toBeInTheDocument();
  });

  it('shows prohibited actions list', () => {
    render(<TermsOfServicePage />);

    expect(screen.getByText('法令または公序良俗に違反する行為')).toBeInTheDocument();
    expect(screen.getByText('犯罪行為に関連する行為')).toBeInTheDocument();
    expect(screen.getByText('不正アクセスをし、またはこれを試みる行為')).toBeInTheDocument();
    expect(
      screen.getByText('他のユーザーに関する個人情報等を収集または蓄積する行為'),
    ).toBeInTheDocument();
  });

  it('displays service suspension conditions', () => {
    render(<TermsOfServicePage />);

    expect(
      screen.getByText('本サービスにかかるコンピュータシステムの保守点検または更新を行う場合'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('コンピュータまたは通信回線等が事故により停止した場合'),
    ).toBeInTheDocument();
  });

  it('shows terms creation and update dates', () => {
    render(<TermsOfServicePage />);

    expect(screen.getByText('制定日：2025年7月23日')).toBeInTheDocument();
    expect(screen.getByText('最終更新日：2025年7月23日')).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<TermsOfServicePage />);

    // h1要素が存在することを確認
    expect(screen.getByRole('heading', { level: 1, name: '利用規約' })).toBeInTheDocument();

    // 各条項がh2要素として構造化されていることを確認
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(12); // 12の条項
  });

  it('displays copyright and disclaimer sections', () => {
    render(<TermsOfServicePage />);

    // 著作権関連の文言
    expect(
      screen.getByText(/ユーザーは、自ら著作権等の必要な知的財産権を有するか/),
    ).toBeInTheDocument();

    // 免責事項関連の文言
    expect(screen.getByText(/当方は、本サービスに事実上または法律上の瑕疵/)).toBeInTheDocument();
  });

  it('shows jurisdiction information', () => {
    render(<TermsOfServicePage />);

    expect(
      screen.getByText(/本規約の解釈にあたっては、日本法を準拠法とします/),
    ).toBeInTheDocument();
  });
});
