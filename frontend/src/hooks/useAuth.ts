// src/hooks/useAuth.ts

import { useState, useEffect } from "react";
import type { User } from "../types";

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token    = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try { setUser(JSON.parse(userData)); }
      catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Merges a partial update (e.g. { username, displayName, bio })
  // into the current user and persists to localStorage immediately.
  const updateUser = (updated: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updated };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  return { user, loading, login, logout, updateUser };
}