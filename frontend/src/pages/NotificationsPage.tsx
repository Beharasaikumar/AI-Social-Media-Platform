import { useState, useEffect } from "react";
import { Heart, MessageCircle, UserPlus, Bell, CheckCheck, Loader2 } from "lucide-react";
import { formatDate } from "../lib/utils";
import type { Notification } from "../types";
import { getNotifications, markAllRead, markOneRead } from "../api/notifications";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const palettes = [
    { bg: "#ede9fe", fg: "#7c3aed" }, { bg: "#fce7f3", fg: "#db2777" },
    { bg: "#d1fae5", fg: "#059669" }, { bg: "#fef3c7", fg: "#d97706" },
    { bg: "#dbeafe", fg: "#2563eb" },
  ];
  const { bg, fg } = palettes[name.charCodeAt(0) % palettes.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${bg}, ${fg}30)`,
      border: `2px solid ${fg}20`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, color: fg,
      boxShadow: `0 2px 8px ${fg}15`,
    }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  LIKE: { icon: Heart, color: "#db2777", bg: "#fce7f3", label: "liked your post" },
  COMMENT: { icon: MessageCircle, color: "#2563eb", bg: "#dbeafe", label: "commented on your post" },
  FOLLOW: { icon: UserPlus, color: "#059669", bg: "#d1fae5", label: "started following you" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getNotifications().then(setNotifications).finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    setMarking(true);
    await markAllRead();
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setMarking(false);
  };

  const handleClick = async (n: Notification) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif)
    );
    try {
      await markOneRead(n.id);
    } catch { /* silent */ }

    if ((n.type === "LIKE" || n.type === "COMMENT") && n.postId) {
      navigate(`/post/${n.postId}`);
    } else if (n.type === "FOLLOW") {
      navigate(`/user/${n.actor.username}`);
    }
  };

  const unread = notifications.filter(n => !n.read).length;
  const isClickable = (n: Notification) =>
    (n.type === "LIKE" || n.type === "COMMENT") && !!n.postId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div className="animate-fade-up" style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.3px" }}>
            Notifications
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            {unread > 0 ? `${unread} unread` : "All caught up!"}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} disabled={marking} style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", borderRadius: "10px",
            background: "var(--brand-50)", border: "1.5px solid var(--brand-200)",
            color: "var(--brand-600)", fontSize: "12px", fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s",
          }}>
            {marking ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
            Mark all read
          </button>
        )}
      </div>

      {/* Loading skeletons */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              borderRadius: "14px", padding: "16px", background: "white",
              border: "1.5px solid var(--border)",
              display: "flex", gap: "12px", alignItems: "center",
            }}>
              <div className="shimmer" style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
                <div className="shimmer" style={{ height: 12, width: "45%", borderRadius: 6 }} />
                <div className="shimmer" style={{ height: 10, width: "28%", borderRadius: 6 }} />
              </div>
              <div className="shimmer" style={{ height: 22, width: 64, borderRadius: 99 }} />
            </div>
          ))}
        </div>

      ) : notifications.length === 0 ? (
        <div style={{
          background: "white", borderRadius: "18px", padding: "64px 24px",
          textAlign: "center", border: "1.5px solid var(--border)",
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: "18px", margin: "0 auto 16px",
            background: "var(--surface-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bell size={26} color="var(--text-muted)" />
          </div>
          <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-secondary)", margin: "0 0 6px" }}>
            All quiet here
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            Notifications appear when someone likes, comments, or follows you
          </p>
        </div>

      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {notifications.map((n, idx) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.LIKE;
            const Icon = cfg.icon;
            const clickable = isClickable(n);

            return (
              <div
                key={n.id}
                className={`animate-fade-up stagger-${Math.min(idx + 1, 4)}`}
                onClick={() => handleClick(n)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "14px 16px", borderRadius: "14px",
                  background: !n.read
                    ? "linear-gradient(135deg, #eef2ff 0%, #fdf2f8 100%)"
                    : "white",
                  border: `1.5px solid ${!n.read ? "var(--brand-200)" : "var(--border)"}`,
                  cursor: clickable ? "pointer" : "default",
                  transition: "all 0.18s",
                  userSelect: "none",
                }}
                onMouseEnter={e => {
                  if (!clickable) return;
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = "0 6px 20px rgba(99,102,241,0.12)";
                  el.style.borderColor = "#a5b4fc";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                  el.style.borderColor = !n.read ? "var(--brand-200)" : "var(--border)";
                }}
              >
                {/* Unread pulse dot */}
                {!n.read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #6366f1, #ec4899)",
                    animation: "pulse-dot 2s infinite",
                  }} />
                )}

                {/* Avatar + type badge stacked */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Avatar name={n.actor.displayName} size={42} />
                  <div style={{
                    position: "absolute", bottom: -2, right: -4,
                    width: 22, height: 22, borderRadius: "50%",
                    background: cfg.bg, border: "2px solid white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon
                      size={11}
                      color={cfg.color}
                      fill={n.type === "LIKE" ? cfg.color : "none"}
                    />
                  </div>
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.55 }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                      {n.actor.displayName}
                    </span>
                    {" "}
                    <span style={{ color: "var(--text-secondary)" }}>{cfg.label}</span>
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
                    {formatDate(n.createdAt)}
                  </p>
                </div>

                {/* Type badge + arrow hint */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: "99px",
                    fontSize: "10px", fontWeight: 700, letterSpacing: "0.4px",
                    background: cfg.bg, color: cfg.color,
                  }}>{n.type}</span>
                  {clickable && (
                    <span style={{
                      fontSize: "16px", color: "var(--text-muted)",
                      lineHeight: 1, marginRight: "2px",
                    }}>›</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}