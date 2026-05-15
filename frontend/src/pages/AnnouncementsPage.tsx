import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { getAnnouncements, type Announcement } from "../api/admin";
import { formatDate } from "../lib/utils";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnnouncements().then(setAnnouncements).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="animate-fade-up">
        <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.4px" }}>
          Announcements
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          Official college notices & updates
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              background: "var(--card-bg)", borderRadius: "14px", padding: "18px",
              border: "1.5px solid var(--border)", display: "flex", flexDirection: "column", gap: "8px",
            }}>
              <div className="shimmer" style={{ height: 12, width: "35%", borderRadius: 6 }} />
              <div className="shimmer" style={{ height: 12, width: "100%", borderRadius: 6 }} />
              <div className="shimmer" style={{ height: 12, width: "65%", borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div style={{
          background: "var(--card-bg)", borderRadius: "14px", padding: "48px 24px",
          textAlign: "center", border: "1.5px solid var(--border)",
        }}>
          <Bell size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-secondary)", margin: "0 0 6px" }}>
            No announcements yet
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            Check back for official college notices
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {announcements.map((a, idx) => (
            <div key={a.id} className={`animate-fade-up stagger-${Math.min(idx + 1, 4)}`} style={{
              background: "var(--card-bg)", borderRadius: "14px", padding: "18px",
              border: "1.5px solid var(--border)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(99,102,241,0.1)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "12px",
                  background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Bell size={20} style={{ color: "#d97706" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontWeight: 700, fontSize: "15px", color: "var(--text-primary)",
                    margin: "0 0 6px",
                  }}>
                    {a.title}
                  </h3>
                  <p style={{
                    fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 10px",
                    lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {a.content}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                    {formatDate(a.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}