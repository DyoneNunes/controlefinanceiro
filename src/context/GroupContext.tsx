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
  const [loading, setLoading] = useState(false);

  // Helper to get raw headers for auth only (no group yet)
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  });

  // Helper to get headers with group (for invite, etc)
  const getGroupHeaders = () => ({
    ...getAuthHeaders(),
    'X-Group-ID': currentGroup?.id || ''
  });

  const fetchGroups = async () => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/groups`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        // Auto-select first group if none selected or if current selection is invalid
        if (data.length > 0) {
           // If current group is not in the new list (e.g. removed), reset to first
           const stillExists = currentGroup && data.find((g: Group) => g.id === currentGroup.id);
           if (!currentGroup || !stillExists) {
             setCurrentGroup(data[0]);
             // Persist preference could go here
           }
        }
      }
    } catch (e) {
      console.error('Failed to fetch groups', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [isAuthenticated, token]);

  const selectGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) setCurrentGroup(group);
  };

  const createGroup = async (name: string) => {
    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        await fetchGroups(); // Refresh list
        // We could setCurrentGroup here if the backend returned the full object structure matching Group interface
      }
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
        headers: getGroupHeaders(), // Needs group context to verify permissions
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

  return (
    <GroupContext.Provider value={{ 
      groups, currentGroup, selectGroup, 
      createGroup, inviteUser, refreshGroups: fetchGroups, loading 
    }}>
      {children}
    </GroupContext.Provider>
  );
};
