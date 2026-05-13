import { Home, Bell, User, Search, LogOut, Zap, MessageSquare, Bookmark, Moon, Sun } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import client from "../../api/client";

interface SidebarProps {
  onLogout: () => void;
  username: string;
  displayName: string;
  dark: boolean;
  onToggleDark: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const navItems = [
  { icon: Home,          label: "Home",          path: "/" },
  { icon: Search,        label: "Explore",        path: "/explore" },
  { icon: MessageSquare, label: "Messages",        path: "/messages" },
  { icon: Bell,          label: "Notifications",  path: "/notifications" },
  { icon: Bookmark,      label: "Bookmarks",       path: "/bookmarks" },
  { icon: User,          label: "Profile",         path: "/profile" },
];

export default function Sidebar({ onLogout, username, displayName, dark, onToggleDark }: SidebarProps) {
  const [dmUnread, setDmUnread] = useState(0);
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const onNotifPage = location.pathname === "/notifications";

  useEffect(() => {
    import("../../api/dm").then(({ getUnreadCount }) => {
      const fetch = () => getUnreadCount().then(setDmUnread).catch(() => {});
      fetch();
      const iv = setInterval(fetch, 15_000);
      return () => clearInterval(iv);
    });
  }, []);

  useEffect(() => {
    if (onNotifPage) { setUnread(0); return; }
    client.get("/notifications")
      .then(res => setUnread(res.data.filter((n: any) => !n.read).length))
      .catch(() => {});
  }, [onNotifPage]);

  const sidebarBg = dark ? "var(--sidebar-bg)" : "#ffffff";
  const activeBg  = dark ? "rgba(129,140,248,0.14)" : "var(--brand-50)";
  const activeColor = dark ? "#a5b4fc" : "var(--brand-600)";
  const hoverBg   = dark ? "rgba(255,255,255,0.05)" : "#f4f5ff";

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%",
      width: "var(--sidebar-w)",
      background: sidebarBg,
      borderRight: `1px solid var(--border)`,
      display: "flex", flexDirection: "column",
      padding: "24px 14px",
      zIndex: 50,
      transition: "background 0.3s, border-color 0.3s",
    }}>
      {/* Logo */}
      <div style={{ padding: "0 8px", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "3px" }}>
          <div style={{
            width: 34, height: 34,
            background: "linear-gradient(135deg, #6366f1, #ec4899)",
            borderRadius: "11px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
          }}>
            <Zap size={17} color="white" fill="white" />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.4px", color: "var(--text-primary)" }}>
            Campus<span style={{
              background: "linear-gradient(135deg, #6366f1, #ec4899)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Connect</span>
          </span>
        </div>
        <p style={{ fontSize: "10.5px", color: "var(--text-muted)", paddingLeft: "43px", fontWeight: 500 }}>
          Your college social space
        </p>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path || (path === "/" && location.pathname === "/");
          const isNotif = path === "/notifications";
          const isDM = path === "/messages";
          return (
            <Link key={path} to={path} style={{ textDecoration: "none" }}>
              <div
                className={active ? "sidebar-nav-active" : "sidebar-nav-item"}
                style={{
                  display: "flex", alignItems: "center", gap: "11px",
                  padding: "9px 11px", borderRadius: "11px",
                  background: active ? activeBg : "transparent",
                  color: active ? activeColor : "var(--text-secondary)",
                  fontWeight: active ? 700 : 500,
                  fontSize: "13.5px",
                  transition: "all 0.15s",
                  cursor: "pointer",
                  position: "relative",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = hoverBg; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                  {isNotif && unread > 0 && !onNotifPage && (
                    <span style={{
                      position: "absolute", top: -5, right: -5,
                      background: "var(--pink-500)", color: "white",
                      fontSize: "8px", fontWeight: 800,
                      minWidth: 15, height: 15, borderRadius: "99px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 3px",
                      border: `2px solid ${sidebarBg}`,
                    }}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                  {isDM && dmUnread > 0 && location.pathname !== "/messages" && (
                    <span style={{
                      position: "absolute", top: -5, right: -5,
                      background: "#6366f1", color: "white",
                      fontSize: "8px", fontWeight: 800,
                      minWidth: 15, height: 15, borderRadius: "99px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 3px",
                      border: `2px solid ${sidebarBg}`,
                    }}>
                      {dmUnread > 9 ? "9+" : dmUnread}
                    </span>
                  )}
                </div>
                {label}
                {active && (
                  <div style={{
                    marginLeft: "auto", width: 5, height: 5, borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1, #ec4899)",
                    flexShrink: 0,
                  }} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDark}
        style={{
          display: "flex", alignItems: "center", gap: "9px",
          width: "100%", padding: "9px 11px", borderRadius: "11px",
          border: `1.5px solid var(--border)`,
          background: dark ? "rgba(129,140,248,0.08)" : "var(--surface-2)",
          color: "var(--text-secondary)",
          fontSize: "13px", fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
          transition: "all 0.2s",
          marginBottom: "10px",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-400)";
          (e.currentTarget as HTMLButtonElement).style.color = dark ? "#a5b4fc" : "var(--brand-600)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
        }}
      >
        <div style={{
          width: 28, height: 16, borderRadius: 99,
          background: dark ? "#6366f1" : "var(--border)",
          position: "relative", transition: "background 0.25s",
          flexShrink: 0,
        }}>
          <div style={{
            position: "absolute", top: 2, left: dark ? 14 : 2,
            width: 12, height: 12, borderRadius: "50%",
            background: "white",
            transition: "left 0.25s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {dark
              ? <Sun size={7} color="#6366f1" />
              : <Moon size={7} color="#6366f1" />
            }
          </div>
        </div>
        {dark ? "Light mode" : "Dark mode"}
      </button>

      {/* User footer */}
      <div style={{ borderTop: `1px solid var(--border)`, paddingTop: "14px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "9px",
          padding: "8px 10px", borderRadius: "11px",
          background: "var(--surface-2)",
          marginBottom: "8px",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: "12px", fontWeight: 800, flexShrink: 0,
            boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
          }}>{getInitials(displayName)}</div>
          <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
            <p style={{
              fontSize: "13px", fontWeight: 700, color: "var(--text-primary)",
              margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{displayName}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>@{username}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{
          display: "flex", alignItems: "center", gap: "9px",
          width: "100%", padding: "8px 11px", borderRadius: "10px",
          border: "none", background: "transparent",
          color: "var(--text-muted)", fontSize: "13px", fontWeight: 500,
          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = dark ? "rgba(225,29,72,0.1)" : "#fff1f2";
            (e.currentTarget as HTMLButtonElement).style.color = "#e11d48";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
          }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
}