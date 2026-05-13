// src/hooks/useDarkMode.ts
import { useState, useEffect } from "react";

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("cc-theme");
      if (stored) return stored === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("cc-theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
}