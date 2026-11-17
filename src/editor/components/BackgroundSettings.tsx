import { useEffect, useMemo, useRef, useState } from "react";
import { getFullYearPageDefinitions } from "../../domain/pagePreview/fullYearPages";
import { fitBackground, getPageBackground } from "../../domain/pagePreview/background";
import type { PageBackground, PagePreviewConfig } from "../../domain/pagePreview/types";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";
import { useDocumentStore } from "../state/documentStore";
import { useUiStore } from "../state/uiStore";
import { persistentAssetStore } from "../assets/persistentAssetStore";
import { loadBackground } from "../../resources/assets/loadBackground";
import { usePreviewResource } from "../../shared/react/usePreviewResource";
import { useI18n } from "../../shared/i18n/i18nStore";
import { NumberInput } from "./NumberInput";
import type { AssetStoreLike } from "./PagePreviewSettings";

export function BackgroundSettings({ config, onChange, assetStore, onMonthChange }: {
  config: PagePreviewConfig;
  onChange: (next: PagePreviewConfig) => void;
  assetStore?: AssetStoreLike;
  onMonthChange?: (month: string) => void;
}) {
  const { t } = useI18n();
  const labels = t.pagePreview;
  const targetYear = useWorkspaceStore((s) => s.targetYear);
  const pages = getFullYearPageDefinitions(targetYear);
  const selected = useUiStore((s) => s.backgroundMonth);
  const editing = useUiStore((s) => s.editingBackground);
  const month = pages.some((p) => p.label === selected) ? selected! : pages[0].label;
  const background = getPageBackground(config, month);
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Async uploads apply to the captured month, using the latest config and callback.
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const latest = useRef({ config, onChange });
  latest.current = { config, onChange };
  const resolver = useMemo(() => assetStore?.resolve
    ? { resolve: assetStore.resolve.bind(assetStore) } : persistentAssetStore, [assetStore]);
  const key = useMemo(() => ({ assetId: background?.assetId, resolver }), [background?.assetId, resolver]);
  const resource = usePreviewResource({ resourceKey: key, retainPrevious: false,
    load: () => loadBackground(key.assetId ? { assetId: key.assetId } : null, resolver) });
  const rect = background?.rect ?? (resource.value ? fitBackground(config.layout, resource.value) : null);
  const update = (value: PageBackground | null, targetMonth = month) => {
    const { config: current, onChange: change } = latest.current;
    change({ ...current, backgrounds: { ...current.backgrounds, [targetMonth]: value } });
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !assetStore) return;
    const targetMonth = month;
    const sourceConfig = config;
    const sourceDocument = useDocumentStore.getState().document;
    setUploading(true);
    setError(null);
    try {
      const assetId = await assetStore.addImage(file);
      await loadBackground({ assetId }, resolver);
      // Do not apply an upload to a different project opened while it was loading.
      if (!mounted.current) return;
      if (latest.current.config !== sourceConfig || useDocumentStore.getState().document !== sourceDocument)
        throw new Error(labels.uploadInterrupted);
      update({ assetId }, targetMonth);
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      if (mounted.current) setUploading(false);
    }
  };
  return <div className="background-settings">
    <div className="background-settings-row">
      <label className="field-row background-month-field"><span className="field-label">{labels.backgroundMonth}</span>
        <select className="field-input" value={month} onChange={(e) => { useUiStore.getState().setBackgroundMonth(e.target.value); onMonthChange?.(e.target.value); }}>
          {pages.map((page) => <option key={page.label} value={page.label}>{page.label}</option>)}
        </select>
      </label>
      <input ref={input} type="file" accept="image/*" hidden onChange={(event) => void upload(event)} />
      <button type="button" className="studio-btn studio-btn-secondary" disabled={uploading || !assetStore}
        onClick={() => input.current?.click()}>{uploading ? labels.loadingBackground : background ? labels.replaceBackground : labels.uploadBackground}</button>
    </div>
    <div className="background-settings-row">
      <button type="button" className="studio-btn studio-btn-secondary background-edit-button" aria-pressed={editing} onClick={() => {
        useUiStore.getState().setBackgroundMonth(month);
        useUiStore.getState().setEditingBackground(!editing);
      }}>{editing ? labels.finishBackground : labels.editBackground}</button>
      {background && <button type="button" className="studio-btn studio-btn-secondary background-clear-button" onClick={() => update(null)}>{labels.clearBackground}</button>}
      <button type="button" className="studio-btn studio-btn-secondary" disabled={uploading} onClick={() => {
        if (!window.confirm(labels.applyBackgroundConfirm)) return;
        onChange({ ...config, backgrounds: { ...config.backgrounds, ...Object.fromEntries(pages.map((p) => [p.label, background])) } });
      }}>{labels.applyBackgroundAll}</button>
    </div>
    {background && rect && <>
      <div className="background-dimensions">
        {(["x", "y", "width", "height"] as const).map((field) => <label className="field-row" key={field}>
          <span className="field-label">{{ x: "X", y: "Y", width: labels.calendarWidthLabel, height: labels.calendarHeightLabel }[field]}</span>
          <NumberInput value={rect[field]} min={field === "width" || field === "height" ? 1 : undefined} step={1}
            onChange={(value) => {
              const next = { ...rect, [field]: value };
              if (field === "width") next.height = rect.height * value / rect.width;
              if (field === "height") next.width = rect.width * value / rect.height;
              update({ ...background, rect: next });
            }} />
        </label>)}
      </div>
      <div className="background-settings-row background-fit-actions">
        {(["cover", "contain"] as const).map((mode) => <button key={mode} type="button" className="studio-btn studio-btn-secondary"
          disabled={!resource.value} onClick={() => resource.value && update({ ...background, rect: fitBackground(config.layout, resource.value, mode) })}>
          {mode === "cover" ? labels.coverBackground : labels.containBackground}
        </button>)}
        <button type="button" className="studio-btn studio-btn-secondary" disabled={!resource.value} onClick={() => {
          if (!resource.value) return;
          const { width, height } = resource.value;
          update({ ...background, rect: {
            x: (config.layout.width - width) / 2,
            y: (config.layout.height - height) / 2,
            width,
            height,
          } });
        }}>{labels.resetBackgroundSize}</button>
      </div>
    </>}
    {(error || resource.error) && <div role="alert">{error ?? resource.error?.message}</div>}
    {resource.error && <button type="button" className="studio-btn studio-btn-secondary" onClick={resource.retry}>{labels.retryBackground}</button>}
  </div>;
}
