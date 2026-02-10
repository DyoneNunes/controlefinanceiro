import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';

const GroupManager: React.FC = () => {
  const { groups, currentGroup, selectGroup, createGroup, updateGroup, deleteGroup, inviteUser, loading } = useGroup();
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setFeedback({ message: 'Group name cannot be empty.', type: 'error' });
      return;
    }
    try {
      await createGroup(newGroupName);
      setNewGroupName('');
      setFeedback({ message: 'Group created successfully!', type: 'success' });
    } catch (error: any) {
      setFeedback({ message: error.message || 'Failed to create group.', type: 'error' });
    }
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!editingGroupName.trim()) {
      setFeedback({ message: 'Group name cannot be empty.', type: 'error' });
      return;
    }
    try {
      await updateGroup(groupId, editingGroupName);
      setEditingGroupId(null);
      setEditingGroupName('');
      setFeedback({ message: 'Group updated successfully!', type: 'success' });
    } catch (error: any) {
      setFeedback({ message: error.message || 'Failed to update group.', type: 'error' });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    try {
      await deleteGroup(groupId);
      setFeedback({ message: 'Group deleted successfully!', type: 'success' });
    } catch (error: any) {
      setFeedback({ message: error.message || 'Failed to delete group.', type: 'error' });
    }
  };

  const handleInviteUser = async () => {
    if (!inviteUsername.trim()) {
      setFeedback({ message: 'Username cannot be empty.', type: 'error' });
      return;
    }
    try {
      await inviteUser(inviteUsername);
      setInviteUsername('');
      setFeedback({ message: `User ${inviteUsername} invited!`, type: 'success' });
    } catch (error: any) {
      setFeedback({ message: error.message || 'Failed to invite user.', type: 'error' });
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Group Management</h2>

      {feedback && (
        <div className={`p-2 mb-4 rounded ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {feedback.message}
        </div>
      )}

      <div className="mb-6 p-4 border rounded shadow-sm">
        <h3 className="text-xl font-semibold mb-3">Create New Group</h3>
        <input
          type="text"
          className="w-full p-2 border rounded mb-2"
          placeholder="New group name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={handleCreateGroup}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          Create Group
        </button>
      </div>

      <div className="mb-6 p-4 border rounded shadow-sm">
        <h3 className="text-xl font-semibold mb-3">Your Groups</h3>
        {loading ? (
          <p>Loading groups...</p>
        ) : groups.length === 0 ? (
          <p>No groups found. Create one above!</p>
        ) : (
          <ul>
            {groups.map((group) => (
              <li key={group.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border-b last:border-b-0">
                {editingGroupId === group.id ? (
                  <div className="flex-grow w-full sm:w-auto mb-2 sm:mb-0">
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                    />
                  </div>
                ) : (
                  <span className="flex-grow text-lg font-medium">{group.name} ({group.role})</span>
                )}
                
                <div className="flex space-x-2 mt-2 sm:mt-0">
                  {editingGroupId === group.id ? (
                    <>
                      <button onClick={() => handleUpdateGroup(group.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Save</button>
                      <button onClick={() => setEditingGroupId(null)} className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => selectGroup(group.id)}
                        className={`px-3 py-1 rounded text-sm ${currentGroup?.id === group.id ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'}`}
                        disabled={currentGroup?.id === group.id}
                      >
                        {currentGroup?.id === group.id ? 'Selected' : 'Select'}
                      </button>
                      {group.role === 'admin' && (
                        <>
                          <button onClick={() => { setEditingGroupId(group.id); setEditingGroupName(group.name); }} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">Edit</button>
                          <button onClick={() => handleDeleteGroup(group.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Delete</button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {currentGroup && currentGroup.role === 'admin' && (
        <div className="p-4 border rounded shadow-sm">
          <h3 className="text-xl font-semibold mb-3">Invite User to {currentGroup.name}</h3>
          <input
            type="text"
            className="w-full p-2 border rounded mb-2"
            placeholder="Username to invite"
            value={inviteUsername}
            onChange={(e) => setInviteUsername(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleInviteUser}
            className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600 disabled:opacity-50"
            disabled={loading}
          >
            Invite User
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupManager;
