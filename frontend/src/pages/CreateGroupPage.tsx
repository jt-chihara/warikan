import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateGroup } from '../hooks/useGroup';
import { useLocalGroups } from '../hooks/useLocalGroups';
import type { CreateGroupInput } from '../types/group';

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const [createGroup, { loading, error }] = useCreateGroup();
  const { addGroup } = useLocalGroups();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('JPY');
  const [members, setMembers] = useState(['']);

  const handleAddMember = () => {
    setMembers([...members, '']);
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty member names
    const validMembers = members.filter(member => member.trim() !== '');
    
    if (validMembers.length === 0) {
      alert('少なくとも1人のメンバーを追加してください。');
      return;
    }

    try {
      const input: CreateGroupInput = {
        name: groupName,
        description: description.trim() || undefined,
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
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">新しいグループを作成</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            エラーが発生しました: {error.message}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
            グループ名
          </label>
          <input
            type="text"
            id="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="例: 熱海旅行"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            説明（任意）
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="例: 2024年1月の熱海温泉旅行"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            通貨
          </label>
          <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
            円 (JPY)
          </div>
        </div>

        <div>
          <label htmlFor="members" className="block text-sm font-medium text-gray-700 mb-2">
            メンバー
          </label>
          <div className="space-y-2">
            {members.map((member, index) => (
              <div key={`member-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={member}
                  onChange={(e) => handleMemberChange(index, e.target.value)}
                  placeholder="メンバー名"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
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
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            + メンバーを追加
          </button>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '作成中...' : 'グループを作成'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
