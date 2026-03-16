import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Loader2, Send, ArrowLeft, AlertCircle } from "lucide-react";
import { formatDate } from "../lib/utils";
import type { Post, Comment } from "../types";
import { getPostById, likePost, getComments, createComment } from "../api/posts";

function UserAvatar({ name, size = 38 }: { name: string; size?: number }) {
  const palettes = [
    { bg: "#ede9fe", fg: "#7c3aed" }, { bg: "#fce7f3", fg: "#db2777" },
    { bg: "#d1fae5", fg: "#059669" }, { bg: "#fef3c7", fg: "#d97706" },
    { bg: "#dbeafe", fg: "#2563eb" }, { bg: "#f3e8ff", fg: "#9333ea" },
  ];
  const { bg, fg } = palettes[name.charCodeAt(0) % palettes.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${bg}, ${fg}30)`,
      border: `2.5px solid ${fg}25`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: fg,
      boxShadow: `0 2px 8px ${fg}20`,
    }}>{name[0]?.toUpperCase()}</div>
  );
}

export default function PostPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const [post, setPost]             = useState<Post | null>(null);
  const [comments, setComments]     = useState<Comment[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking]         = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getPostById(id), getComments(id)])
      .then(([p, c]) => { setPost(p); setComments(c); })
      .catch(() => setError("Post not found or was deleted."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!post || liking) return;
    setLiking(true);
    try {
      const r = await likePost(post.id);
      setPost({
        ...post,
        likedByMe: r.liked,
        _count: {
          ...post._count!,
          likes: r.liked ? post._count!.likes + 1 : post._count!.likes - 1,
        },
      });
    } finally { setLiking(false); }
  };

  const handleComment = async () => {
    if (!post || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const c = await createComment(post.id, commentText.trim());
      setComments(prev => [...prev, c]);
      setCommentText("");
      setPost({ ...post, _count: { ...post._count!, comments: post._count!.comments + 1 } });
    } finally { setSubmitting(false); }
  };

  // ── Loading ──
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <button onClick={() => navigate(-1)} style={{
        display: "flex", alignItems: "center", gap: "8px",
        border: "none", background: "none", cursor: "pointer",
        fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", padding: 0,
      }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{
        background: "white", borderRadius: "18px",
        border: "1.5px solid var(--border)", padding: "24px",
        display: "flex", gap: "14px",
      }}>
        <div className="shimmer" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="shimmer" style={{ height: 13, width: "30%", borderRadius: 6 }} />
          <div className="shimmer" style={{ height: 13, width: "100%", borderRadius: 6 }} />
          <div className="shimmer" style={{ height: 13, width: "80%", borderRadius: 6 }} />
          <div className="shimmer" style={{ height: 180, width: "100%", borderRadius: 10, marginTop: 8 }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[1,2,3].map(i => (
          <div key={i} style={{
            background: "white", borderRadius: "14px",
            border: "1.5px solid var(--border)", padding: "16px",
            display: "flex", gap: "10px",
          }}>
            <div className="shimmer" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
              <div className="shimmer" style={{ height: 11, width: "25%", borderRadius: 6 }} />
              <div className="shimmer" style={{ height: 11, width: "70%", borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Error ──
  if (error || !post) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <button onClick={() => navigate(-1)} style={{
        display: "flex", alignItems: "center", gap: "8px",
        border: "none", background: "none", cursor: "pointer",
        fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", padding: 0,
      }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{
        background: "white", borderRadius: "18px",
        border: "1.5px solid #fecdd3", padding: "48px 24px",
        textAlign: "center",
      }}>
        <AlertCircle size={32} style={{ color: "#f43f5e", margin: "0 auto 14px", display: "block" }} />
        <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)", margin: "0 0 6px" }}>
          Post not found
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 20px" }}>
          This post may have been deleted.
        </p>
        <button onClick={() => navigate("/")} style={{
          padding: "10px 24px", borderRadius: "12px", border: "none",
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer",
        }}>Go to Feed</button>
      </div>
    </div>
  );

  // ── Post detail ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="animate-fade-up">

      {/* Back button */}
      <button onClick={() => navigate(-1)} style={{
        display: "flex", alignItems: "center", gap: "8px",
        border: "none", background: "none", cursor: "pointer",
        fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)",
        padding: "0", width: "fit-content", transition: "color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#6366f1"}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Post card */}
      <div style={{
        background: "white", borderRadius: "18px",
        border: "1.5px solid var(--border)", overflow: "hidden",
        boxShadow: "0 2px 16px rgba(99,102,241,0.06)",
      }}>
        {/* Author header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <UserAvatar name={post.author.displayName} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-primary)" }}>
                  {post.author.displayName}
                </span>
                <span style={{
                  fontSize: "12px", color: "var(--text-muted)",
                  background: "var(--surface-2)", padding: "2px 9px",
                  borderRadius: "99px", border: "1px solid var(--border)",
                }}>@{post.author.username}</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "3px 0 0" }}>
                {new Date(post.createdAt).toLocaleDateString("en-IN", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })} · {new Date(post.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Post content */}
          {post.content && (
            <p style={{
              fontSize: "16px", lineHeight: 1.8, color: "#1f2937",
              margin: "16px 0 0", wordBreak: "break-word",
              fontWeight: 400,
            }}>{post.content}</p>
          )}
        </div>

        {/* Media */}
        {post.mediaUrl && (
          <div style={{ marginTop: "16px", borderTop: "1px solid var(--border)" }}>
            {post.mediaType === "video" ? (
              <video src={post.mediaUrl} controls style={{
                width: "100%", maxHeight: "520px", display: "block", background: "#000",
              }} />
            ) : (
              <img src={post.mediaUrl} alt="post" style={{
                width: "100%", maxHeight: "600px", objectFit: "contain",
                display: "block", background: "#f8f9ff",
              }} />
            )}
          </div>
        )}

        {/* Action bar */}
        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <button
            onClick={handleLike}
            disabled={liking}
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              background: post.likedByMe ? "#fdf2f8" : "var(--surface-2)",
              border: `1.5px solid ${post.likedByMe ? "#f9a8d4" : "var(--border)"}`,
              borderRadius: "99px", padding: "7px 16px",
              fontSize: "13px", fontWeight: 700, cursor: "pointer",
              color: post.likedByMe ? "#db2777" : "var(--text-muted)",
              transition: "all 0.15s",
            }}
          >
            <Heart size={15} fill={post.likedByMe ? "currentColor" : "none"} />
            {post._count?.likes} {post._count?.likes === 1 ? "Like" : "Likes"}
          </button>
          <div style={{
            display: "flex", alignItems: "center", gap: "7px",
            background: "var(--brand-50)", border: "1.5px solid var(--brand-200)",
            borderRadius: "99px", padding: "7px 16px",
            fontSize: "13px", fontWeight: 700, color: "var(--brand-600)",
          }}>
            <MessageCircle size={15} />
            {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div style={{
        background: "white", borderRadius: "18px",
        border: "1.5px solid var(--border)", overflow: "hidden",
        boxShadow: "0 2px 16px rgba(99,102,241,0.06)",
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <MessageCircle size={16} style={{ color: "#6366f1" }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
            Comments
          </p>
          <span style={{
            marginLeft: "auto", fontSize: "12px", fontWeight: 700,
            padding: "2px 10px", borderRadius: "99px",
            background: "var(--brand-50)", color: "var(--brand-600)",
            border: "1px solid var(--brand-200)",
          }}>{comments.length}</span>
        </div>

        {/* Comment list */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {comments.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <MessageCircle size={28} style={{ color: "#e2e8f0", margin: "0 auto 10px", display: "block" }} />
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                No comments yet — start the conversation!
              </p>
            </div>
          ) : (
            comments.map((c, idx) => (
              <div key={c.id} className={`animate-fade-up stagger-${Math.min(idx+1,4)}`}
                style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <UserAvatar name={c.author.displayName} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    background: "var(--surface-2)", borderRadius: "12px",
                    padding: "10px 14px", border: "1px solid var(--border)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
                        {c.author.displayName}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        @{c.author.username}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#374151", margin: 0, lineHeight: 1.65 }}>
                      {c.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input */}
        <div style={{
          padding: "14px 20px 18px",
          borderTop: "1px solid var(--border)",
          display: "flex", gap: "10px", alignItems: "center",
        }}>
          <input
            placeholder="Write a comment…"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleComment()}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: "12px",
              border: "1.5px solid var(--border)", fontSize: "14px",
              fontFamily: "inherit", outline: "none",
              background: "var(--surface-2)", color: "var(--text-primary)",
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.target.style.borderColor = "#818cf8")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            onClick={handleComment}
            disabled={!commentText.trim() || submitting}
            style={{
              width: 42, height: 42, borderRadius: "12px", border: "none",
              background: commentText.trim()
                ? "linear-gradient(135deg, #6366f1, #818cf8)"
                : "var(--border)",
              color: "white", cursor: commentText.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
              boxShadow: commentText.trim() ? "0 3px 10px rgba(99,102,241,0.3)" : "none",
            }}
          >
            {submitting
              ? <Loader2 size={15} className="animate-spin" />
              : <Send size={15} />
            }
          </button>
        </div>
      </div>
    </div>
  );
}