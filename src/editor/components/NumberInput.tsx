import React, { useState, useEffect } from "react";

export interface NumberInputProps {
  value: number;
  onChange: (nextValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  isInteger?: boolean;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  isInteger = false,
  className = "field-input field-input-number",
  style,
  placeholder,
  disabled,
  id,
}) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commitValue = () => {
    const parsed = parseFloat(draft);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }

    let next = parsed;
    if (min !== undefined && next < min) {
      next = min;
    }
    if (max !== undefined && next > max) {
      next = max;
    }
    if (isInteger) {
      next = Math.round(next);
    }

    setDraft(String(next));
    if (next !== value) {
      onChange(next);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);

    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed)) {
      const inMin = min === undefined || parsed >= min;
      const inMax = max === undefined || parsed <= max;
      if (inMin && inMax) {
        const finalVal = isInteger ? Math.round(parsed) : parsed;
        if (finalVal !== value) {
          onChange(finalVal);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitValue();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setDraft(String(value));
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      step={step}
      className={className}
      style={style}
      placeholder={placeholder}
      disabled={disabled}
      value={draft}
      onChange={handleChange}
      onBlur={commitValue}
      onKeyDown={handleKeyDown}
    />
  );
};
