import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateGroup } from '../hooks/useGroup';
import { useLocalGroups } from '../hooks/useLocalGroups';
import type { CreateGroupInput } from '../types/group';

interface MemberInput {
  id: string;
  name: string;
}

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const [createGroup, { loading, error }] = useCreateGroup();
  const { addGroup } = useLocalGroups();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [currency] = useState('JPY');
  const [members, setMembers] = useState<MemberInput[]>([{ id: crypto.randomUUID(), name: '' }]);

  const handleAddMember = () => {
    setMembers([...members, { id: crypto.randomUUID(), name: '' }]);
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index].name = value;
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty member names
    const validMembers = members
      .filter((member) => member.name.trim() !== '')
      .map((member) => member.name.trim());

    if (validMembers.length === 0) {
      alert('少なくとも1人のメンバーを追加してください。');
      return;
    }

    try {
      const input: CreateGroupInput = {
        name: groupName,
        ...(description.trim() && { description: description.trim() }),
        currency,
        memberNames: validMembers,
      };

      const result = await createGroup({ variables: { input } });

      if (result.data?.createGroup) {
        // Save to local storage for offline functionality
        addGroup(result.data.createGroup);
        navigate(`/groups/${result.data.createGroup.id}`);
      }
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        新しいグループを作成
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
          <div className="text-red-800 dark:text-red-200">
            エラーが発生しました: {error.message}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 sm:space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow dark:shadow-2xl"
      >
        <div>
          <label
            htmlFor="groupName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            グループ名
          </label>
          <input
            type="text"
            id="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            placeholder="例: 熱海旅行"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            説明（任意）
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            placeholder="例: 2024年1月の熱海温泉旅行"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">通貨</span>
          <div className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100">
            円 (JPY)
          </div>
        </div>

        <div>
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              メンバー
            </legend>
            <div className="space-y-2">
              {members.map((member, index) => (
                <div key={member.id} className="flex gap-2">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleMemberChange(index, e.target.value)}
                    placeholder="メンバー名"
                    className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 text-sm sm:text-base"
                    aria-label={`メンバー ${index + 1} の名前`}
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(index)}
                      className="px-3 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 active:text-red-900 dark:active:text-red-200 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded transition-all duration-200"
                      aria-label={`${member.name || 'メンバー'}を削除`}
                    >
                      削除
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddMember}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 active:text-blue-900 dark:active:text-blue-200 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-all duration-200"
              aria-label="新しいメンバーを追加"
            >
              + メンバーを追加
            </button>
          </fieldset>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 active:bg-gray-100 dark:active:bg-gray-500 active:scale-95 w-full sm:w-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
            aria-label="グループ作成をキャンセルしてホームページに戻る"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 dark:active:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            aria-label="グループを作成して管理ページに移動"
          >
            {loading ? '作成中...' : 'グループを作成'}
          </button>
        </div>
      </form>
    </div>
  );
}
