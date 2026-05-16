// src/pages/AdminDashboard.tsx
import { useState, useEffect } from "react";
import { Briefcase, Bell, FileText, Plus, Trash2, Loader2 } from "lucide-react";
import {
  getPlacements, createPlacement, updatePlacement, deletePlacement,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
  getMaterials, uploadMaterial, deleteMaterial,
  type Placement, type Announcement, type Material,
} from "../api/admin";
import { formatDate } from "../lib/utils";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

type Tab = "placements" | "announcements" | "materials";

// What the modal needs to know to execute a deletion
interface PendingDelete {
  kind: "placement" | "announcement" | "material";
  id: string;
  label: string; // human-readable name shown in the modal
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("placements");
  const [placements, setPlacements]       = useState<Placement[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [materials, setMaterials]         = useState<Material[]>([]);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);

  // ── Delete modal state ────────────────────────────────────────────────────
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting]           = useState(false);

  // ── Add forms ─────────────────────────────────────────────────────────────
  const [showAddPlacement, setShowAddPlacement]       = useState(false);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [showAddMaterial, setShowAddMaterial]         = useState(false);

  const [placementForm, setPlacementForm] = useState({
    type: "job", company: "", title: "", description: "", salary: "", deadline: "", link: "",
  });
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "" });
  const [materialForm, setMaterialForm]         = useState({ title: "", description: "" });
  const [materialFile, setMaterialFile]         = useState<File | null>(null);

  useEffect(() => {
    Promise.all([getPlacements(), getAnnouncements(), getMaterials()])
      .then(([p, a, m]) => { setPlacements(p); setAnnouncements(a); setMaterials(m); })
      .finally(() => setLoading(false));
  }, []);

  // ── Add handlers ──────────────────────────────────────────────────────────
  const handleAddPlacement = async () => {
    if (!placementForm.company || !placementForm.title) return;
    setSubmitting(true);
    try {
      const newP = await createPlacement(placementForm as any);
      setPlacements([newP, ...placements]);
      setPlacementForm({ type: "job", company: "", title: "", description: "", salary: "", deadline: "", link: "" });
      setShowAddPlacement(false);
    } finally { setSubmitting(false); }
  };

  const handleAddAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) return;
    setSubmitting(true);
    try {
      const newA = await createAnnouncement(announcementForm.title, announcementForm.content);
      setAnnouncements([newA, ...announcements]);
      setAnnouncementForm({ title: "", content: "" });
      setShowAddAnnouncement(false);
    } finally { setSubmitting(false); }
  };

  const handleAddMaterial = async () => {
    if (!materialForm.title || !materialFile) return;
    setSubmitting(true);
    try {
      const newM = await uploadMaterial(materialForm.title, materialForm.description, materialFile);
      setMaterials([newM, ...materials]);
      setMaterialForm({ title: "", description: "" });
      setMaterialFile(null);
      setShowAddMaterial(false);
    } finally { setSubmitting(false); }
  };

  // ── Unified delete confirm ────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const { kind, id } = pendingDelete;
      if (kind === "placement") {
        await deletePlacement(id);
        setPlacements((prev) => prev.filter((p) => p.id !== id));
      } else if (kind === "announcement") {
        await deleteAnnouncement(id);
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      } else {
        await deleteMaterial(id);
        setMaterials((prev) => prev.filter((m) => m.id !== id));
      }
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Shared input style ────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    padding: "8px 10px", borderRadius: "8px",
    border: "1px solid var(--border)", fontFamily: "inherit",
    background: "var(--input-bg)", color: "var(--text-primary)",
    fontSize: "13px", width: "100%", boxSizing: "border-box",
  };

  // ── Delete button ─────────────────────────────────────────────────────────
  const DeleteBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        padding: "6px", background: "var(--surface-2)", border: "none",
        borderRadius: "8px", cursor: "pointer", color: "#e11d48",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.background = "rgba(225,29,72,0.1)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)")
      }
    >
      <Trash2 size={14} />
    </button>
  );

  return (
    <>
      {/* ── Delete confirmation modal ───────────────────────────────────── */}
      {pendingDelete && (
        <DeleteConfirmModal
          title={
            pendingDelete.kind === "placement"
              ? "Delete placement?"
              : pendingDelete.kind === "announcement"
              ? "Delete announcement?"
              : "Delete material?"
          }
          message={`"${pendingDelete.label}" will be permanently removed and cannot be recovered.`}
          confirmLabel={
            pendingDelete.kind === "placement"
              ? "Delete placement"
              : pendingDelete.kind === "announcement"
              ? "Delete announcement"
              : "Delete material"
          }
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
          loading={deleting}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="animate-fade-up">
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            Manage placements, announcements &amp; materials
          </p>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: "6px", background: "var(--surface-3)",
          borderRadius: "12px", padding: "4px", width: "fit-content",
        }}>
          {(["placements", "announcements", "materials"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 16px", borderRadius: "9px", border: "none", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              background: tab === t ? "var(--card-bg)" : "transparent",
              color: tab === t ? "var(--brand-600)" : "var(--text-muted)",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              {t === "placements"    && <Briefcase size={14} />}
              {t === "announcements" && <Bell size={14} />}
              {t === "materials"     && <FileText size={14} />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                background: "var(--card-bg)", borderRadius: "14px", padding: "16px",
                border: "1.5px solid var(--border)", height: "100px",
              }} />
            ))}
          </div>

        ) : tab === "placements" ? (
          /* ════════════════ PLACEMENTS ════════════════ */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <button onClick={() => setShowAddPlacement(true)} style={{
              padding: "10px 16px", borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              color: "white", border: "none", fontSize: "13px", fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", width: "fit-content",
            }}>
              <Plus size={14} /> Add Placement
            </button>

            {showAddPlacement && (
              <div style={{
                background: "var(--card-bg)", borderRadius: "14px", padding: "16px",
                border: "1.5px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px",
              }}>
                <select
                  value={placementForm.type}
                  onChange={(e) => setPlacementForm({ ...placementForm, type: e.target.value })}
                  style={{ ...inputStyle }}
                >
                  <option value="job">Job</option>
                  <option value="internship">Internship</option>
                  <option value="recruitment">Recruitment</option>
                </select>
                <input placeholder="Company *" value={placementForm.company}
                  onChange={(e) => setPlacementForm({ ...placementForm, company: e.target.value })}
                  style={inputStyle} />
                <input placeholder="Title *" value={placementForm.title}
                  onChange={(e) => setPlacementForm({ ...placementForm, title: e.target.value })}
                  style={inputStyle} />
                <input placeholder="Salary (e.g. ₹8 LPA)" value={placementForm.salary}
                  onChange={(e) => setPlacementForm({ ...placementForm, salary: e.target.value })}
                  style={inputStyle} />
                <input type="datetime-local" value={placementForm.deadline}
                  onChange={(e) => setPlacementForm({ ...placementForm, deadline: e.target.value })}
                  style={inputStyle} />
                <textarea placeholder="Description" rows={3} value={placementForm.description}
                  onChange={(e) => setPlacementForm({ ...placementForm, description: e.target.value })}
                  style={{ ...inputStyle, resize: "vertical" }} />
                <input placeholder="Apply link (URL)" value={placementForm.link}
                  onChange={(e) => setPlacementForm({ ...placementForm, link: e.target.value })}
                  style={inputStyle} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleAddPlacement} disabled={submitting} style={{
                    flex: 1, padding: "9px", borderRadius: "8px", background: "var(--brand-500)",
                    color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}>
                    {submitting && <Loader2 size={13} className="animate-spin" />}
                    {submitting ? "Adding…" : "Add Placement"}
                  </button>
                  <button onClick={() => setShowAddPlacement(false)} style={{
                    flex: 1, padding: "9px", borderRadius: "8px", background: "var(--surface-2)",
                    border: "1.5px solid var(--border)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    color: "var(--text-secondary)",
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {placements.length === 0 && (
              <div style={{
                background: "var(--card-bg)", borderRadius: "14px", padding: "40px 24px",
                textAlign: "center", border: "1.5px solid var(--border)",
              }}>
                <Briefcase size={28} style={{ color: "var(--text-muted)", margin: "0 auto 10px", display: "block" }} />
                <p style={{ fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>No placements yet</p>
              </div>
            )}

            {placements.map((p) => (
              <div key={p.id} style={{
                background: "var(--card-bg)", borderRadius: "14px", padding: "16px",
                border: "1.5px solid var(--border)", display: "flex",
                justifyContent: "space-between", alignItems: "center", gap: "12px",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 4px", color: "var(--text-primary)" }}>
                    {p.title} <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>@ {p.company}</span>
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                    {p.type} {p.salary && `· ${p.salary}`} · {formatDate(p.created_at)}
                  </p>
                </div>
                <DeleteBtn onClick={() =>
                  setPendingDelete({ kind: "placement", id: p.id, label: `${p.title} @ ${p.company}` })
                } />
              </div>
            ))}
          </div>

        ) : tab === "announcements" ? (
          /* ════════════════ ANNOUNCEMENTS ════════════════ */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <button onClick={() => setShowAddAnnouncement(true)} style={{
              padding: "10px 16px", borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              color: "white", border: "none", fontSize: "13px", fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", width: "fit-content",
            }}>
              <Plus size={14} /> Add Announcement
            </button>

            {showAddAnnouncement && (
              <div style={{
                background: "var(--card-bg)", borderRadius: "14px", padding: "16px",
                border: "1.5px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px",
              }}>
                <input placeholder="Title *" value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  style={inputStyle} />
                <textarea placeholder="Content *" rows={4} value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  style={{ ...inputStyle, resize: "vertical" }} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleAddAnnouncement} disabled={submitting} style={{
                    flex: 1, padding: "9px", borderRadius: "8px", background: "var(--brand-500)",
                    color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}>
                    {submitting && <Loader2 size={13} className="animate-spin" />}
                    {submitting ? "Posting…" : "Post"}
                  </button>
                  <button onClick={() => setShowAddAnnouncement(false)} style={{
                    flex: 1, padding: "9px", borderRadius: "8px", background: "var(--surface-2)",
                    border: "1.5px solid var(--border)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    color: "var(--text-secondary)",
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {announcements.length === 0 && (
              <div style={{
                background: "var(--card-bg)", borderRadius: "14px", padding: "40px 24px",
                textAlign: "center", border: "1.5px solid var(--border)",
              }}>
                <Bell size={28} style={{ color: "var(--text-muted)", margin: "0 auto 10px", display: "block" }} />
                <p style={{ fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>No announcements yet</p>
              </div>
            )}

            {announcements.map((a) => (
              <div key={a.id} style={{
                background: "var(--card-bg)", borderRadius: "14px", padding: "16px",
                border: "1.5px solid var(--border)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 6px", color: "var(--text-primary)" }}>
                      {a.title}
                    </p>
                    <p style={{
                      fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 8px",
                      lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
                    }}>
                      {a.content}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                      {formatDate(a.created_at)}
                    </p>
                  </div>
                  <DeleteBtn onClick={() =>
                    setPendingDelete({ kind: "announcement", id: a.id, label: a.title })
                  } />
                </div>
              </div>
            ))}
          </div>

        ) : (
          /* ════════════════ MATERIALS ════════════════ */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <button onClick={() => setShowAddMaterial(true)} style={{
              padding: "10px 16px", borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              color: "white", border: "none", fontSize: "13px", fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", width: "fit-content",
            }}>
              <Plus size={14} /> Upload Material
            </button>

            {showAddMaterial && (
              <div style={{
                background: "var(--card-bg)", borderRadius: "14px", padding: "16px",
                border: "1.5px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px",
              }}>
                <input placeholder="Title *" value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  style={inputStyle} />
                <input placeholder="Description (optional)" value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  style={inputStyle} />
                <input type="file" accept=".pdf,.docx"
                  onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
                  style={inputStyle} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleAddMaterial} disabled={submitting || !materialFile} style={{
                    flex: 1, padding: "9px", borderRadius: "8px", background: "var(--brand-500)",
                    color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    opacity: submitting || !materialFile ? 0.7 : 1,
                  }}>
                    {submitting && <Loader2 size={13} className="animate-spin" />}
                    {submitting ? "Uploading…" : "Upload"}
                  </button>
                  <button onClick={() => setShowAddMaterial(false)} style={{
                    flex: 1, padding: "9px", borderRadius: "8px", background: "var(--surface-2)",
                    border: "1.5px solid var(--border)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    color: "var(--text-secondary)",
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {materials.length === 0 && (
              <div style={{
                background: "var(--card-bg)", borderRadius: "14px", padding: "40px 24px",
                textAlign: "center", border: "1.5px solid var(--border)",
              }}>
                <FileText size={28} style={{ color: "var(--text-muted)", margin: "0 auto 10px", display: "block" }} />
                <p style={{ fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>No materials yet</p>
              </div>
            )}

            {materials.map((m) => (
              <div key={m.id} style={{
                background: "var(--card-bg)", borderRadius: "14px", padding: "16px",
                border: "1.5px solid var(--border)", display: "flex",
                justifyContent: "space-between", alignItems: "center", gap: "12px",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 4px", color: "var(--text-primary)" }}>
                    {m.title}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                    {m.file_type.toUpperCase()} · {formatDate(m.created_at)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <a href={m.file_url} download style={{
                    padding: "6px 12px", background: "var(--brand-50)",
                    border: "1px solid var(--brand-200)", borderRadius: "8px",
                    cursor: "pointer", color: "var(--brand-600)", fontSize: "12px",
                    fontWeight: 700, textDecoration: "none",
                  }}>
                    Download
                  </a>
                  <DeleteBtn onClick={() =>
                    setPendingDelete({ kind: "material", id: m.id, label: m.title })
                  } />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}