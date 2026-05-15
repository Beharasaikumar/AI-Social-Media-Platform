import { useState, useEffect } from "react";
import { Briefcase, Bell, FileText, Plus, Trash2, Edit2, Loader2, AlertCircle } from "lucide-react";
import { getPlacements, createPlacement, updatePlacement, deletePlacement, getAnnouncements, createAnnouncement, deleteAnnouncement, getMaterials, uploadMaterial, deleteMaterial, type Placement, type Announcement, type Material } from "../api/admin";
import { formatDate } from "../lib/utils";

type Tab = "placements" | "announcements" | "materials";

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("placements");
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddPlacement, setShowAddPlacement] = useState(false);
  const [placementForm, setPlacementForm] = useState({ type: "job", company: "", title: "", description: "", salary: "", deadline: "", link: "" });
  const [submitting, setSubmitting] = useState(false);

  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "" });

  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [materialForm, setMaterialForm] = useState({ title: "", description: "" });

  useEffect(() => {
    Promise.all([getPlacements(), getAnnouncements(), getMaterials()])
      .then(([p, a, m]) => { setPlacements(p); setAnnouncements(a); setMaterials(m); })
      .finally(() => setLoading(false));
  }, []);

  const handleAddPlacement = async () => {
    if (!placementForm.company || !placementForm.title) return;
    setSubmitting(true);
    try {
      const newPlacement = await createPlacement(placementForm as any);
      setPlacements([newPlacement, ...placements]);
      setPlacementForm({ type: "job", company: "", title: "", description: "", salary: "", deadline: "", link: "" });
      setShowAddPlacement(false);
    } finally { setSubmitting(false); }
  };

  const handleDeletePlacement = async (id: string) => {
    await deletePlacement(id);
    setPlacements(placements.filter(p => p.id !== id));
  };

  const handleAddAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) return;
    setSubmitting(true);
    try {
      const newAnnouncement = await createAnnouncement(announcementForm.title, announcementForm.content);
      setAnnouncements([newAnnouncement, ...announcements]);
      setAnnouncementForm({ title: "", content: "" });
      setShowAddAnnouncement(false);
    } finally { setSubmitting(false); }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await deleteAnnouncement(id);
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  const handleAddMaterial = async () => {
    if (!materialForm.title || !materialFile) return;
    setSubmitting(true);
    try {
      const newMaterial = await uploadMaterial(materialForm.title, materialForm.description, materialFile);
      setMaterials([newMaterial, ...materials]);
      setMaterialForm({ title: "", description: "" });
      setMaterialFile(null);
      setShowAddMaterial(false);
    } finally { setSubmitting(false); }
  };

  const handleDeleteMaterial = async (id: string) => {
    await deleteMaterial(id);
    setMaterials(materials.filter(m => m.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="animate-fade-up">
        <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Admin Dashboard</h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Manage placements, announcements & materials</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", background: "var(--surface-3)", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
        {(["placements", "announcements", "materials"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 16px", borderRadius: "9px", border: "none", fontSize: "13px",
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: tab === t ? "var(--card-bg)" : "transparent",
            color: tab === t ? "var(--brand-600)" : "var(--text-muted)",
            transition: "all 0.15s",
          }}>
            {t === "placements" && <Briefcase size={14} style={{ marginRight: "6px" }} />}
            {t === "announcements" && <Bell size={14} style={{ marginRight: "6px" }} />}
            {t === "materials" && <FileText size={14} style={{ marginRight: "6px" }} />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: "var(--card-bg)", borderRadius: "14px", padding: "16px", border: "1.5px solid var(--border)", height: "100px" }} />
          ))}
        </div>
      ) : tab === "placements" ? (
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
              border: "1.5px solid var(--border)", display: "flex", flexDirection: "column", gap: "12px",
            }}>
              <input placeholder="Company" value={placementForm.company} onChange={e => setPlacementForm({ ...placementForm, company: e.target.value })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
              <input placeholder="Title" value={placementForm.title} onChange={e => setPlacementForm({ ...placementForm, title: e.target.value })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
              <input placeholder="Salary" value={placementForm.salary} onChange={e => setPlacementForm({ ...placementForm, salary: e.target.value })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
              <input type="datetime-local" value={placementForm.deadline} onChange={e => setPlacementForm({ ...placementForm, deadline: e.target.value })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
              <textarea placeholder="Description" rows={3} value={placementForm.description} onChange={e => setPlacementForm({ ...placementForm, description: e.target.value })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
              <input placeholder="Link" value={placementForm.link} onChange={e => setPlacementForm({ ...placementForm, link: e.target.value })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleAddPlacement} disabled={submitting} style={{
                  flex: 1, padding: "8px", borderRadius: "8px", background: "var(--brand-500)",
                  color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {submitting ? "Adding..." : "Add"}
                </button>
                <button onClick={() => setShowAddPlacement(false)} style={{
                  flex: 1, padding: "8px", borderRadius: "8px", background: "var(--surface-2)",
                  border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {placements.map(p => (
            <div key={p.id} style={{
              background: "var(--card-bg)", borderRadius: "14px", padding: "16px",
              border: "1.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 4px", color: "var(--text-primary)" }}>
                  {p.title} @ {p.company}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                  {p.type} • {p.salary} • {formatDate(p.created_at)}
                </p>
              </div>
              <button onClick={() => handleDeletePlacement(p.id)} style={{
                padding: "6px", background: "var(--surface-2)", border: "none",
                borderRadius: "8px", cursor: "pointer", color: "#e11d48",
              }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : tab === "announcements" ? (
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
              border: "1.5px solid var(--border)", display: "flex", flexDirection: "column", gap: "12px",
            }}>
              <input placeholder="Title" value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
              <textarea placeholder="Content" rows={4} value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleAddAnnouncement} disabled={submitting} style={{
                  flex: 1, padding: "8px", borderRadius: "8px", background: "var(--brand-500)",
                  color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Post
                </button>
                <button onClick={() => setShowAddAnnouncement(false)} style={{
                  flex: 1, padding: "8px", borderRadius: "8px", background: "var(--surface-2)",
                  border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {announcements.map(a => (
            <div key={a.id} style={{
              background: "var(--card-bg)", borderRadius: "14px", padding: "16px",
              border: "1.5px solid var(--border)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 4px", color: "var(--text-primary)" }}>
                    {a.title}
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 8px", lineHeight: 1.6 }}>
                    {a.content}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                    {formatDate(a.created_at)}
                  </p>
                </div>
                <button onClick={() => handleDeleteAnnouncement(a.id)} style={{
                  padding: "6px", background: "var(--surface-2)", border: "none",
                  borderRadius: "8px", cursor: "pointer", color: "#e11d48", marginLeft: "12px",
                }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
              border: "1.5px solid var(--border)", display: "flex", flexDirection: "column", gap: "12px",
            }}>
              <input placeholder="Title" value={materialForm.title} onChange={e => setMaterialForm({ ...materialForm, title: e.target.value })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
              <input placeholder="Description" value={materialForm.description} onChange={e => setMaterialForm({ ...materialForm, description: e.target.value })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
              <input type="file" accept=".pdf,.docx" onChange={e => setMaterialFile(e.target.files?.[0] || null)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleAddMaterial} disabled={submitting} style={{
                  flex: 1, padding: "8px", borderRadius: "8px", background: "var(--brand-500)",
                  color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Upload
                </button>
                <button onClick={() => setShowAddMaterial(false)} style={{
                  flex: 1, padding: "8px", borderRadius: "8px", background: "var(--surface-2)",
                  border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {materials.map(m => (
            <div key={m.id} style={{
              background: "var(--card-bg)", borderRadius: "14px", padding: "16px",
              border: "1.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 4px", color: "var(--text-primary)" }}>
                  {m.title}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                  {m.file_type.toUpperCase()} • {formatDate(m.created_at)}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <a href={m.file_url} download style={{
                  padding: "6px 12px", background: "var(--brand-50)", border: "1px solid var(--brand-200)",
                  borderRadius: "8px", cursor: "pointer", color: "var(--brand-600)", fontSize: "12px",
                  fontWeight: 700, textDecoration: "none",
                }}>
                  Download
                </a>
                <button onClick={() => handleDeleteMaterial(m.id)} style={{
                  padding: "6px", background: "var(--surface-2)", border: "none",
                  borderRadius: "8px", cursor: "pointer", color: "#e11d48",
                }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;