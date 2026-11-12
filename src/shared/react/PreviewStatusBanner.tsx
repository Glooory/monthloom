import type { FontIssue } from "../../resources/fonts/previewFonts";
import { useI18n } from "../i18n/i18nStore";

export function PreviewStatusBanner({
  error,
  issues = [],
  loading,
  retained,
  retry,
}: {
  error: Error | null;
  issues?: readonly FontIssue[];
  loading: boolean;
  retained: boolean;
  retry: () => void;
}) {
  const { t } = useI18n();
  if (!error && !issues.length && !(loading && retained)) return null;
  return (
    <div
      className="font-error-banner"
      role={error || issues.length ? "alert" : "status"}
    >
      <div className="font-error-message">
        <span>
          {error
            ? t.errors.previewRenderError(error.message)
            : issues.length
              ? t.errors.fontSubstitution(
                  [
                    ...new Set(
                      issues.map(
                        (issue) =>
                          `${issue.requested.family} → ${issue.actual.family}`,
                      ),
                    ),
                  ].join(", "),
                )
              : t.errors.fontPreviewUpdating}
        </span>
        {(loading || error) && retained && (
          <span>{t.errors.previewRetained}</span>
        )}
      </div>
      <button
        type="button"
        className="studio-btn studio-btn-secondary"
        onClick={retry}
        disabled={loading}
      >
        {loading ? t.errors.fontRetrying : t.errors.fontRetry}
      </button>
    </div>
  );
}
