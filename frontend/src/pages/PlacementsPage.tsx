import { useState, useEffect } from "react";
import { Briefcase, MapPin, DollarSign, Calendar, ExternalLink } from "lucide-react";
import { getPlacements, type Placement } from "../api/admin";
import { formatDate } from "../lib/utils";

type FilterType = "all" | "job" | "internship" | "recruitment";

export default function PlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlacements().then(setPlacements).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? placements : placements.filter(p => p.type === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="animate-fade-up">
        <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.4px" }}>
          Placements
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          Job updates, internships & campus recruitments
        </p>
      </div>

      <div style={{ display: "flex", gap: "6px", background: "var(--surface-3)", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
        {(["all", "job", "internship", "recruitment"] as FilterType[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: "9px", border: "none", fontSize: "12px",
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: filter === f ? "var(--card-bg)" : "transparent",
            color: filter === f ? "var(--brand-600)" : "var(--text-muted)",
            transition: "all 0.15s",
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              background: "var(--card-bg)", borderRadius: "14px", padding: "18px",
              border: "1.5px solid var(--border)", display: "flex", gap: "12px",
            }}>
              <div className="shimmer" style={{ width: 44, height: 44, borderRadius: "10px", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="shimmer" style={{ height: 12, width: "35%", borderRadius: 6 }} />
                <div className="shimmer" style={{ height: 12, width: "100%", borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "var(--card-bg)", borderRadius: "14px", padding: "48px 24px",
          textAlign: "center", border: "1.5px solid var(--border)",
        }}>
          <Briefcase size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-secondary)", margin: "0 0 6px" }}>
            No {filter === "all" ? "placements" : filter}s yet
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            Come back soon for updates
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((p, idx) => (
            <div key={p.id} className={`animate-fade-up stagger-${Math.min(idx + 1, 4)}`} style={{
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
                  width: 44, height: 44, borderRadius: "10px",
                  background: "var(--placement-gradient)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Briefcase size={20} style={{ color: "var(--brand-500)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <p style={{
                        fontWeight: 700, fontSize: "14px", color: "var(--text-primary)",
                        margin: "0 0 2px",
                      }}>
                        {p.title}
                      </p>
                      <p style={{
                        fontSize: "12px", color: "var(--text-muted)", margin: 0,
                        fontWeight: 600,
                      }}>
                        {p.company}
                      </p>
                    </div>
                    <span style={{
                      padding: "4px 10px", borderRadius: "99px", fontSize: "10px",
                      fontWeight: 700, background: "var(--brand-50)", color: "var(--brand-600)",
                      border: "1px solid var(--brand-200)", flexShrink: 0,
                    }}>
                      {p.type.charAt(0).toUpperCase() + p.type.slice(1)}
                    </span>
                  </div>

                  {p.description && (
                    <p style={{
                      fontSize: "13px", color: "var(--text-secondary)", margin: "8px 0",
                      lineHeight: 1.6,
                    }}>
                      {p.description}
                    </p>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "10px" }}>
                    {p.salary && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)" }}>
                        <DollarSign size={13} /> {p.salary}
                      </div>
                    )}
                    {p.deadline && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)" }}>
                        <Calendar size={13} /> Deadline: {formatDate(p.deadline)}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)" }}>
                      <Calendar size={13} /> Posted: {formatDate(p.created_at)}
                    </div>
                  </div>

                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      marginTop: "12px", padding: "6px 12px", borderRadius: "8px",
                      background: "var(--brand-50)", border: "1px solid var(--brand-200)",
                      color: "var(--brand-600)", fontSize: "12px", fontWeight: 700,
                      textDecoration: "none", transition: "all 0.15s",
                    }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLAnchorElement).style.background = "var(--brand-100)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLAnchorElement).style.background = "var(--brand-50)";
                      }}
                    >
                      Apply Now <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}