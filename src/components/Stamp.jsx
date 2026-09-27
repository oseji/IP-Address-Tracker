/** Rubber-stamp status mark. Re-key it to replay the press. */
export default function Stamp({ tone = "blue", children }) {
  return (
    <span className="stamp" data-tone={tone}>
      {children}
    </span>
  );
}
