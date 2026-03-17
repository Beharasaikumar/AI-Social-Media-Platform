import { Home, Bell, User, Search, LogOut, Zap } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import client from "../../api/client";

interface SidebarProps {
  onLogout: () => void;
  username: string;
  displayName: string;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Explore", path: "/explore" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: User, label: "Profile", path: "/profile" },
];

export default function Sidebar({ onLogout, username, displayName }: SidebarProps) {
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const onNotifPage = location.pathname === "/notifications";

  const fetchUnread = () => {
    client.get("/notifications").then(res => {
      setUnread(res.data.filter((n: any) => !n.read).length);
    }).catch(() => { });
  };

  useEffect(() => {
    if (onNotifPage) {
      setUnread(0);
      return;
    }
    fetchUnread();
    // const interval = setInterval(fetchUnread, 30000); // 30s is enough
    // return () => clearInterval(interval);
  }, [onNotifPage]);

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%",
      width: "var(--sidebar-w)",
      background: "white",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      padding: "24px 16px",
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: "0 8px", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, #6366f1, #ec4899)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.3px" }}>
            Campus<span style={{
              background: "linear-gradient(135deg, #6366f1, #ec4899)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Connect</span>
          </span>
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", paddingLeft: "40px" }}>
          Your college social space
        </p>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          const isNotif = path === "/notifications";
          return (
            <Link key={path} to={path} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 12px", borderRadius: "12px",
                background: active ? "var(--brand-50)" : "transparent",
                color: active ? "var(--brand-600)" : "var(--text-secondary)",
                fontWeight: active ? 600 : 500,
                fontSize: "14px",
                transition: "all 0.15s",
                cursor: "pointer",
                position: "relative",
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "#f8f9ff"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div style={{ position: "relative" }}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  {isNotif && unread > 0 && !onNotifPage && (
                    <span style={{
                      position: "absolute", top: -4, right: -4,
                      background: "var(--pink-500)", color: "white",
                      fontSize: "9px", fontWeight: 700,
                      width: 16, height: 16, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid white",
                    }}>{unread > 9 ? "9+" : unread}</span>
                  )}
                </div>
                {label}
                {active && (
                  <div style={{
                    marginLeft: "auto", width: 6, height: 6,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1, #ec4899)",
                  }} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "8px 10px", borderRadius: "12px",
          background: "var(--surface-2)", marginBottom: "8px",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: "13px", fontWeight: 700, flexShrink: 0,
          }}>{getInitials(displayName)}</div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>@{username}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{
          display: "flex", alignItems: "center", gap: "10px",
          width: "100%", padding: "8px 12px", borderRadius: "10px",
          border: "none", background: "transparent",
          color: "var(--text-muted)", fontSize: "13px", fontWeight: 500,
          cursor: "pointer", transition: "all 0.15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff1f2"; (e.currentTarget as HTMLButtonElement).style.color = "#e11d48"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  );
}