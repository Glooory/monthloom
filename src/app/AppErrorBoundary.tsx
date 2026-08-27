import { Component, ErrorInfo, ReactNode } from "react";
import { getDisplayErrorMessage } from "../shared/runtime/errorMessage";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("AppErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <div
          role="alert"
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#020617",
            color: "#F8FAFC",
            fontFamily: "sans-serif",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: "500px",
              background: "#0F172A",
              border: "1px solid #DC2626",
              borderRadius: "8px",
              padding: "28px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
            }}
          >
            <h2 style={{ color: "#EF4444", marginTop: 0, fontSize: "20px" }}>Something went wrong</h2>
            <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.5, margin: "12px 0 20px" }}>
              Monthloom encountered an unexpected error while rendering. Your saved project data in IndexedDB has not been deleted.
            </p>
            <pre
              style={{
                background: "#020617",
                padding: "12px",
                borderRadius: "6px",
                color: "#FCA5A5",
                fontSize: "12px",
                textAlign: "left",
                overflowX: "auto",
                marginBottom: "20px",
                border: "1px solid #334155",
              }}
            >
              {getDisplayErrorMessage(this.state.error)}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
