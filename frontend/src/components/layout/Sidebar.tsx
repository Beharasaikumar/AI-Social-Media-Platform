// src/components/layout/Sidebar.tsx
import {
  Home, Bell, User, Search, LogOut, Zap, MessageSquare,
  Bookmark, Moon, Sun, Briefcase, FileText, LayoutDashboard,
  Settings, Shield,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

interface SidebarProps {
  onLogout: () => void;
  username: string;
  displayName: string;
  dark: boolean;
  onToggleDark: () => void;
  isAdmin?: boolean;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Nav structure ─────────────────────────────────────────────────────────────

const userNavSections = [
  {
    label: "MAIN",
    items: [
      { icon: Home,          label: "Home",          path: "/" },
      { icon: Search,        label: "Explore",        path: "/explore" },
      { icon: Bell,          label: "Notifications",  path: "/notifications" },
      { icon: MessageSquare, label: "Messages",       path: "/messages" },
    ],
  },
  {
    label: "COMMUNITY",
    items: [
      { icon: Briefcase, label: "Placements",       path: "/placements" },
      { icon: Bell,      label: "Announcements",    path: "/announcements" },
      { icon: FileText,  label: "Notes & Materials", path: "/materials" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { icon: Bookmark, label: "Saved Posts", path: "/bookmarks" },
      { icon: User,     label: "Profile",     path: "/profile" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { icon: Settings, label: "Settings", path: "/settings" },
      { icon: Shield,   label: "Privacy",  path: "/privacy" },
    ],
  },
];

const adminNavSections = [
  {
    label: "MAIN",
    items: [
      { icon: Home,   label: "Home",    path: "/" },
      { icon: Search, label: "Explore", path: "/explore" },
    ],
  },
  {
    label: "COMMUNITY",
    items: [
      { icon: Briefcase, label: "Placements",       path: "/placements" },
      { icon: Bell,      label: "Announcements",    path: "/announcements" },
      { icon: FileText,  label: "Notes & Materials", path: "/materials" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { icon: Bookmark,        label: "Saved Posts", path: "/bookmarks" },
      { icon: User,            label: "Profile",     path: "/profile" },
      { icon: LayoutDashboard, label: "Admin Panel", path: "/admin" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { icon: Settings, label: "Settings", path: "/settings" },
      { icon: Shield,   label: "Privacy",  path: "/privacy" },
    ],
  },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────

export default function Sidebar({
  onLogout, username, displayName, dark, onToggleDark, isAdmin,
}: SidebarProps) {
  const [dmUnread, setDmUnread]       = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  const location   = useLocation();
  const sections   = isAdmin ? adminNavSections : userNavSections;
  const onNotifPage = location.pathname === "/notifications";

  useEffect(() => {
    if (isAdmin) return;
    import("../../api/dm").then(({ getUnreadCount }) => {
      const fetch = () => getUnreadCount().then(setDmUnread).catch(() => {});
      fetch();
      const iv = setInterval(fetch, 15_000);
      return () => clearInterval(iv);
    });
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin || onNotifPage) { setNotifUnread(0); return; }
    import("../../api/notifications").then(({ getNotifications }) => {
      getNotifications()
        .then((data) => setNotifUnread(data.filter((n: any) => !n.read).length))
        .catch(() => {});
    });
  }, [onNotifPage, isAdmin]);

  const sidebarBg   = dark ? "var(--sidebar-bg)" : "#ffffff";
  const activeBg    = dark ? "rgba(129,140,248,0.14)" : "var(--brand-50)";
  const activeColor = dark ? "#a5b4fc" : "var(--brand-600)";
  const hoverBg     = dark ? "rgba(255,255,255,0.05)" : "#f4f5ff";
  const labelColor  = dark ? "#3d4060" : "#b0b3c6";

  const badge = (path: string) => {
    if (path === "/notifications" && notifUnread > 0 && !onNotifPage)
      return { count: notifUnread, color: "var(--pink-500)" };
    if (path === "/messages" && dmUnread > 0 && location.pathname !== "/messages")
      return { count: dmUnread, color: "#6366f1" };
    return null;
  };

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%",
      width: "var(--sidebar-w)",
      background: sidebarBg,
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      padding: "20px 14px 16px",
      zIndex: 50,
      transition: "background 0.3s, border-color 0.3s",
      overflowY: "auto",
    }}>

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "0 8px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "3px" }}>
          <div style={{
            width: 34, height: 34,
            background: "linear-gradient(135deg, #6366f1, #ec4899)",
            borderRadius: "11px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)", flexShrink: 0,
          }}>
            <Zap size={17} color="white" fill="white" />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.4px", color: "var(--text-primary)" }}>
            Campus
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #ec4899)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Connect</span>
          </span>
        </div>
        <p style={{ fontSize: "10.5px", color: "var(--text-muted)", paddingLeft: "43px", fontWeight: 500, margin: 0 }}>
          {isAdmin ? "Admin panel" : "Your college social space"}
        </p>
      </div>

      {/* ── Nav sections ─────────────────────────────────────────────────── */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>
        {sections.map((section) => (
          <div key={section.label}>
            <p style={{
              fontSize: "10px", fontWeight: 700, color: labelColor,
              letterSpacing: "0.8px", margin: "0 0 4px 10px",
              transition: "color 0.3s",
            }}>
              {section.label}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              {section.items.map(({ icon: Icon, label, path }) => {
                const active = location.pathname === path;
                const b      = badge(path);
                return (
                  <Link key={path} to={path} style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "8px 10px", borderRadius: "10px",
                        background: active ? activeBg : "transparent",
                        color: active ? activeColor : "var(--text-secondary)",
                        fontWeight: active ? 700 : 500,
                        fontSize: "13px", transition: "all 0.15s",
                        cursor: "pointer", position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) (e.currentTarget as HTMLDivElement).style.background = hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                      }}
                    >
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                        {b && (
                          <span style={{
                            position: "absolute", top: -5, right: -6,
                            background: b.color, color: "white",
                            fontSize: "8px", fontWeight: 800,
                            minWidth: 15, height: 15, borderRadius: "99px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: "0 3px", border: `2px solid ${sidebarBg}`,
                          }}>
                            {b.count > 9 ? "9+" : b.count}
                          </span>
                        )}
                      </div>

                      {label}

                      {active && (
                        <div style={{
                          marginLeft: "auto", width: 5, height: 5, borderRadius: "50%",
                          background: "linear-gradient(135deg, #6366f1, #ec4899)", flexShrink: 0,
                        }} />
                      )}

                      {path === "/admin" && (
                        <span style={{
                          marginLeft: active ? 0 : "auto",
                          fontSize: "9px", fontWeight: 800,
                          background: "linear-gradient(135deg, #6366f1, #ec4899)",
                          color: "white", padding: "2px 6px",
                          borderRadius: "99px", letterSpacing: "0.3px", flexShrink: 0,
                        }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User footer ───────────────────────────────────────────────────── */}
      <div style={{ marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "9px",
          padding: "7px 10px", borderRadius: "10px",
          background: "var(--surface-2)", marginBottom: "6px",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: "11px", fontWeight: 800, flexShrink: 0,
            boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
          }}>
            {getInitials(displayName)}
          </div>
          <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
            <p style={{
              fontSize: "12.5px", fontWeight: 700, color: "var(--text-primary)",
              margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {displayName}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
              @{username}
              {isAdmin && (
                <span style={{ marginLeft: 5, color: "var(--brand-500)", fontSize: "9px", fontWeight: 700 }}>
                  ADMIN
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            width: "100%", padding: "7px 11px", borderRadius: "9px",
            border: "none", background: "transparent",
            color: "var(--text-muted)", fontSize: "12.5px", fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = dark ? "rgba(225,29,72,0.1)" : "#fff1f2";
            (e.currentTarget as HTMLButtonElement).style.color = "#e11d48";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
          }}
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  );
}