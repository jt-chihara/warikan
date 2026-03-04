import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateGroupPage from './CreateGroupPage';

// モック設定
const mockNavigate = vi.fn();
const mockCreateGroup = vi.fn();
const mockAddGroup = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../hooks/useGroup', () => ({
  useCreateGroup: () => [mockCreateGroup, { loading: false, error: null }],
}));

vi.mock('../hooks/useLocalGroups', () => ({
  useLocalGroups: () => ({ addGroup: mockAddGroup }),
}));

// crypto.randomUUID のモック
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${Math.random()}`,
  },
  writable: true,
});

const renderCreateGroupPage = () => {
  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      <MemoryRouter>
        <CreateGroupPage />
      </MemoryRouter>
    </MockedProvider>,
  );
};

describe('CreateGroupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('グループ作成フォームを表示する', () => {
    renderCreateGroupPage();

    expect(screen.getByText('新しいグループを作成')).toBeInTheDocument();
    expect(screen.getByLabelText('グループ名')).toBeInTheDocument();
    expect(screen.getByLabelText('説明（任意）')).toBeInTheDocument();
    expect(screen.getByText('通貨')).toBeInTheDocument();
    expect(screen.getByText('円 (JPY)')).toBeInTheDocument();
    expect(screen.getByText('メンバー')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'グループを作成して管理ページに移動' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'グループ作成をキャンセルしてホームページに戻る' }),
    ).toBeInTheDocument();
  });

  it('初期メンバー入力フィールドを持つ', () => {
    renderCreateGroupPage();

    const memberInputs = screen.getAllByPlaceholderText('メンバー名');
    expect(memberInputs).toHaveLength(1);
    expect(memberInputs[0]).toHaveValue('');
  });

  it('「メンバーを追加」クリック時にメンバー入力フィールドを追加する', async () => {
    const user = userEvent.setup();
    renderCreateGroupPage();

    const addMemberButton = screen.getByRole('button', { name: '新しいメンバーを追加' });
    await user.click(addMemberButton);

    const memberInputs = screen.getAllByPlaceholderText('メンバー名');
    expect(memberInputs).toHaveLength(2);
  });

  it('「削除」クリック時にメンバー入力フィールドを削除する', async () => {
    const user = userEvent.setup();
    renderCreateGroupPage();

    // メンバーを追加
    const addMemberButton = screen.getByRole('button', { name: '新しいメンバーを追加' });
    await user.click(addMemberButton);

    // 削除ボタンをクリック（複数ある場合は最初のものを選択）
    const removeButtons = screen.getAllByRole('button', { name: 'メンバーを削除' });
    await user.click(removeButtons[0]);

    const memberInputs = screen.getAllByPlaceholderText('メンバー名');
    expect(memberInputs).toHaveLength(1);
  });

  it('メンバーが1人の場合に削除ボタンを表示しない', () => {
    renderCreateGroupPage();

    const removeButtons = screen.queryAllByRole('button', { name: 'メンバーを削除' });
    expect(removeButtons).toHaveLength(0);
  });

  it('入力フィールドへの入力時にメンバー名を更新する', async () => {
    const user = userEvent.setup();
    renderCreateGroupPage();

    const memberInput = screen.getByPlaceholderText('メンバー名');
    await user.type(memberInput, 'Alice');

    expect(memberInput).toHaveValue('Alice');
  });

  it('メンバーなしで送信時にエラーモーダルを表示する', async () => {
    const user = userEvent.setup();
    renderCreateGroupPage();

    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');

    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);

    // 空のフォームがあるのでエラーモーダルが表示される
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('入力エラー')).toBeInTheDocument();
    expect(screen.getByText('すべてのメンバー名を入力してください。')).toBeInTheDocument();
  });

  it('メンバー1人で送信時にエラーモーダルを表示する', async () => {
    const user = userEvent.setup();
    renderCreateGroupPage();

    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');

    const memberInput = screen.getByPlaceholderText('メンバー名');
    await user.type(memberInput, 'Alice');

    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('入力エラー')).toBeInTheDocument();
    expect(screen.getByText('割り勘には少なくとも2人のメンバーが必要です。')).toBeInTheDocument();
    expect(mockCreateGroup).not.toHaveBeenCalled();
  });

  it('OKボタンクリック時にエラーモーダルを閉じる', async () => {
    const user = userEvent.setup();
    renderCreateGroupPage();

    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');

    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);

    // モーダルが表示される
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // OKボタンをクリック
    await user.click(screen.getByRole('button', { name: 'OK' }));

    // モーダルが閉じる
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('有効なデータでグループを正常に作成する', async () => {
    const user = userEvent.setup();
    const mockGroupData = {
      id: 'test-group-id',
      name: 'テストグループ',
      members: [
        { id: 'member-1', name: 'Alice' },
        { id: 'member-2', name: 'Bob' },
      ],
    };

    mockCreateGroup.mockResolvedValue({
      data: { createGroup: mockGroupData },
    });

    renderCreateGroupPage();

    // フォームに入力
    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');

    // メンバーを追加（2人必要）
    const addMemberButton = screen.getByRole('button', { name: '新しいメンバーを追加' });
    await user.click(addMemberButton);

    const memberInputs = screen.getAllByPlaceholderText('メンバー名');
    await user.type(memberInputs[0], 'Alice');
    await user.type(memberInputs[1], 'Bob');

    // フォーム送信
    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'テストグループ',
            currency: 'JPY',
            memberNames: ['Alice', 'Bob'],
          },
        },
      });
    });

    expect(mockAddGroup).toHaveBeenCalledWith(mockGroupData);
    expect(mockNavigate).toHaveBeenCalledWith('/groups/test-group-id');
  });

  it('説明が指定された場合に含める', async () => {
    const user = userEvent.setup();
    mockCreateGroup.mockResolvedValue({
      data: { createGroup: { id: 'test-id' } },
    });

    renderCreateGroupPage();

    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');

    const descriptionInput = screen.getByLabelText('説明（任意）');
    await user.type(descriptionInput, 'テスト説明');

    // メンバーを追加（2人必要）
    const addMemberButton = screen.getByRole('button', { name: '新しいメンバーを追加' });
    await user.click(addMemberButton);

    const memberInputs = screen.getAllByPlaceholderText('メンバー名');
    await user.type(memberInputs[0], 'Alice');
    await user.type(memberInputs[1], 'Bob');

    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'テストグループ',
            description: 'テスト説明',
            currency: 'JPY',
            memberNames: ['Alice', 'Bob'],
          },
        },
      });
    });
  });

  it('グループ作成エラーを処理する', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockCreateGroup.mockRejectedValue(new Error('作成エラー'));

    renderCreateGroupPage();

    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');

    // メンバーを追加（2人必要）
    const addMemberButton = screen.getByRole('button', { name: '新しいメンバーを追加' });
    await user.click(addMemberButton);

    const memberInputs = screen.getAllByPlaceholderText('メンバー名');
    await user.type(memberInputs[0], 'Alice');
    await user.type(memberInputs[1], 'Bob');

    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error creating group:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('キャンセルボタンクリック時にホームに遷移する', async () => {
    const user = userEvent.setup();
    renderCreateGroupPage();

    const cancelButton = screen.getByRole('button', {
      name: 'グループ作成をキャンセルしてホームページに戻る',
    });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('メンバー名の空白をトリムする', async () => {
    const user = userEvent.setup();
    mockCreateGroup.mockResolvedValue({
      data: { createGroup: { id: 'test-id' } },
    });

    renderCreateGroupPage();

    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');

    // メンバーを追加（2人必要）
    const addMemberButton = screen.getByRole('button', { name: '新しいメンバーを追加' });
    await user.click(addMemberButton);

    const memberInputs = screen.getAllByPlaceholderText('メンバー名');
    await user.type(memberInputs[0], '  Alice  ');
    await user.type(memberInputs[1], '  Bob  ');

    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'テストグループ',
            currency: 'JPY',
            memberNames: ['Alice', 'Bob'],
          },
        },
      });
    });
  });

  it('メンバー名が空の場合にエラーモーダルを表示する', async () => {
    const user = userEvent.setup();

    renderCreateGroupPage();

    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');

    // 3つのメンバー入力を追加（1つは空のまま）
    const addMemberButton = screen.getByRole('button', { name: '新しいメンバーを追加' });
    await user.click(addMemberButton);
    await user.click(addMemberButton);

    const memberInputs = screen.getAllByPlaceholderText('メンバー名');
    await user.type(memberInputs[0], 'Alice');
    await user.type(memberInputs[1], 'Bob');
    // 3番目は空のまま

    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('入力エラー')).toBeInTheDocument();
    expect(screen.getByText('すべてのメンバー名を入力してください。')).toBeInTheDocument();
    expect(mockCreateGroup).not.toHaveBeenCalled();
  });
});
