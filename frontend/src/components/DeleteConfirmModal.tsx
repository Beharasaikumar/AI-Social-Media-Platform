// src/components/DeleteConfirmModal.tsx
import { useEffect, useRef } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";

interface DeleteConfirmModalProps {
  /** Title shown in bold at the top, e.g. "Delete post?" */
  title?: string;
  /** Descriptive line under the title */
  message?: string;
  /** Label for the confirm button, defaults to "Delete" */
  confirmLabel?: string;
  /** Called when the user clicks the confirm button */
  onConfirm: () => void;
  /** Called when the user cancels or clicks the backdrop */
  onCancel: () => void;
  /** Show a loading spinner on the confirm button */
  loading?: boolean;
}

export default function DeleteConfirmModal({
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  loading = false,
}: DeleteConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        animation: "fadeIn 0.18s ease",
      }}
    >
      <div
        className="animate-bounce-in"
        style={{
          background: "var(--card-bg)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "380px",
          boxShadow: "var(--shadow-modal)",
          border: "1.5px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "20px 20px 0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "12px",
              background: "rgba(225,29,72,0.1)",
              border: "1.5px solid rgba(225,29,72,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} color="#e11d48" />
          </div>

          {/* Close button */}
          <button
            onClick={onCancel}
            style={{
              border: "none",
              background: "var(--surface-2)",
              borderRadius: "8px",
              width: 30,
              height: 30,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "var(--surface-3)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "var(--surface-2)")
            }
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div style={{ padding: "14px 20px 20px" }}>
          <p
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 6px",
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              margin: "0 0 20px",
              lineHeight: 1.6,
            }}
          >
            {message}
          </p>

          {/* ── Actions ───────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "11px",
                border: "1.5px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--border-strong)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--border)")
              }
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "11px",
                border: "none",
                background: loading
                  ? "rgba(225,29,72,0.5)"
                  : "linear-gradient(135deg, #e11d48, #f43f5e)",
                color: "white",
                fontSize: "13px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.15s",
                boxShadow: loading ? "none" : "0 4px 14px rgba(225,29,72,0.3)",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 6px 20px rgba(225,29,72,0.45)";
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 4px 14px rgba(225,29,72,0.3)";
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 13,
                      height: 13,
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 size={13} />
                  {confirmLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}