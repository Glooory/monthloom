import React, { useRef } from "react";
import { useI18n } from "../shared/i18n/i18nStore";
import "./getting-started-guide.css";

export const GettingStartedGuide: React.FC<{
  onNavigate: (view: "editor" | "gallery" | "workspace") => void;
}> = ({ onNavigate }) => {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const guide = t.guide;

  const openGuide = () => {
    dialogRef.current?.showModal();
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const closeGuide = () => {
    dialogRef.current?.close();
    triggerRef.current?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="studio-btn studio-btn-secondary studio-btn-icon-only"
        aria-label={guide.button}
        title={guide.button}
        aria-haspopup="dialog"
        onClick={openGuide}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.8-2.5 2-2.5 4" />
          <circle cx="12" cy="16.8" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <dialog
        ref={dialogRef}
        className="getting-started-guide"
        aria-labelledby="getting-started-title"
        onCancel={(event) => { event.preventDefault(); closeGuide(); }}
      >
        <header className="guide-header">
          <h2 id="getting-started-title">{guide.button}</h2>
          <button type="button" className="guide-close" onClick={closeGuide} aria-label={guide.close} title={guide.close} autoFocus>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="m6 6 12 12M6 18 18 6" />
            </svg>
          </button>
        </header>
        <div ref={contentRef} className="guide-body" tabIndex={0} role="region" aria-labelledby="getting-started-title">
          {guide.sections.map((section, index) => (
            <section className="guide-section" key={index}>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
              <p>{section.detail}</p>
            </section>
          ))}
        </div>
        <footer className="guide-footer">
          <button type="button" className="studio-btn studio-btn-accent" onClick={() => { closeGuide(); onNavigate("editor"); }}>
            {guide.startDesign}
          </button>
        </footer>
      </dialog>
    </>
  );
};
