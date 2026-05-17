// src/hooks/useAuth.ts
// The key fix: initialize user state SYNCHRONOUSLY from localStorage so
// `loading` is never true when the value is already available.
// This prevents the App from flashing through a "loading" state that
// unmounts and remounts LoginPage mid-typing.

import { useState, useCallback } from "react";
import type { User } from "../types";

function readStoredUser(): User | null {
  try {
    const token    = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) return JSON.parse(userData) as User;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
  return null;
}

export function useAuth() {
  // Initialize synchronously — no useEffect, no loading flash
  const [user, setUser] = useState<User | null>(readStoredUser);

  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updated };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  return { user, loading: false, login, logout, updateUser };
}