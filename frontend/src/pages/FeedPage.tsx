import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, Heart, MessageCircle, Loader2, Send, Image, Video, X,
  Repeat2, Bookmark, MoreHorizontal, Pencil, Trash2, AtSign, SmilePlus,
} from "lucide-react";
import { getInitials, formatDate } from "../lib/utils";
import type { Post, Comment } from "../types";
import {
  getPosts, createPost, likePost, getComments, createComment,
  editPost, deletePost, repostPost, bookmarkPost, reactToPost,
} from "../api/posts";
import AiToneHelper from "../components/AiToneHelper";

const REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];

/* ── Avatar ─────────────────────────────────────────────────────────────────── */
function UserAvatar({ name, size = 38 }: { name: string; size?: number }) {
  const palettes = [
    { bg: "#ede9fe", fg: "#7c3aed" }, { bg: "#fce7f3", fg: "#db2777" },
    { bg: "#d1fae5", fg: "#059669" }, { bg: "#fef3c7", fg: "#d97706" },
    { bg: "#dbeafe", fg: "#2563eb" }, { bg: "#fce7f3", fg: "#9333ea" },
  ];
  const { bg, fg } = palettes[name.charCodeAt(0) % palettes.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${bg}, ${fg}60)`,
      border: `2px solid ${fg}25`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, color: fg,
    }}>{getInitials(name)}</div>
  );
}

/* ── Mention renderer ────────────────────────────────────────────────────────── */
function MentionText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const parts = text.split(/(@[a-zA-Z0-9_]{3,20})/g);
  return (
    <p style={{ margin: 0, ...style }}>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} style={{ color: "var(--brand-500)", fontWeight: 600, cursor: "pointer" }}
            onClick={e => { e.stopPropagation(); window.location.href = `/user/${part.slice(1)}`; }}>
            {part}
          </span>
        ) : part
      )}
    </p>
  );
}

/* ── Reaction picker ─────────────────────────────────────────────────────────── */
function ReactionPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="reaction-picker" style={{
      position: "absolute", bottom: "calc(100% + 8px)", left: 0,
      background: "var(--card-bg)", border: "1.5px solid var(--border)",
      borderRadius: "16px", padding: "8px 10px",
      display: "flex", gap: "2px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      zIndex: 100, animation: "fadeIn 0.15s ease",
    }}>
      {REACTIONS.map(emoji => (
        <button key={emoji} onClick={() => onSelect(emoji)} style={{
          fontSize: "20px", background: "none", border: "none",
          cursor: "pointer", padding: "4px 7px", borderRadius: "10px",
          transition: "transform 0.15s, background 0.12s",
          lineHeight: 1,
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.35)";
            (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.background = "none";
          }}
        >{emoji}</button>
      ))}
    </div>
  );
}

/* ── Edit post modal ─────────────────────────────────────────────────────────── */
function EditPostModal({ post, onSave, onClose }: { post: Post; onSave: (p: Post) => void; onClose: () => void }) {
  const [content, setContent] = useState(post.content || "");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try { const u = await editPost(post.id, content); onSave(u); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="animate-bounce-in" style={{
        background: "var(--card-bg)", borderRadius: "20px",
        width: "100%", maxWidth: "520px",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-modal)", overflow: "hidden",
      }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>Edit post</p>
          <button onClick={onClose} style={{
            border: "none", background: "var(--surface-2)", borderRadius: "8px",
            width: 30, height: 30, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-muted)",
          }}><X size={15} /></button>
        </div>
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <textarea ref={ref} value={content} onChange={e => setContent(e.target.value)} rows={4} style={{
            width: "100%", border: "1.5px solid var(--border)", borderRadius: "12px",
            padding: "12px 14px", fontSize: "14px", lineHeight: 1.7,
            fontFamily: "inherit", outline: "none", resize: "none",
            background: "var(--input-bg)", color: "var(--text-primary)", transition: "border-color 0.15s",
          }}
            onFocus={e => (e.target.style.borderColor = "var(--brand-400)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button onClick={onClose} style={{
              padding: "9px 18px", borderRadius: "10px",
              border: "1.5px solid var(--border)", background: "var(--card-bg)",
              color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !content.trim()} style={{
              padding: "9px 20px", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              color: "white", fontSize: "13px", fontWeight: 700,
              cursor: saving || !content.trim() ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: "6px",
              opacity: saving || !content.trim() ? 0.7 : 1,
            }}>
              {saving && <Loader2 size={13} className="animate-spin" />} Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Action pill ─────────────────────────────────────────────────────────────── */
function ActionPill({
  children, active, activeStyle, onClick, disabled, className,
}: {
  children: React.ReactNode;
  active?: boolean;
  activeStyle?: React.CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "5px 11px", borderRadius: "99px",
        border: `1.5px solid ${active ? (activeStyle?.borderColor ?? "var(--border)") : "var(--border)"}`,
        background: active ? (activeStyle?.background ?? "var(--surface-2)") : "var(--surface-2)",
        color: active ? (activeStyle?.color ?? "var(--text-muted)") : "var(--text-muted)",
        fontSize: "12px", fontWeight: 600, cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit", transition: "all 0.15s",
        ...(active ? activeStyle : {}),
      }}
    >
      {children}
    </button>
  );
}

/* ── Post card ───────────────────────────────────────────────────────────────── */
interface PostCardProps {
  post: Post; currentUserId: string;
  onUpdate: (p: Post) => void; onDelete: (id: string) => void;
  onRepost: (p: Post) => void;
  expanded: boolean; onToggleComments: () => void;
  comments: Comment[]; commentInput: string;
  onCommentChange: (v: string) => void; onCommentSubmit: () => void;
  submitting: boolean;
}

function PostCard({
  post, currentUserId, onUpdate, onDelete, onRepost,
  expanded, onToggleComments, comments, commentInput,
  onCommentChange, onCommentSubmit, submitting,
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [liking, setLiking] = useState(false);
  const [reposting, setReposting] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = post.author.id === currentUserId;
  const isPureRepost = !post.content && !post.mediaUrl && !!post.repostOf;

  useEffect(() => {
    if (!showMenu) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => document.removeEventListener("mousedown", h);
  }, [showMenu]);

  const handleLike = async () => {
    setLiking(true);
    try {
      const r = await likePost(post.id);
      onUpdate({ ...post, likedByMe: r.liked, _count: { ...post._count!, likes: r.liked ? post._count!.likes + 1 : post._count!.likes - 1 } });
    } finally { setLiking(false); }
  };

  const handleReact = async (emoji: string) => {
    setShowReactions(false);
    const r = await reactToPost(post.id, emoji);
    const prev = post.myReaction;
    const rxs = [...(post.reactions || [])];
    if (prev) {
      const idx = rxs.findIndex(x => x.emoji === prev);
      if (idx >= 0) { if (rxs[idx].count <= 1) rxs.splice(idx, 1); else rxs[idx] = { ...rxs[idx], count: rxs[idx].count - 1 }; }
    }
    if (r.reaction) {
      const idx = rxs.findIndex(x => x.emoji === r.reaction);
      if (idx >= 0) rxs[idx] = { ...rxs[idx], count: rxs[idx].count + 1 }; else rxs.push({ emoji: r.reaction, count: 1 });
    }
    onUpdate({ ...post, myReaction: r.reaction, reactions: rxs });
  };

  const handleRepost = async () => {
    setReposting(true);
    try {
      const r = await repostPost(post.id);
      const u = { ...post, repostedByMe: r.reposted, _count: { ...post._count!, reposts: r.reposted ? post._count!.reposts + 1 : post._count!.reposts - 1 } };
      onUpdate(u);
      if (r.reposted) onRepost(u);
    } finally { setReposting(false); }
  };

  const handleBookmark = async () => {
    setBookmarking(true);
    try { const r = await bookmarkPost(post.id); onUpdate({ ...post, bookmarkedByMe: r.bookmarked }); }
    finally { setBookmarking(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    setShowMenu(false);
    await deletePost(post.id);
    onDelete(post.id);
  };

  // Display author (for pure reposts, show origin author)
  const displayAuthor = isPureRepost && post.repostOf?.author ? post.repostOf.author : post.author;
  const displayContent = isPureRepost ? post.repostOf?.content : post.content;
  const displayMedia = isPureRepost ? { url: post.repostOf?.mediaUrl, type: post.repostOf?.mediaType } : { url: post.mediaUrl, type: post.mediaType };

  return (
    <>
      {showEditModal && <EditPostModal post={post} onSave={onUpdate} onClose={() => setShowEditModal(false)} />}
      <div style={{
        background: "var(--card-bg)", borderRadius: "18px",
        border: "1.5px solid var(--border)",
        overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s",
        boxShadow: "var(--shadow-card)",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-hover)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)"; }}
      >
        {/* Repost banner */}
        {isPureRepost && (
          <div style={{
            padding: "6px 18px", display: "flex", alignItems: "center", gap: "6px",
            background: "var(--surface-2)", borderBottom: "1px solid var(--border)",
          }}>
            <Repeat2 size={12} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
              {post.author.displayName} reposted
            </span>
          </div>
        )}

        {/* Header */}
        <div style={{ padding: "16px 18px 0" }}>
          <div style={{ display: "flex", gap: "11px" }}>
            <UserAvatar name={displayAuthor.displayName} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
                  {displayAuthor.displayName}
                </span>
                <span style={{
                  fontSize: "11px", color: "var(--text-muted)",
                  background: "var(--surface-2)", padding: "1px 8px",
                  borderRadius: "99px", border: "1px solid var(--border)",
                }}>@{displayAuthor.username}</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
                  {formatDate(post.createdAt)}
                  {post.updatedAt && post.updatedAt !== post.createdAt && (
                    <span style={{ marginLeft: 4, fontStyle: "italic", opacity: 0.7 }}>(edited)</span>
                  )}
                </span>
                {/* Options */}
                {isOwner && !isPureRepost && (
                  <div style={{ position: "relative" }} ref={menuRef}>
                    <button onClick={() => setShowMenu(v => !v)} style={{
                      border: "none", background: "none", cursor: "pointer",
                      padding: "3px 4px", color: "var(--text-muted)", borderRadius: "6px",
                      display: "flex", alignItems: "center", transition: "color 0.15s, background 0.15s",
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {showMenu && (
                      <div className="context-menu" style={{
                        position: "absolute", right: 0, top: "calc(100% + 4px)",
                        background: "var(--card-bg)", border: "1.5px solid var(--border)",
                        borderRadius: "13px", overflow: "hidden",
                        boxShadow: "var(--shadow-modal)", zIndex: 50, minWidth: "145px",
                      }}>
                        {[
                          { icon: Pencil, label: "Edit", color: "var(--text-secondary)", hoverBg: "var(--surface-2)", onClick: () => { setShowMenu(false); setShowEditModal(true); } },
                          { icon: Trash2, label: "Delete", color: "#e11d48", hoverBg: "rgba(225,29,72,0.06)", onClick: handleDelete },
                        ].map(({ icon: Icon, label, color, hoverBg, onClick }) => (
                          <button key={label} onClick={onClick} style={{
                            width: "100%", padding: "10px 14px", border: "none", background: "none",
                            cursor: "pointer", fontSize: "13px", fontWeight: 600,
                            color, textAlign: "left", fontFamily: "inherit",
                            display: "flex", alignItems: "center", gap: "8px", transition: "background 0.12s",
                          }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = hoverBg}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "none"}
                          >
                            <Icon size={13} /> {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              {displayContent && (
                <MentionText text={displayContent} style={{
                  fontSize: "14px", lineHeight: 1.75,
                  color: "var(--text-secondary)", margin: "9px 0 0", wordBreak: "break-word",
                }} />
              )}
            </div>
          </div>
        </div>

        {/* Media */}
        {displayMedia.url && (
          <div style={{ margin: "14px 0 0", borderTop: "1px solid var(--border)" }}>
            {displayMedia.type === "video"
              ? <video src={displayMedia.url} controls style={{ width: "100%", maxHeight: "460px", display: "block", background: "#000" }} />
              : <img src={displayMedia.url} alt="post" style={{ width: "100%", maxHeight: "520px", objectFit: "cover", display: "block" }} />
            }
          </div>
        )}

        {/* Quoted repost (post WITH its own content quoting another) */}
        {!isPureRepost && post.repostOf && (
          <div style={{ margin: "12px 18px 0" }}>
            <div style={{
              border: "1.5px solid var(--border)", borderRadius: "13px",
              overflow: "hidden", background: "var(--surface-2)",
            }}>
              <div style={{ padding: "11px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px" }}>
                  <span style={{ fontWeight: 700, fontSize: "12px", color: "var(--text-primary)" }}>
                    {post.repostOf.author?.displayName}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>@{post.repostOf.author?.username}</span>
                </div>
                {post.repostOf.content && (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    {post.repostOf.content}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reaction bubbles */}
        {post.reactions && post.reactions.length > 0 && (
          <div style={{ padding: "8px 18px 0", display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {post.reactions.map(rx => (
              <button key={rx.emoji} onClick={() => handleReact(rx.emoji)} style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "3px 9px", borderRadius: "99px", fontSize: "12px",
                border: `1.5px solid ${post.myReaction === rx.emoji ? "var(--brand-400)" : "var(--border)"}`,
                background: post.myReaction === rx.emoji ? "var(--brand-50)" : "var(--surface-2)",
                cursor: "pointer", fontWeight: 700,
                color: post.myReaction === rx.emoji ? "var(--brand-600)" : "var(--text-secondary)",
                transition: "all 0.15s", fontFamily: "inherit",
              }}>
                <span style={{ fontSize: "13px" }}>{rx.emoji}</span> {rx.count}
              </button>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div style={{ padding: "10px 18px 14px" }}>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>

            {/* Like */}
            <button className="heart-pop" onClick={handleLike} disabled={liking} style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "5px 11px", borderRadius: "99px",
              border: `1.5px solid ${post.likedByMe ? "#f9a8d4" : "var(--border)"}`,
              background: post.likedByMe ? "rgba(219,39,119,0.08)" : "var(--surface-2)",
              color: post.likedByMe ? "#db2777" : "var(--text-muted)",
              fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}>
              <Heart size={13} fill={post.likedByMe ? "currentColor" : "none"} /> {post._count?.likes}
            </button>

            {/* React */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowReactions(v => !v)} style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "5px 11px", borderRadius: "99px",
                border: `1.5px solid ${post.myReaction ? "var(--brand-300)" : "var(--border)"}`,
                background: post.myReaction ? "var(--brand-50)" : "var(--surface-2)",
                color: post.myReaction ? "var(--brand-600)" : "var(--text-muted)",
                fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}>
                {post.myReaction
                  ? <span style={{ fontSize: "13px" }}>{post.myReaction}</span>
                  : <SmilePlus size={13} />
                }
              </button>
              {showReactions && <ReactionPicker onSelect={handleReact} onClose={() => setShowReactions(false)} />}
            </div>

            {/* Comments */}
            <button onClick={onToggleComments} style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "5px 11px", borderRadius: "99px",
              border: `1.5px solid ${expanded ? "var(--brand-300)" : "var(--border)"}`,
              background: expanded ? "var(--brand-50)" : "var(--surface-2)",
              color: expanded ? "var(--brand-600)" : "var(--text-muted)",
              fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}>
              <MessageCircle size={13} /> {post._count?.comments}
            </button>

            {/* Repost */}
            <button onClick={handleRepost} disabled={reposting} style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "5px 11px", borderRadius: "99px",
              border: `1.5px solid ${post.repostedByMe ? "rgba(5,150,105,0.4)" : "var(--border)"}`,
              background: post.repostedByMe ? "rgba(5,150,105,0.08)" : "var(--surface-2)",
              color: post.repostedByMe ? "#059669" : "var(--text-muted)",
              fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}>
              {reposting ? <Loader2 size={13} className="animate-spin" /> : <Repeat2 size={13} />}
              {post._count?.reposts || 0}
            </button>

            <div style={{ flex: 1 }} />

            {/* Bookmark */}
            <button onClick={handleBookmark} disabled={bookmarking} style={{
              display: "inline-flex", alignItems: "center",
              padding: "5px 8px", borderRadius: "99px",
              border: "none", background: "transparent",
              color: post.bookmarkedByMe ? "var(--brand-500)" : "var(--text-muted)",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              <Bookmark size={15} fill={post.bookmarkedByMe ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Comments section */}
          {expanded && (
            <div className="animate-fade-in" style={{ marginTop: "13px", paddingTop: "13px", borderTop: "1px solid var(--border)" }}>
              {comments.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "8px 0 10px" }}>
                  No comments yet — start the conversation!
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginBottom: "12px" }}>
                  {comments.map(c => (
                    <div key={c.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <UserAvatar name={c.author.displayName} size={28} />
                      <div style={{
                        background: "var(--surface-2)", borderRadius: "12px",
                        padding: "8px 12px", flex: 1, border: "1px solid var(--border)",
                      }}>
                        <span style={{ fontWeight: 700, fontSize: "12px", color: "var(--text-primary)" }}>
                          {c.author.displayName}
                        </span>
                        <MentionText text={c.content} style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "2px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  placeholder="Write a comment… @mention someone"
                  value={commentInput}
                  onChange={e => onCommentChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && onCommentSubmit()}
                  style={{
                    flex: 1, padding: "9px 13px", borderRadius: "11px",
                    border: "1.5px solid var(--border)", fontSize: "13px",
                    fontFamily: "inherit", outline: "none",
                    background: "var(--input-bg)", color: "var(--text-primary)",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--brand-400)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
                <button onClick={onCommentSubmit} disabled={submitting} style={{
                  padding: "9px 15px", borderRadius: "11px",
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  border: "none", color: "white", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "4px",
                  fontSize: "12px", fontWeight: 700, fontFamily: "inherit",
                  boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                }}>
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Mention dropdown ────────────────────────────────────────────────────────── */
function MentionDropdown({ users, onSelect }: { users: string[]; onSelect: (u: string) => void }) {
  if (!users.length) return null;
  return (
    <div style={{
      position: "absolute", bottom: "100%", left: 0, right: 0,
      background: "var(--card-bg)", border: "1.5px solid var(--border)",
      borderRadius: "12px", overflow: "hidden",
      boxShadow: "var(--shadow-modal)", zIndex: 50, marginBottom: "4px",
    }}>
      {users.map(u => (
        <button key={u} onMouseDown={e => { e.preventDefault(); onSelect(u); }} style={{
          width: "100%", padding: "9px 14px", border: "none", background: "none",
          fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)",
          textAlign: "left", cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: "8px", transition: "background 0.12s",
        }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "none"}
        >
          <AtSign size={12} style={{ color: "var(--brand-500)" }} /> @{u}
        </button>
      ))}
    </div>
  );
}

/* ── FeedPage ─────────────────────────────────────────────────────────────────── */
export default function FeedPage({ currentUserId }: { currentUserId: string }) {
  const [posts, setPosts]             = useState<Post[]>([]);
  const [content, setContent]         = useState("");
  const [mediaFile, setMediaFile]     = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: string } | null>(null);
  const [loading, setLoading]         = useState(true);
  const [posting, setPosting]         = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments]       = useState<Record<string, Comment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [submitting, setSubmitting]   = useState<string | null>(null);
  const [showAi, setShowAi]           = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<string[]>([]);
  const [allUsernames, setAllUsernames] = useState<string[]>([]);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getPosts().then(data => {
      setPosts(data);
      setAllUsernames([...new Set(data.map((p: Post) => p.author.username))]);
    }).finally(() => setLoading(false));
  }, []);

  const handleContentChange = (val: string) => {
    setContent(val);
    const lastWord = val.split(/\s/).pop() || "";
    if (lastWord.startsWith("@") && lastWord.length > 1) {
      const q = lastWord.slice(1).toLowerCase();
      setMentionSuggestions(allUsernames.filter(u => u.toLowerCase().startsWith(q)).slice(0, 5));
    } else {
      setMentionSuggestions([]);
    }
  };

  const handleMentionSelect = (username: string) => {
    const words = content.split(/(\s)/);
    words[words.length - 1] = `@${username} `;
    setContent(words.join(""));
    setMentionSuggestions([]);
    textareaRef.current?.focus();
  };

  const handleMediaSelect = (file: File) => {
    setMediaFile(file);
    setMediaPreview({ url: URL.createObjectURL(file), type: file.type.startsWith("video/") ? "video" : "image" });
  };

  const removeMedia = () => {
    setMediaFile(null); setMediaPreview(null);
    if (imageRef.current) imageRef.current.value = "";
    if (videoRef.current) videoRef.current.value = "";
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaFile) return;
    setPosting(true);
    try {
      const p = await createPost(content.trim(), mediaFile || undefined);
      setPosts(prev => [p, ...prev]);
      setContent(""); removeMedia(); setMentionSuggestions([]);
    } finally { setPosting(false); }
  };

  const handleUpdatePost = useCallback((updated: Post) => {
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
  }, []);

  const handleDeletePost = useCallback((id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  const toggleComments = async (postId: string) => {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    setExpandedPost(postId);
    if (!comments[postId]) {
      const data = await getComments(postId);
      setComments(prev => ({ ...prev, [postId]: data }));
    }
  };

  const handleComment = async (postId: string) => {
    const text = commentInput[postId]?.trim();
    if (!text) return;
    setSubmitting(postId);
    try {
      const c = await createComment(postId, text);
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), c] }));
      setCommentInput(prev => ({ ...prev, [postId]: "" }));
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, _count: { ...p._count!, comments: p._count!.comments + 1 } } : p));
    } finally { setSubmitting(null); }
  };

  const canPost = (content.trim().length > 0 || !!mediaFile) && !posting;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {showAi && <AiToneHelper draft={content} onApply={t => setContent(t)} onClose={() => setShowAi(false)} />}

      <input ref={imageRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => e.target.files?.[0] && handleMediaSelect(e.target.files[0])} />
      <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }}
        onChange={e => e.target.files?.[0] && handleMediaSelect(e.target.files[0])} />

      {/* Header */}
      <div className="animate-fade-up">
        <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 2px", letterSpacing: "-0.5px", color: "var(--text-primary)" }}>Home</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>What's happening on campus</p>
      </div>

      {/* Compose card */}
      <div className="animate-fade-up stagger-1" style={{
        background: "var(--card-bg)", borderRadius: "18px", padding: "18px",
        border: "1.5px solid var(--border)", boxShadow: "var(--shadow-card)",
      }}>
        <div style={{ position: "relative" }}>
          <textarea ref={textareaRef}
            placeholder="Share a thought… use @username to mention someone"
            value={content} onChange={e => handleContentChange(e.target.value)}
            rows={3} style={{
              width: "100%", border: "none", outline: "none", resize: "none",
              fontSize: "15px", lineHeight: 1.7, color: "var(--text-primary)",
              background: "transparent", fontFamily: "inherit",
            }} />
          <MentionDropdown users={mentionSuggestions} onSelect={handleMentionSelect} />
        </div>

        {mediaPreview && (
          <div style={{ marginBottom: "12px", position: "relative", borderRadius: "12px", overflow: "hidden" }}>
            {mediaPreview.type === "video"
              ? <video src={mediaPreview.url} controls style={{ width: "100%", maxHeight: 360, display: "block", background: "#000", borderRadius: "12px" }} />
              : <img src={mediaPreview.url} alt="" style={{ width: "100%", maxHeight: 360, objectFit: "cover", display: "block", borderRadius: "12px" }} />
            }
            <button onClick={removeMedia} style={{
              position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%",
              background: "rgba(0,0,0,0.6)", border: "none", color: "white",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}><X size={14} /></button>
          </div>
        )}

        <div style={{ height: 1, background: "var(--border)", margin: "4px 0 12px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          {[
            { icon: Image, label: "Photo", ref: imageRef, accent: "#6366f1" },
            { icon: Video, label: "Video", ref: videoRef, accent: "#ec4899" },
          ].map(({ icon: Icon, label, ref, accent }) => (
            <button key={label} onClick={() => ref.current?.click()} style={{
              display: "flex", alignItems: "center", gap: "5px", padding: "6px 11px",
              borderRadius: "9px", border: "1.5px solid var(--border)",
              background: "var(--surface-2)", color: "var(--text-secondary)",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = accent; (e.currentTarget as HTMLButtonElement).style.color = accent; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
            >
              <Icon size={13} /> {label}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {content.trim().length > 0 && (
            <button className="ai-btn animate-fade-in" onClick={() => setShowAi(true)}>
              <Sparkles size={12} /> AI Tone
            </button>
          )}

          <button onClick={handlePost} disabled={!canPost} style={{
            padding: "7px 20px", borderRadius: "10px",
            background: canPost ? "linear-gradient(135deg, #6366f1, #818cf8)" : "var(--surface-3)",
            border: "none",
            color: canPost ? "white" : "var(--text-muted)",
            fontSize: "13px", fontWeight: 700, cursor: canPost ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s",
            boxShadow: canPost ? "0 3px 12px rgba(99,102,241,0.35)" : "none",
          }}>
            {posting ? <><Loader2 size={13} className="animate-spin" /> Posting…</> : <><Send size={13} /> Post</>}
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: "var(--card-bg)", borderRadius: "18px", padding: "18px", border: "1.5px solid var(--border)", display: "flex", gap: "12px" }}>
              <div className="shimmer" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "9px" }}>
                <div className="shimmer" style={{ height: 12, width: "35%", borderRadius: 6 }} />
                <div className="shimmer" style={{ height: 12, width: "100%", borderRadius: 6 }} />
                <div className="shimmer" style={{ height: 12, width: "60%", borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          background: "var(--card-bg)", borderRadius: "18px", padding: "52px 32px",
          textAlign: "center", border: "1.5px solid var(--border)",
        }}>
          <div style={{ fontSize: "44px", marginBottom: "12px" }}>✨</div>
          <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-secondary)", margin: "0 0 5px" }}>
            Campus is quiet…
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post, idx) => (
          <div key={post.id} className={`animate-fade-up stagger-${Math.min(idx + 1, 4)}`}>
            <PostCard
              post={post} currentUserId={currentUserId}
              onUpdate={handleUpdatePost} onDelete={handleDeletePost} onRepost={() => {}}
              expanded={expandedPost === post.id} onToggleComments={() => toggleComments(post.id)}
              comments={comments[post.id] || []}
              commentInput={commentInput[post.id] || ""}
              onCommentChange={v => setCommentInput(prev => ({ ...prev, [post.id]: v }))}
              onCommentSubmit={() => handleComment(post.id)}
              submitting={submitting === post.id}
            />
          </div>
        ))
      )}
    </div>
  );
}