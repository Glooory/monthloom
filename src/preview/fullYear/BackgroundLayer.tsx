import { useEffect, useMemo, useRef, useState } from "react";
import { fitBackground, getPageBackground, resizeBackground } from "../../domain/pagePreview/background";
import type { Rect } from "../../domain/pagePreview/types";
import { useDocumentStore } from "../../editor/state/documentStore";
import { useUiStore } from "../../editor/state/uiStore";
import { persistentAssetStore } from "../../editor/assets/persistentAssetStore";
import type { AssetResolver } from "../../resources/assets/types";
import { usePreviewResource } from "../../shared/react/usePreviewResource";
import { useI18n } from "../../shared/i18n/i18nStore";
import { loadBackground } from "../../resources/assets/loadBackground";

type Corner = "nw" | "ne" | "sw" | "se";
export function BackgroundLayer({ month, page, assetResolver = persistentAssetStore }: {
  month: string; page: { width: number; height: number }; assetResolver?: AssetResolver;
}) {
  const { t } = useI18n();
  const config = useDocumentStore((s) => s.document.pagePreview);
  const background = getPageBackground(config, month);
  const selected = useUiStore((s) => s.backgroundMonth);
  const editing = useUiStore((s) => s.editingBackground) && selected === month;
  const key = useMemo(() => ({ assetId: background?.assetId, assetResolver }), [background?.assetId, assetResolver]);
  const resource = usePreviewResource({ resourceKey: key, retainPrevious: false,
    load: () => loadBackground(key.assetId ? { assetId: key.assetId } : null, assetResolver) });
  const [draft, setDraft] = useState<Rect | null>(null);
  const drag = useRef<{ id: number; startX: number; startY: number; scale: number; rect: Rect;
    next: Rect; corner?: Corner; document: ReturnType<typeof useDocumentStore.getState>["document"] } | null>(null);
  const overlay = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!editing) return;
    const dismiss = () => {
      drag.current = null;
      setDraft(null);
      useUiStore.getState().setEditingBackground(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || overlay.current?.contains(target) ||
        target.closest(".background-settings, .full-year-page-label button")) return;
      dismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [editing]);
  const rect = draft ?? background?.rect ?? (resource.value ? fitBackground(page, resource.value) : null);
  const start = (event: React.PointerEvent<HTMLElement>, corner?: Corner) => {
    if (!rect || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = overlay.current!.getBoundingClientRect();
    const scale = page.width / bounds.width;
    const x = (event.clientX - bounds.left) * scale;
    const y = (event.clientY - bounds.top) * scale;
    if (!corner && (x < rect.x || x > rect.x + rect.width || y < rect.y || y > rect.y + rect.height)) {
      useUiStore.getState().setEditingBackground(false);
      return;
    }
    (event.currentTarget.closest(".background-edit-overlay") as HTMLElement).focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY,
      scale, rect, next: rect, corner, document: useDocumentStore.getState().document };
  };
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = drag.current;
    if (!session || session.id !== event.pointerId) return;
    const dx = (event.clientX - session.startX) * session.scale;
    const dy = (event.clientY - session.startY) * session.scale;
    session.next = session.corner ? resizeBackground(session.rect, dx, dy, session.corner)
      : { ...session.rect, x: session.rect.x + dx, y: session.rect.y + dy };
    setDraft(session.next);
  };
  const finish = (event: React.PointerEvent<HTMLDivElement>, cancel = false) => {
    const session = drag.current;
    if (!session || session.id !== event.pointerId) return;
    drag.current = null;
    setDraft(null);
    const state = useDocumentStore.getState();
    if (cancel || !background || state.document !== session.document || session.next === session.rect) return;
    state.commitDocument({ ...state.document, pagePreview: { ...state.document.pagePreview,
      backgrounds: { ...state.document.pagePreview.backgrounds, [month]: { ...background, rect: session.next } } } });
  };
  if (resource.error) return <div className="background-error" role="alert">{resource.error.message}
    <button type="button" onClick={resource.retry}>{t.pagePreview.retryBackground}</button></div>;
  return <>
    {background && resource.loading && <div className="background-load-status" role="status">{t.pagePreview.loadingBackground}</div>}
    {resource.value && rect && <img src={resource.value.uri} alt="" aria-hidden="true" draggable={false}
      className="page-preview-bg" style={{ left: `${rect.x / page.width * 100}%`, top: `${rect.y / page.height * 100}%`,
        width: `${rect.width / page.width * 100}%`, height: `${rect.height / page.height * 100}%` }} />}
    {editing && rect && resource.value && <div ref={overlay} className="background-edit-overlay" role="group" tabIndex={0} aria-label={t.pagePreview.editBackground}
      onClick={(e) => e.stopPropagation()} onPointerDown={(e) => start(e)} onPointerMove={move}
      onPointerUp={(e) => finish(e)} onPointerCancel={(e) => finish(e, true)} onLostPointerCapture={(e) => finish(e, true)}
      onKeyDown={(e) => { if (e.key === "Escape") { drag.current = null; setDraft(null); useUiStore.getState().setEditingBackground(false); } }}>
      <div className="background-edit-outline" style={{ left: `${rect.x / page.width * 100}%`, top: `${rect.y / page.height * 100}%`,
        width: `${rect.width / page.width * 100}%`, height: `${rect.height / page.height * 100}%` }} />
      {(["nw", "ne", "sw", "se"] as const).map((corner) => <span key={corner} className="background-resize-handle"
        title={t.pagePreview.resizeBackground} style={{ cursor: `${corner}-resize`,
          left: `${Math.max(1, Math.min(99, (rect.x + (corner.includes("w") ? 0 : rect.width)) / page.width * 100))}%`,
          top: `${Math.max(1, Math.min(99, (rect.y + (corner.includes("n") ? 0 : rect.height)) / page.height * 100))}%` }}
        onPointerDown={(e) => start(e, corner)} />)}
    </div>}
  </>;
}
