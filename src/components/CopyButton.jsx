import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for insecure contexts and older browsers.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export default function CopyButton({ text, label, onCopied, className = "" }) {
  const [done, setDone] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => setDone(false), [text]);

  return (
    <button
      type="button"
      className={`icon-button copy-button ${className}`}
      data-done={done || undefined}
      aria-label={done ? `${label}: copied` : label}
      title={label}
      onClick={async () => {
        if (!(await copyText(text))) return;
        setDone(true);
        onCopied?.();
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? <Icon name="check" size={18} /> : <Icon name="copy" size={18} />}
    </button>
  );
}
