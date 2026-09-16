import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: Role;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    role?: Role;
    organization?: string;
    govt_id_url?: string;
    govt_id_number?: string;
    govt_id_type?: string;
  }) => Promise<void>;
  logout: () => void;
  switchRole: (role: Role) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('civicsetu_token') || localStorage.getItem('samaadhaan_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('civicsetu_token') || localStorage.getItem('samaadhaan_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          // Token expired or invalid, auto-login as default demo citizen for smooth preview
          try {
            const demo = await api.switchDemoRole('citizen');
            setUser(demo.user);
            setToken(demo.token);
            localStorage.setItem('civicsetu_token', demo.token);
          } catch {
            localStorage.removeItem('civicsetu_token');
            localStorage.removeItem('samaadhaan_token');
            setUser(null);
            setToken(null);
          }
        }
      } else {
        // Auto initialize as demo citizen so visitors can experience live features right away
        try {
          const demo = await api.switchDemoRole('citizen');
          setUser(demo.user);
          setToken(demo.token);
          localStorage.setItem('civicsetu_token', demo.token);
        } catch {
          // Ignore
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(identifier, password);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('civicsetu_token', res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    role?: Role;
    organization?: string;
    govt_id_url?: string;
    govt_id_number?: string;
    govt_id_type?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('civicsetu_token', res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('civicsetu_token');
    localStorage.removeItem('samaadhaan_token');
  };

  const switchRole = async (newRole: Role) => {
    setIsLoading(true);
    try {
      const res = await api.switchDemoRole(newRole);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('civicsetu_token', res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      // Ignore
    }
  };

  const role: Role = user?.role || 'citizen';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        role,
        isLoading,
        login,
        register,
        logout,
        switchRole,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
