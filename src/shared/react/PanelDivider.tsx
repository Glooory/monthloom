import { useRef, useState } from "react";
import "./panel-divider.css";

interface PanelWidthOptions {
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  availableWidth?: number;
}

export function usePanelWidth({
  storageKey, defaultWidth, minWidth, maxWidth, availableWidth = maxWidth,
}: PanelWidthOptions) {
  const limit = Math.max(minWidth, Math.min(maxWidth, availableWidth));
  const [preferredWidth, setPreferredWidth] = useState(() => {
    try {
      const saved = Number(window.localStorage.getItem(storageKey));
      if (saved >= minWidth && saved <= maxWidth) return saved;
    } catch {
      // The panel still works when browser storage is unavailable.
    }
    return defaultWidth;
  });

  return {
    width: Math.min(preferredWidth, limit),
    minWidth,
    maxWidth: limit,
    defaultWidth,
    onResize: setPreferredWidth,
    onResizeEnd: (width: number) => {
      try {
        window.localStorage.setItem(storageKey, String(width));
      } catch {
        // The panel still works when browser storage is unavailable.
      }
    },
  };
}

interface PanelDividerProps {
  label: string;
  side: "left" | "right";
  width: number;
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
  onResize: (width: number) => void;
  onResizeEnd: (width: number) => void;
  percentage?: boolean;
  className?: string;
}

export function PanelDivider({
  label, side, width, minWidth, maxWidth, defaultWidth, onResize, onResizeEnd,
  percentage = false, className,
}: PanelDividerProps) {
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startWidth: number;
    scale: number;
    lastWidth?: number;
  } | null>(null);
  const direction = side === "left" ? 1 : -1;
  const clamp = (value: number) => Math.min(maxWidth, Math.max(minWidth, value));

  const finishDrag = (pointerId: number) => {
    const current = drag.current;
    if (current?.pointerId !== pointerId) return;
    drag.current = null;
    if (current.lastWidth !== undefined) onResizeEnd(current.lastWidth);
  };

  const resizeAndSave = (value: number) => {
    onResize(value);
    onResizeEnd(value);
  };

  return (
    <div
      className={className ? `panel-divider ${className}` : "panel-divider"}
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      aria-valuenow={Math.round(width)}
      aria-valuetext={`${Math.round(width)}${percentage ? "%" : " px"}`}
      title={label}
      onPointerDown={(event) => {
        if (event.button !== 0 || drag.current) return;
        const containerWidth = event.currentTarget.parentElement?.getBoundingClientRect().width ?? 0;
        if (containerWidth <= 0) return;
        event.preventDefault();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startWidth: width,
          scale: percentage ? 100 / containerWidth : 1,
        };
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (current?.pointerId !== event.pointerId) return;
        const next = clamp(current.startWidth + (event.clientX - current.startX) * current.scale * direction);
        if (next === (current.lastWidth ?? current.startWidth)) return;
        current.lastWidth = next;
        onResize(next);
      }}
      onPointerUp={(event) => finishDrag(event.pointerId)}
      onPointerCancel={(event) => finishDrag(event.pointerId)}
      onLostPointerCapture={(event) => finishDrag(event.pointerId)}
      onDoubleClick={() => resizeAndSave(defaultWidth)}
      onKeyDown={(event) => {
        if (drag.current || event.altKey || event.ctrlKey || event.metaKey) return;
        const step = percentage ? 2 : 10;
        switch (event.key) {
          case "ArrowLeft":
            resizeAndSave(clamp(width - direction * step));
            break;
          case "ArrowRight":
            resizeAndSave(clamp(width + direction * step));
            break;
          case "Home":
            resizeAndSave(minWidth);
            break;
          case "End":
            resizeAndSave(maxWidth);
            break;
          default:
            return;
        }
        event.preventDefault();
      }}
    />
  );
}
