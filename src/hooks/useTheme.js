import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

const KEY = "ipt:theme";
const dark = () => window.matchMedia("(prefers-color-scheme: dark)");

const stored = () => {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
};

/** Follows the system until the visitor picks a theme, then remembers it. */
export function useTheme(reducedMotion) {
  const [theme, setTheme] = useState(() => stored() ?? (dark().matches ? "dark" : "light"));

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    const bg = getComputedStyle(root).getPropertyValue("--paper").trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
  }, [theme]);

  useEffect(() => {
    const mq = dark();
    const onChange = (e) => !stored() && setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* not persisted */
    }
    if (!reducedMotion && document.startViewTransition) {
      document.startViewTransition(() => flushSync(() => setTheme(next)));
    } else {
      setTheme(next);
    }
  }, [theme, reducedMotion]);

  return { theme, toggle };
}
