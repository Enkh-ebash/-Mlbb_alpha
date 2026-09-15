"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";

interface CurrentUser {
  id: string;
  username: string;
  email: string;
  role: string;
  eloRating: number;
  mlbbProfile: { mlbbId: string; zoneId: string; inGameName: string } | null;
}

interface AuthContextValue {
  token: string | null;
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "mlbb_play_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (t?: string) => {
    const activeToken = t ?? token;
    if (!activeToken) {
      setUser(null);
      return;
    }
    const me = await api.auth.me(activeToken);
    setUser(me);
  }, [token]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setToken(stored);
      api.auth
        .me(stored)
        .then(setUser)
        .catch(() => {
          window.localStorage.removeItem(STORAGE_KEY);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    window.localStorage.setItem(STORAGE_KEY, res.token);
    setToken(res.token);
    await refreshUser(res.token);
  }, [refreshUser]);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await api.auth.register({ username, email, password });
    window.localStorage.setItem(STORAGE_KEY, res.token);
    setToken(res.token);
    await refreshUser(res.token);
  }, [refreshUser]);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
