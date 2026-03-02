import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export interface Group {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface GroupContextType {
  groups: Group[];
  currentGroup: Group | null;
  selectGroup: (groupId: string) => void;
  createGroup: (name: string) => Promise<void>;
  updateGroup: (groupId: string, name: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  inviteUser: (username: string) => Promise<void>;
  refreshGroups: () => Promise<void>;
  loading: boolean;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error('useGroup must be used within a GroupProvider');
  return context;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  });

  const fetchGroups = async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/groups`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (data && data.length > 0) {
           const adminGroup = data.find((g: Group) => g.role === 'admin') || data[0];
           setCurrentGroup(adminGroup);
        } else {
           setCurrentGroup(null);
        }
      }
    } catch (e) {
      console.error('GroupContext: Erro ao buscar grupos', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [isAuthenticated, token]);

  const selectGroup = (_groupId: string) => {};

  const createGroup = async (name: string) => {
    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
      });
      if (res.ok) await fetchGroups();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const inviteUser = async (username: string) => {
    if (!currentGroup) return;
    try {
      const res = await fetch(`${API_URL}/groups/${currentGroup.id}/invite`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'X-Group-ID': currentGroup.id },
        body: JSON.stringify({ username })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to invite');
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updateGroup = async (groupId: string, name: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'X-Group-ID': groupId },
        body: JSON.stringify({ name })
      });
      if (res.ok) await fetchGroups();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'X-Group-ID': groupId },
      });
      if (res.ok) {
        await fetchGroups();
        if (currentGroup?.id === groupId) setCurrentGroup(null);
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <GroupContext.Provider value={{
      groups, currentGroup, selectGroup,
      createGroup, updateGroup, deleteGroup, inviteUser, refreshGroups: fetchGroups, loading
    }}>
      {children}
    </GroupContext.Provider>
  );
};
