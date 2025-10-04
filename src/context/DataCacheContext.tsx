import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { api } from '../services/api';

interface CacheData {
  users: any[] | null;
  fmsList: any[] | null;
  projects: any[] | null;
  logs: any[] | null;
  lastFetched: {
    users: number;
    fmsList: number;
    projects: number;
    logs: number;
  };
}

interface DataCacheContextType {
  // Users
  getUsers: () => Promise<any[]>;
  invalidateUsers: () => void;
  
  // FMS
  getFMSList: () => Promise<any[]>;
  invalidateFMSList: () => void;
  
  // Projects
  getProjects: () => Promise<any[]>;
  getProjectsByUser: (username: string) => Promise<any[]>;
  invalidateProjects: () => void;
  
  // Logs
  getLogs: () => Promise<any[]>;
  invalidateLogs: () => void;
  
  // General
  invalidateAll: () => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const DataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<CacheData>({
    users: null,
    fmsList: null,
    projects: null,
    logs: null,
    lastFetched: {
      users: 0,
      fmsList: 0,
      projects: 0,
      logs: 0,
    },
  });

  const isCacheValid = useCallback((key: keyof CacheData['lastFetched']) => {
    return Date.now() - cache.lastFetched[key] < CACHE_DURATION;
  }, [cache.lastFetched]);

  const getUsers = useCallback(async (): Promise<any[]> => {
    if (cache.users && isCacheValid('users')) {
      return cache.users;
    }

    try {
      const response = await api.getUsers();
      const users = response.users || [];
      setCache(prev => ({
        ...prev,
        users,
        lastFetched: { ...prev.lastFetched, users: Date.now() }
      }));
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return cache.users || [];
    }
  }, [cache.users, isCacheValid]);

  const getFMSList = useCallback(async (): Promise<any[]> => {
    if (cache.fmsList && isCacheValid('fmsList')) {
      return cache.fmsList;
    }

    try {
      const response = await api.getAllFMS();
      const fmsList = response.fmsList || [];
      setCache(prev => ({
        ...prev,
        fmsList,
        lastFetched: { ...prev.lastFetched, fmsList: Date.now() }
      }));
      return fmsList;
    } catch (error) {
      console.error('Error fetching FMS list:', error);
      return cache.fmsList || [];
    }
  }, [cache.fmsList, isCacheValid]);

  const getProjects = useCallback(async (): Promise<any[]> => {
    if (cache.projects && isCacheValid('projects')) {
      return cache.projects;
    }

    try {
      const response = await api.getAllProjects();
      const projects = response.projects || [];
      setCache(prev => ({
        ...prev,
        projects,
        lastFetched: { ...prev.lastFetched, projects: Date.now() }
      }));
      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return cache.projects || [];
    }
  }, [cache.projects, isCacheValid]);

  const getProjectsByUser = useCallback(async (username: string): Promise<any[]> => {
    try {
      const response = await api.getProjectsByUser(username);
      return response.tasks || [];
    } catch (error) {
      console.error('Error fetching user projects:', error);
      return [];
    }
  }, []);

  const getLogs = useCallback(async (): Promise<any[]> => {
    if (cache.logs && isCacheValid('logs')) {
      return cache.logs;
    }

    try {
      const response = await api.getAllLogs();
      const logs = response.logs || [];
      setCache(prev => ({
        ...prev,
        logs,
        lastFetched: { ...prev.lastFetched, logs: Date.now() }
      }));
      return logs;
    } catch (error) {
      console.error('Error fetching logs:', error);
      return cache.logs || [];
    }
  }, [cache.logs, isCacheValid]);

  const invalidateUsers = useCallback(() => {
    setCache(prev => ({
      ...prev,
      users: null,
      lastFetched: { ...prev.lastFetched, users: 0 }
    }));
  }, []);

  const invalidateFMSList = useCallback(() => {
    setCache(prev => ({
      ...prev,
      fmsList: null,
      lastFetched: { ...prev.lastFetched, fmsList: 0 }
    }));
  }, []);

  const invalidateProjects = useCallback(() => {
    setCache(prev => ({
      ...prev,
      projects: null,
      lastFetched: { ...prev.lastFetched, projects: 0 }
    }));
  }, []);

  const invalidateLogs = useCallback(() => {
    setCache(prev => ({
      ...prev,
      logs: null,
      lastFetched: { ...prev.lastFetched, logs: 0 }
    }));
  }, []);

  const invalidateAll = useCallback(() => {
    setCache({
      users: null,
      fmsList: null,
      projects: null,
      logs: null,
      lastFetched: {
        users: 0,
        fmsList: 0,
        projects: 0,
        logs: 0,
      },
    });
  }, []);

  const value: DataCacheContextType = {
    getUsers,
    invalidateUsers,
    getFMSList,
    invalidateFMSList,
    getProjects,
    getProjectsByUser,
    invalidateProjects,
    getLogs,
    invalidateLogs,
    invalidateAll,
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = (): DataCacheContextType => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
};
