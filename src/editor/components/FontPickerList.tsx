import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LocalFontOption } from "../fonts/localFonts";
import { localFontWeight } from "../fonts/localFonts";
import { ensureGoogleFontPreview, getGoogleFontPreviewFace } from "../fonts/googleFontPreview";

export type FontPickerRow =
  | { kind: "header"; label: string }
  | { kind: "google"; family: string; value: string }
  | { kind: "local"; face: LocalFontOption; value: string };

const ROW_HEIGHT = 44;
const VIEWPORT_HEIGHT = 264;
const OVERSCAN = 3;

function GoogleFontOption({ family }: { family: string }) {
  const face = getGoogleFontPreviewFace(family);
  useEffect(() => {
    const timer = window.setTimeout(() => ensureGoogleFontPreview(family), 120);
    return () => window.clearTimeout(timer);
  }, [family]);

  return <span style={{ fontFamily: family, fontWeight: face?.weight, fontStyle: face?.style, fontSize: 15 }}>{family}</span>;
}

export function FontPickerList({
  id,
  rows,
  selectedValue,
  label,
  initialIndex,
  maxHeight = VIEWPORT_HEIGHT,
  onSelect,
  onClose,
}: {
  id: string;
  rows: readonly FontPickerRow[];
  selectedValue: string;
  label: string;
  initialIndex: number;
  maxHeight?: number;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const initialTop = Math.max(0, (initialIndex - 2) * ROW_HEIGHT);
  const [scrollTop, setScrollTop] = useState(initialTop);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const viewportHeight = Math.min(maxHeight, rows.length * ROW_HEIGHT);
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN);

  useLayoutEffect(() => {
    if (listRef.current) listRef.current.scrollTop = initialTop;
  }, [initialTop]);

  const moveActive = (direction: -1 | 1) => {
    let next = activeIndex;
    do { next += direction; } while (rows[next]?.kind === "header");
    if (next < 0 || next >= rows.length) return;
    setActiveIndex(next);
    const top = next * ROW_HEIGHT;
    const current = listRef.current?.scrollTop ?? scrollTop;
    const nextScroll = top < current ? top
      : top + ROW_HEIGHT > current + viewportHeight ? top + ROW_HEIGHT - viewportHeight
      : current;
    if (listRef.current) listRef.current.scrollTop = nextScroll;
    setScrollTop(nextScroll);
  };

  return (
    <div
      id={id}
      ref={listRef}
      className="font-picker-list"
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={activeIndex >= start && activeIndex < end && rows[activeIndex]?.kind !== "header"
        ? `font-picker-option-${activeIndex}` : undefined}
      style={{ height: viewportHeight }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          moveActive(event.key === "ArrowDown" ? 1 : -1);
        } else if (event.key === "Enter") {
          const row = rows[activeIndex];
          if (row && row.kind !== "header") onSelect(row.value);
        } else if (event.key === "Escape") {
          onClose();
        }
      }}
    >
      <div className="font-picker-list-content" style={{ height: rows.length * ROW_HEIGHT }}>
        {rows.slice(start, end).map((row, offset) => {
          const index = start + offset;
          return row.kind === "header" ? (
            <div key={`header-${index}`} className="font-picker-group-label"
              style={{ top: index * ROW_HEIGHT }}>
              {row.label}
            </div>
          ) : (
            <button
              key={row.value}
              id={`font-picker-option-${index}`}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={row.value === selectedValue}
              data-active={index === activeIndex}
              className="font-picker-option"
              style={{ top: index * ROW_HEIGHT }}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => onSelect(row.value)}
            >
              {row.kind === "google" ? (
                <GoogleFontOption family={row.family} />
              ) : (
                <span style={{
                  fontFamily: row.face.family,
                  fontWeight: localFontWeight(row.face.style),
                  fontStyle: /italic|oblique/i.test(row.face.style) ? "italic" : "normal",
                  fontSize: 15,
                }}>
                  {row.face.family} — {row.face.style}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
