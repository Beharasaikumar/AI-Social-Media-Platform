import { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import { getMaterials, type Material } from "../api/admin";
import { formatDate } from "../lib/utils";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMaterials().then(setMaterials).finally(() => setLoading(false));
  }, []);

  const groupedByType = materials.reduce((acc, m) => {
    if (!acc[m.file_type]) acc[m.file_type] = [];
    acc[m.file_type].push(m);
    return acc;
  }, {} as Record<string, Material[]>);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="animate-fade-up">
        <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.4px" }}>
          Notes & Materials
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          Download study materials & notes
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              background: "var(--card-bg)", borderRadius: "14px", padding: "16px",
              border: "1.5px solid var(--border)", display: "flex", gap: "12px",
            }}>
              <div className="shimmer" style={{ width: 40, height: 40, borderRadius: "8px", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <div className="shimmer" style={{ height: 12, width: "35%", borderRadius: 6 }} />
                <div className="shimmer" style={{ height: 11, width: "50%", borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div style={{
          background: "var(--card-bg)", borderRadius: "14px", padding: "48px 24px",
          textAlign: "center", border: "1.5px solid var(--border)",
        }}>
          <FileText size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-secondary)", margin: "0 0 6px" }}>
            No materials yet
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            Materials will be available soon
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {Object.entries(groupedByType).map(([type, items]) => (
            <div key={type} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h3 style={{
                fontSize: "13px", fontWeight: 700, color: "var(--text-muted)",
                margin: "12px 0 8px", textTransform: "uppercase", letterSpacing: "0.5px",
              }}>
                {type.toUpperCase()} Files
              </h3>
              {items.map((m, idx) => (
                <div key={m.id} className={`animate-fade-up stagger-${Math.min(idx + 1, 4)}`} style={{
                  background: "var(--card-bg)", borderRadius: "12px", padding: "14px",
                  border: "1.5px solid var(--border)", display: "flex", alignItems: "center", gap: "12px",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(99,102,241,0.1)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: "8px",
                    background: type === "pdf" ? "var(--pdf-bg)" : "var(--docx-bg)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <FileText size={18} style={{ color: type === "pdf" ? "var(--pdf-color)" : "var(--docx-color)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 700, fontSize: "13px", color: "var(--text-primary)",
                      margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {m.title}
                    </p>
                    <p style={{
                      fontSize: "11px", color: "var(--text-muted)", margin: 0,
                    }}>
                      {formatDate(m.created_at)}
                    </p>
                  </div>
                  <a href={m.file_url} download style={{
                    padding: "6px 12px", borderRadius: "8px",
                    background: type === "pdf" ? "rgba(239, 68, 68, 0.08)" : "rgba(59, 130, 246, 0.08)",
                    border: `1px solid ${type === "pdf" ? "var(--pdf-border)" : "var(--docx-border)"}`,
                    color: type === "pdf" ? "var(--pdf-color)" : "var(--docx-color)",
                    fontSize: "11px", fontWeight: 700,
                    textDecoration: "none", display: "flex", alignItems: "center", gap: "4px",
                    cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLAnchorElement).style.background = type === "pdf" ? "rgba(239, 68, 68, 0.14)" : "rgba(59, 130, 246, 0.14)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLAnchorElement).style.background = type === "pdf" ? "rgba(239, 68, 68, 0.08)" : "rgba(59, 130, 246, 0.08)";
                    }}
                  >
                    <Download size={11} /> Download
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}