// src/pages/SettingsPage.tsx
import { useState, useRef } from "react";
import {
  Sun, Moon, Monitor, Camera, User, Lock, AlertCircle,
  Loader2, Check, ChevronRight,
} from "lucide-react";
import client from "../api/client";
import type { User as UserType } from "../types";

interface SettingsPageProps {
  user: UserType;
  dark: boolean;
  onToggleDark: () => void;
  onUserUpdate: (u: Partial<UserType>) => void;
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--card-bg)", borderRadius: "16px",
      border: "1.5px solid var(--border)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "18px 20px 14px",
        borderBottom: "1px solid var(--border)",
      }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
          {title}
        </p>
        {description && (
          <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
            {description}
          </p>
        )}
      </div>
      <div style={{ padding: "6px 0" }}>
        {children}
      </div>
    </div>
  );
}

// ── Row wrapper ───────────────────────────────────────────────────────────────
function SettingRow({ label, hint, children, noBorder = false }: {
  label: string; hint?: string; children: React.ReactNode; noBorder?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 20px", gap: "16px",
      borderBottom: noBorder ? "none" : "1px solid var(--border)",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
          {label}
        </p>
        {hint && (
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            {hint}
          </p>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

// ── Theme option button ───────────────────────────────────────────────────────
function ThemeOption({ icon: Icon, label, active, onClick }: {
  icon: any; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
        padding: "14px 18px", borderRadius: "12px",
        border: active ? "2px solid var(--brand-500)" : "1.5px solid var(--border)",
        background: active ? "var(--brand-50)" : "var(--surface-2)",
        cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
        minWidth: "80px",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-300)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
      }}
    >
      <Icon size={20} color={active ? "var(--brand-500)" : "var(--text-muted)"} strokeWidth={active ? 2.5 : 2} />
      <span style={{
        fontSize: "11px", fontWeight: active ? 700 : 500,
        color: active ? "var(--brand-600)" : "var(--text-muted)",
      }}>
        {label}
      </span>
      {active && (
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--brand-500)",
        }} />
      )}
    </button>
  );
}

// ── Image upload row ──────────────────────────────────────────────────────────
function ImageUploadRow({
  label, hint, currentUrl, fallbackInitial, endpoint, fieldName,
  onSuccess, shape = "circle",
}: {
  label: string; hint: string; currentUrl?: string; fallbackInitial: string;
  endpoint: string; fieldName: string;
  onSuccess: (url: string) => void;
  shape?: "circle" | "rect";
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState<string | null>(null);
  const [done, setDone]           = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview ?? currentUrl;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setDone(false);
    try {
      const form = new FormData();
      form.append(fieldName, file);
      const res = await client.post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.avatarUrl ?? res.data.coverUrl;
      onSuccess(url);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch {
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const borderRadius = shape === "circle" ? "50%" : "10px";
  const w = shape === "circle" ? 44 : 70;
  const h = shape === "circle" ? 44 : 38;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <SettingRow label={label} hint={hint}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Preview thumbnail */}
          <div style={{
            width: w, height: h, borderRadius,
            overflow: "hidden", flexShrink: 0,
            border: "1.5px solid var(--border)",
            background: "var(--surface-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: 700, color: "var(--text-muted)",
          }}>
            {displayUrl
              ? <img src={displayUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : fallbackInitial
            }
          </div>

          {/* Upload button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 12px", borderRadius: "9px",
              border: "1.5px solid var(--border)",
              background: done ? "rgba(5,150,105,0.08)" : "var(--surface-2)",
              borderColor: done ? "rgba(5,150,105,0.4)" : "var(--border)",
              color: done ? "#059669" : "var(--text-secondary)",
              fontSize: "12px", fontWeight: 600,
              cursor: uploading ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!uploading && !done)
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-400)";
            }}
            onMouseLeave={(e) => {
              if (!done)
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            }}
          >
            {uploading
              ? <><Loader2 size={12} className="animate-spin" /> Uploading…</>
              : done
              ? <><Check size={12} /> Saved</>
              : <><Camera size={12} /> Change</>
            }
          </button>
        </div>
      </SettingRow>
    </>
  );
}

// ── Username change row ───────────────────────────────────────────────────────
function UsernameRow({ currentUsername, onSuccess }: {
  currentUsername: string; onSuccess: (username: string) => void;
}) {
  const [editing, setEditing]   = useState(false);
  const [value, setValue]       = useState(currentUsername);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const handleSave = async () => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === currentUsername) { setEditing(false); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
      setError("3–20 chars: letters, numbers, underscores only");
      return;
    }
    setSaving(true); setError("");
    try {
      // re-use the /auth/profile PATCH — it accepts username changes
      await client.patch("/auth/profile", {
        displayName: currentUsername, // kept the same, only username changes
        username: trimmed,
      });
      onSuccess(trimmed);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setEditing(false); }, 1500);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to update username");
    } finally { setSaving(false); }
  };

  return (
    <SettingRow
      label="Username"
      hint={editing ? undefined : `@${currentUsername}`}
      noBorder
    >
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(""); }}
              autoFocus
              style={{
                padding: "7px 10px", borderRadius: "8px",
                border: `1.5px solid ${error ? "#fca5a5" : "var(--brand-400)"}`,
                fontSize: "13px", fontFamily: "inherit",
                outline: "none", background: "var(--input-bg)",
                color: "var(--text-primary)", width: "140px",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") { setEditing(false); setValue(currentUsername); setError(""); }
              }}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "7px 12px", borderRadius: "8px", border: "none",
                background: success ? "rgba(5,150,105,0.15)" : "var(--brand-500)",
                color: "white", fontSize: "12px", fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: "4px",
              }}
            >
              {saving ? <Loader2 size={11} className="animate-spin" /> : success ? <Check size={11} /> : null}
              {saving ? "Saving…" : success ? "Saved!" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setValue(currentUsername); setError(""); }}
              style={{
                padding: "7px 10px", borderRadius: "8px",
                border: "1.5px solid var(--border)", background: "var(--surface-2)",
                color: "var(--text-muted)", fontSize: "12px", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#e11d48" }}>
              <AlertCircle size={11} /> {error}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "7px 12px", borderRadius: "8px",
            border: "1.5px solid var(--border)", background: "var(--surface-2)",
            color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-400)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-500)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          }}
        >
          Change <ChevronRight size={12} />
        </button>
      )}
    </SettingRow>
  );
}

// ── SettingsPage ──────────────────────────────────────────────────────────────
export default function SettingsPage({ user, dark, onToggleDark, onUserUpdate }: SettingsPageProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div className="animate-fade-up">
        <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.4px" }}>
          Settings
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          Manage your account and preferences
        </p>
      </div>

      {/* ── Appearance ────────────────────────────────────────────────────── */}
      <div className="animate-fade-up stagger-1">
        <Section
          title="Appearance"
          description="Customize how CampusConnect looks for you"
        >
          <div style={{ padding: "16px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Theme
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <ThemeOption
                icon={Sun}
                label="Light"
                active={!dark}
                onClick={() => { if (dark) onToggleDark(); }}
              />
              <ThemeOption
                icon={Moon}
                label="Dark"
                active={dark}
                onClick={() => { if (!dark) onToggleDark(); }}
              />
            </div>
            <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
              {dark
                ? "Dark mode is active. Easy on the eyes at night."
                : "Light mode is active. Great for bright environments."
              }
            </p>
          </div>
        </Section>
      </div>

      {/* ── Account ───────────────────────────────────────────────────────── */}
      <div className="animate-fade-up stagger-2">
        <Section
          title="Account"
          description="Update your profile information and photos"
        >
          {/* Profile picture */}
          <ImageUploadRow
            label="Profile Picture"
            hint="JPG, PNG or WebP · Max 10 MB"
            currentUrl={user.avatarUrl}
            fallbackInitial={user.displayName[0]?.toUpperCase() ?? "?"}
            endpoint="/auth/profile/avatar"
            fieldName="avatar"
            shape="circle"
            onSuccess={(url) => onUserUpdate({ avatarUrl: url })}
          />

          {/* Cover photo */}
          <ImageUploadRow
            label="Cover Photo"
            hint="Displayed at the top of your profile · JPG, PNG or WebP · Max 10 MB"
            currentUrl={user.coverUrl}
            fallbackInitial="Cover"
            endpoint="/auth/profile/cover"
            fieldName="cover"
            shape="rect"
            onSuccess={(url) => onUserUpdate({ coverUrl: url })}
          />

          {/* Username */}
          <UsernameRow
            currentUsername={user.username}
            onSuccess={(username) => onUserUpdate({ username })}
          />
        </Section>
      </div>
    </div>
  );
}