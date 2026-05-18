// src/pages/DMPage.tsx
// Routes: /messages   and   /messages/:conversationId

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Loader2, MessageSquare, ArrowLeft, Search } from "lucide-react";
import { formatDate } from "../lib/utils";
import {
  getConversations,
  getMessages,
  sendMessage,
  type DMConversation,
  type DMMessage,
} from "../api/dm";

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const index = name ? name.charCodeAt(0) % 6 : 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `var(--avatar-bg-${index})`,
      border: `2px solid var(--avatar-border-${index})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: `var(--avatar-fg-${index})`,
    }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ── Conversation list panel ────────────────────────────────────────────────────

function ConversationList({
  convos, activeId, currentUserId, onSelect, loading,
}: {
  convos: DMConversation[];
  activeId?: string;
  currentUserId: string;
  onSelect: (c: DMConversation) => void;
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const filtered = convos.filter(c =>
    c.other.displayName.toLowerCase().includes(search.toLowerCase()) ||
    c.other.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: 280, flexShrink: 0,
      borderRight: "1.5px solid var(--border)",
      display: "flex", flexDirection: "column",
      background: "var(--card-bg)", overflow: "hidden",
    }}>
      <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
          Messages
        </p>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{
            position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none",
          }} />
          <input
            placeholder="Search conversations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "7px 10px 7px 30px", boxSizing: "border-box",
              borderRadius: "9px", border: "1.5px solid var(--border)",
              fontSize: "12px", fontFamily: "inherit", outline: "none",
              background: "var(--surface-2)", color: "var(--text-primary)",
            }}
            onFocus={e => (e.target.style.borderColor = "#818cf8")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{
              display: "flex", gap: "10px", alignItems: "center",
              padding: "12px 14px", borderBottom: "1px solid var(--border)",
            }}>
              <div className="shimmer" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <div className="shimmer" style={{ height: 11, width: "55%", borderRadius: 6 }} />
                <div className="shimmer" style={{ height: 10, width: "75%", borderRadius: 6 }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center" }}>
            <MessageSquare size={22} style={{ color: "var(--text-muted)", margin: "0 auto 8px", display: "block" }} />
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
              {search ? "No results" : "No messages yet"}
            </p>
          </div>
        ) : (
          filtered.map(c => {
            const isActive = c.id === activeId;
            const preview  = c.lastMessage?.content ?? "Say hello!";
            const isMine   = c.lastMessage?.senderId === currentUserId;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                style={{
                  width: "100%", textAlign: "left",
                  display: "flex", gap: "10px", alignItems: "center",
                  padding: "11px 14px",
                  borderBottom: "1px solid var(--border)",
                  background: isActive ? "var(--brand-50)" : "transparent",
                  border: "none",
                  borderLeft: isActive ? "3px solid var(--brand-500)" : "3px solid transparent",
                  cursor: "pointer", transition: "background 0.12s",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <div style={{ position: "relative" }}>
                  <Avatar name={c.other.displayName} size={38} />
                  {c.unreadCount > 0 && (
                    <span style={{
                      position: "absolute", top: -2, right: -2,
                      background: "#6366f1", color: "white",
                      fontSize: "9px", fontWeight: 700,
                      width: 15, height: 15, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid var(--card-bg)",
                    }}>
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "4px" }}>
                    <p style={{
                      margin: 0, fontSize: "13px",
                      fontWeight: c.unreadCount > 0 ? 700 : 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {c.other.displayName}
                    </p>
                    {c.lastMessage && (
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", flexShrink: 0 }}>
                        {formatDate(c.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p style={{
                    margin: "2px 0 0", fontSize: "11px",
                    color: c.unreadCount > 0 ? "var(--text-secondary)" : "var(--text-muted)",
                    fontWeight: c.unreadCount > 0 ? 600 : 400,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {isMine ? "You: " : ""}{preview}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function Bubble({ msg, isMe }: { msg: DMMessage; isMe: boolean }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: isMe ? "row-reverse" : "row",
      alignItems: "flex-end",
      gap: "6px",
      marginBottom: "4px",
    }}>
      {!isMe && <Avatar name={msg.sender.displayName} size={24} />}
      <div style={{ maxWidth: "68%" }}>
        <div style={{
          padding: "9px 13px",
          borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isMe ? "linear-gradient(135deg, #6366f1, #818cf8)" : "var(--card-bg)",
          border: isMe ? "none" : "1px solid var(--border)",
          color: isMe ? "white" : "var(--text-primary)",
          fontSize: "13px", lineHeight: 1.6,
          wordBreak: "break-word",
          boxShadow: isMe
            ? "0 2px 8px rgba(99,102,241,0.25)"
            : "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          {msg.content}
        </div>
        <p style={{
          margin: "3px 4px 0", fontSize: "10px",
          color: "var(--text-muted)",
          textAlign: isMe ? "right" : "left",
        }}>
          {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          {isMe && (msg.read ? " · Read" : " · Sent")}
        </p>
      </div>
    </div>
  );
}

// ── Conversation view ──────────────────────────────────────────────────────────

function ConversationView({
  conversationId, other, currentUserId, onBack,
}: {
  conversationId: string;
  other: { id: string; username: string; displayName: string };
  currentUserId: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const pollRef                 = useRef<ReturnType<typeof setInterval> | null>(null);
  // Only re-render when the message count actually increases (smart polling)
  const lastCountRef            = useRef<number>(-1);
  const navigate                = useNavigate();

  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await getMessages(conversationId);
      if (msgs.length !== lastCountRef.current) {
        lastCountRef.current = msgs.length;
        setMessages(msgs);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [conversationId]);

  useEffect(() => {
    lastCountRef.current = -1;
    setLoading(true);
    setMessages([]);
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  // Scroll to bottom only when a new message appears
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    try {
      const msg = await sendMessage(conversationId, text);
      setMessages(prev => {
        const next = [...prev, msg];
        lastCountRef.current = next.length;
        return next;
      });
    } finally { setSending(false); }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        padding: "12px 16px", flexShrink: 0,
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "10px",
        background: "var(--card-bg)",
      }}>
        <button onClick={onBack} style={{
          border: "none", background: "var(--surface-2)", borderRadius: "8px",
          width: 30, height: 30, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--text-muted)", flexShrink: 0,
        }}>
          <ArrowLeft size={14} />
        </button>
        <Avatar name={other.displayName} size={34} />
        <div
          onClick={() => navigate(`/user/${other.username}`)}
          style={{ cursor: "pointer", flex: 1, minWidth: 0 }}
        >
          <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
            {other.displayName}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>
            @{other.username}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "14px 16px",
        display: "flex", flexDirection: "column",
        gap: "2px",
        background: "var(--surface-2)",
      }}>
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "10px",
          }}>
            <Avatar name={other.displayName} size={52} />
            <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", margin: 0 }}>
              {other.displayName}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, textAlign: "center" }}>
              This is the start of your conversation.<br />Say hello! 👋
            </p>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <Bubble key={msg.id} msg={msg} isMe={msg.sender.id === currentUserId} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 14px", flexShrink: 0,
        borderTop: "1px solid var(--border)",
        display: "flex", gap: "8px", alignItems: "center",
        background: "var(--card-bg)",
      }}>
        <input
          placeholder={`Message ${other.displayName}…`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          style={{
            flex: 1, padding: "9px 14px", borderRadius: "12px",
            border: "1.5px solid var(--border)", fontSize: "13px",
            fontFamily: "inherit", outline: "none",
            background: "var(--surface-2)", color: "var(--text-primary)",
            transition: "border-color 0.15s",
          }}
          onFocus={e => (e.target.style.borderColor = "#818cf8")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            width: 38, height: 38, borderRadius: "11px", border: "none",
            background: input.trim() ? "linear-gradient(135deg, #6366f1, #818cf8)" : "var(--border)",
            color: "white", cursor: input.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "all 0.15s",
            boxShadow: input.trim() ? "0 3px 10px rgba(99,102,241,0.3)" : "none",
          }}
        >
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── DMPage root ────────────────────────────────────────────────────────────────

export default function DMPage({ currentUserId }: { currentUserId: string }) {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const [convos, setConvos]           = useState<DMConversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<DMConversation | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    getConversations().then(data => {
      setConvos(data);
      if (conversationId) {
        const found = data.find(c => c.id === conversationId);
        if (found) setActiveConvo(found);
      }
    }).finally(() => setLoading(false));
  }, [conversationId]);

  const handleSelect = (c: DMConversation) => {
    setActiveConvo(c);
    setConvos(prev => prev.map(x => x.id === c.id ? { ...x, unreadCount: 0 } : x));
    navigate(`/messages/${c.id}`, { replace: true });
  };

  const handleBack = () => {
    setActiveConvo(null);
    navigate("/messages", { replace: true });
  };

  return (
    // Use position:fixed so the chat shell fills the full viewport
    // (sidebar is positioned separately, so left starts at --sidebar-w)
    <div style={{
      position: "fixed",
      top: 0, bottom: 0,
      left: "var(--sidebar-w, 240px)",
      right: 0,
      display: "flex",
      overflow: "hidden",
      background: "var(--card-bg)",
      borderLeft: "1px solid var(--border)",
    }}>
      <ConversationList
        convos={convos}
        activeId={activeConvo?.id}
        currentUserId={currentUserId}
        onSelect={handleSelect}
        loading={loading}
      />

      {activeConvo ? (
        <ConversationView
          conversationId={activeConvo.id}
          other={activeConvo.other}
          currentUserId={currentUserId}
          onBack={handleBack}
        />
      ) : (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "12px",
          background: "var(--surface-2)",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "16px",
            background: "var(--card-bg)", border: "1.5px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
          }}>
            <MessageSquare size={22} style={{ color: "#6366f1" }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
            Select a conversation
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, textAlign: "center" }}>
            Or visit someone's profile<br />and tap "Message"
          </p>
        </div>
      )}
    </div>
  );
}