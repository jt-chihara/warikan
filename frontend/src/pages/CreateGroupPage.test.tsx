import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
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
    randomUUID: () => 'test-uuid-' + Math.random(),
  },
  writable: true,
});

const renderCreateGroupPage = () => {
  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      <MemoryRouter>
        <CreateGroupPage />
      </MemoryRouter>
    </MockedProvider>
  );
};

describe('CreateGroupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // alert のモック
    global.alert = vi.fn();
    
    // crypto.randomUUID のモック設定をbeforeEachで実行
    vi.clearAllMocks();
  });

  it('renders create group form', () => {
    renderCreateGroupPage();
    
    expect(screen.getByText('新しいグループを作成')).toBeInTheDocument();
    expect(screen.getByLabelText('グループ名')).toBeInTheDocument();
    expect(screen.getByLabelText('説明（任意）')).toBeInTheDocument();
    expect(screen.getByText('通貨')).toBeInTheDocument();
    expect(screen.getByText('円 (JPY)')).toBeInTheDocument();
    expect(screen.getByText('メンバー')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'グループを作成して管理ページに移動' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'グループ作成をキャンセルしてホームページに戻る' })).toBeInTheDocument();
  });

  it('has initial member input field', () => {
    renderCreateGroupPage();
    
    const memberInputs = screen.getAllByPlaceholderText('メンバー名');
    expect(memberInputs).toHaveLength(1);
    expect(memberInputs[0]).toHaveValue('');
  });

  it('adds member input field when "メンバーを追加" is clicked', async () => {
    const user = userEvent.setup();
    renderCreateGroupPage();
    
    const addMemberButton = screen.getByRole('button', { name: '新しいメンバーを追加' });
    await user.click(addMemberButton);
    
    const memberInputs = screen.getAllByPlaceholderText('メンバー名');
    expect(memberInputs).toHaveLength(2);
  });

  it('removes member input field when "削除" is clicked', async () => {
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

  it('does not show remove button when only one member exists', () => {
    renderCreateGroupPage();
    
    const removeButtons = screen.queryAllByRole('button', { name: 'メンバーを削除' });
    expect(removeButtons).toHaveLength(0);
  });

  it('updates member name when typing in input field', async () => {
    const user = userEvent.setup();
    renderCreateGroupPage();
    
    const memberInput = screen.getByPlaceholderText('メンバー名');
    await user.type(memberInput, 'Alice');
    
    expect(memberInput).toHaveValue('Alice');
  });

  it('shows alert when submitting without members', async () => {
    const user = userEvent.setup();
    renderCreateGroupPage();
    
    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');
    
    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);
    
    expect(global.alert).toHaveBeenCalledWith('少なくとも1人のメンバーを追加してください。');
  });

  it('creates group successfully with valid data', async () => {
    const user = userEvent.setup();
    const mockGroupData = {
      id: 'test-group-id',
      name: 'テストグループ',
      members: [{ id: 'member-1', name: 'Alice' }],
    };
    
    mockCreateGroup.mockResolvedValue({
      data: { createGroup: mockGroupData },
    });
    
    renderCreateGroupPage();
    
    // フォームに入力
    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');
    
    const memberInput = screen.getByPlaceholderText('メンバー名');
    await user.type(memberInput, 'Alice');
    
    // フォーム送信
    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'テストグループ',
            currency: 'JPY',
            memberNames: ['Alice'],
          },
        },
      });
    });
    
    expect(mockAddGroup).toHaveBeenCalledWith(mockGroupData);
    expect(mockNavigate).toHaveBeenCalledWith('/groups/test-group-id');
  });

  it('includes description when provided', async () => {
    const user = userEvent.setup();
    mockCreateGroup.mockResolvedValue({
      data: { createGroup: { id: 'test-id' } },
    });
    
    renderCreateGroupPage();
    
    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');
    
    const descriptionInput = screen.getByLabelText('説明（任意）');
    await user.type(descriptionInput, 'テスト説明');
    
    const memberInput = screen.getByPlaceholderText('メンバー名');
    await user.type(memberInput, 'Alice');
    
    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'テストグループ',
            description: 'テスト説明',
            currency: 'JPY',
            memberNames: ['Alice'],
          },
        },
      });
    });
  });

  it('handles create group error', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockCreateGroup.mockRejectedValue(new Error('作成エラー'));
    
    renderCreateGroupPage();
    
    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');
    
    const memberInput = screen.getByPlaceholderText('メンバー名');
    await user.type(memberInput, 'Alice');
    
    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error creating group:', expect.any(Error));
    });
    
    consoleError.mockRestore();
  });

  it('navigates to home when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderCreateGroupPage();
    
    const cancelButton = screen.getByRole('button', { name: 'グループ作成をキャンセルしてホームページに戻る' });
    await user.click(cancelButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('trims whitespace from member names', async () => {
    const user = userEvent.setup();
    mockCreateGroup.mockResolvedValue({
      data: { createGroup: { id: 'test-id' } },
    });
    
    renderCreateGroupPage();
    
    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');
    
    const memberInput = screen.getByPlaceholderText('メンバー名');
    await user.type(memberInput, '  Alice  ');
    
    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'テストグループ',
            currency: 'JPY',
            memberNames: ['Alice'], // トリムされている
          },
        },
      });
    });
  });

  it('filters out empty member names', async () => {
    const user = userEvent.setup();
    mockCreateGroup.mockResolvedValue({
      data: { createGroup: { id: 'test-id' } },
    });
    
    renderCreateGroupPage();
    
    const groupNameInput = screen.getByLabelText('グループ名');
    await user.type(groupNameInput, 'テストグループ');
    
    // 2つのメンバーを追加
    const addMemberButton = screen.getByRole('button', { name: '新しいメンバーを追加' });
    await user.click(addMemberButton);
    
    const memberInputs = screen.getAllByPlaceholderText('メンバー名');
    await user.type(memberInputs[0], 'Alice');
    // 2番目は空のまま
    
    const submitButton = screen.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'テストグループ',
            currency: 'JPY',
            memberNames: ['Alice'], // 空の名前は除外される
          },
        },
      });
    });
  });
});