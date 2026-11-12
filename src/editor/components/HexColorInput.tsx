import { useEffect, useState } from "react";

export function HexColorInput({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (color: string) => void;
}) {
  const [draft, setDraft] = useState(value.replace(/^#/, ""));

  useEffect(() => setDraft(value.replace(/^#/, "")), [value]);

  const commit = () => {
    const hex = draft.trim().replace(/^#/, "");
    if (!/^([\da-f]{3}|[\da-f]{6})$/i.test(hex)) {
      setDraft(value.replace(/^#/, ""));
      return;
    }
    const expanded = hex.length === 3
      ? hex.split("").map((digit) => digit + digit).join("")
      : hex;
    const color = `#${expanded.toUpperCase()}`;
    setDraft(color.slice(1));
    if (color.toLowerCase() !== value.toLowerCase()) onChange(color);
  };

  return (
    <input
      type="text"
      className="field-input field-input-hex"
      aria-label={`${label} (HEX)`}
      value={draft}
      placeholder="RRGGBB"
      spellCheck={false}
      autoComplete="off"
      onChange={(event) => setDraft(event.target.value.trim().replace(/^#/, ""))}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        } else if (event.key === "Escape") {
          event.preventDefault();
          setDraft(value.replace(/^#/, ""));
        }
      }}
    />
  );
}
