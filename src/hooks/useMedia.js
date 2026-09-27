import { useEffect, useState } from "react";

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/** Current time, re-rendering on each minute boundary. */
export function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer;
    const tick = () => {
      setNow(new Date());
      timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    };
    timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    return () => clearTimeout(timer);
  }, []);
  return now;
}
