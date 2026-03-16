import { useState, useEffect, useRef } from "react";
import { Sparkles, Heart, MessageCircle, Loader2, Send, Image, Video, X, Play } from "lucide-react";
import { getInitials, formatDate } from "../lib/utils";
import  type { Post, Comment } from "../types";
import { getPosts, createPost, likePost, getComments, createComment } from "../api/posts";
import AiToneHelper from "../components/AiToneHelper";

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
      background: `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)`,
      border: `2.5px solid ${fg}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, color: fg,
      boxShadow: `0 2px 8px ${fg}20`,
    }}>{getInitials(name)}</div>
  );
}

function MediaPreview({ url, type, onRemove }: { url: string; type: string; onRemove?: () => void }) {
  return (
    <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", background: "#000", maxHeight: 400 }}>
      {type === "video" ? (
        <video src={url} controls style={{ width: "100%", maxHeight: 400, display: "block", borderRadius: "12px" }} />
      ) : (
        <img src={url} alt="post media" style={{ width: "100%", maxHeight: 400, objectFit: "cover", display: "block", borderRadius: "12px" }} />
      )}
      {onRemove && (
        <button onClick={onRemove} style={{
          position: "absolute", top: 8, right: 8,
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(0,0,0,0.6)", border: "none",
          color: "white", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><X size={14} /></button>
      )}
    </div>
  );
}

export default function FeedPage() {
  const [posts, setPosts]               = useState<Post[]>([]);
  const [content, setContent]           = useState("");
  const [mediaFile, setMediaFile]       = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: string } | null>(null);
  const [loading, setLoading]           = useState(true);
  const [posting, setPosting]           = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments]         = useState<Record<string, Comment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [submitting, setSubmitting]     = useState<string | null>(null);
  const [showAi, setShowAi]             = useState(false);
  const [likingPost, setLikingPost]     = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPosts().then(setPosts).finally(() => setLoading(false));
  }, []);

  const handleMediaSelect = (file: File) => {
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type: file.type.startsWith("video/") ? "video" : "image" });
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (imageRef.current) imageRef.current.value = "";
    if (videoRef.current) videoRef.current.value = "";
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaFile) return;
    setPosting(true);
    setUploadProgress(0);
    try {
      const p = await createPost(content.trim(), mediaFile || undefined);
      setPosts([p, ...posts]);
      setContent("");
      removeMedia();
    } finally { setPosting(false); setUploadProgress(0); }
  };

  const handleLike = async (postId: string) => {
    setLikingPost(postId);
    try {
      const r = await likePost(postId);
      setPosts(posts.map(p => p.id === postId ? {
        ...p, likedByMe: r.liked,
        _count: { ...p._count!, likes: r.liked ? p._count!.likes + 1 : p._count!.likes - 1 },
      } : p));
    } finally { setLikingPost(null); }
  };

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
      setPosts(posts.map(p => p.id === postId ? { ...p, _count: { ...p._count!, comments: p._count!.comments + 1 } } : p));
    } finally { setSubmitting(null); }
  };

  const canPost = (content.trim().length > 0 || mediaFile !== null) && !posting;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {showAi && <AiToneHelper draft={content} onApply={t => setContent(t)} onClose={() => setShowAi(false)} />}

      {/* Hidden file inputs */}
      <input ref={imageRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => e.target.files?.[0] && handleMediaSelect(e.target.files[0])} />
      <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }}
        onChange={e => e.target.files?.[0] && handleMediaSelect(e.target.files[0])} />

      {/* Header */}
      <div className="animate-fade-up">
        <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.4px" }}>Home</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>What's happening on campus</p>
      </div>

      {/* Compose card */}
      <div className="animate-fade-up stagger-1" style={{
        background: "white", borderRadius: "18px", padding: "20px",
        border: "1.5px solid var(--border)",
        boxShadow: "0 2px 16px rgba(99,102,241,0.06)",
      }}>
        <textarea
          placeholder="Share a thought with your campus…"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          style={{
            width: "100%", border: "none", outline: "none", resize: "none",
            fontSize: "15px", lineHeight: 1.7, color: "var(--text-primary)",
            background: "transparent", fontFamily: "inherit",
          }}
        />

        {/* Media preview */}
        {mediaPreview && (
          <div style={{ marginBottom: "12px" }}>
            <MediaPreview url={mediaPreview.url} type={mediaPreview.type} onRemove={removeMedia} />
          </div>
        )}

        {/* Upload progress */}
        {posting && mediaFile && (
          <div style={{ height: 3, background: "var(--border)", borderRadius: 99, marginBottom: 12, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: "linear-gradient(90deg, #6366f1, #ec4899)",
              width: "70%", animation: "shimmer 1.5s infinite",
            }} />
          </div>
        )}

        <div style={{ height: "1px", background: "var(--border)", margin: "0 0 12px" }} />

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Media buttons */}
          <button onClick={() => imageRef.current?.click()} title="Add image" style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 12px", borderRadius: "10px",
            border: "1.5px solid var(--border)", background: "var(--surface-2)",
            color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#6366f1"; (e.currentTarget as HTMLButtonElement).style.color = "#6366f1"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
          >
            <Image size={14} /> Photo
          </button>
          <button onClick={() => videoRef.current?.click()} title="Add video" style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 12px", borderRadius: "10px",
            border: "1.5px solid var(--border)", background: "var(--surface-2)",
            color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#ec4899"; (e.currentTarget as HTMLButtonElement).style.color = "#ec4899"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
          >
            <Video size={14} /> Video
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* AI Tone button — appears when typing */}
          {content.trim().length > 0 && (
            <button className="ai-btn animate-fade-in" onClick={() => setShowAi(true)}>
              <Sparkles size={13} /> AI Tone
            </button>
          )}

          {/* Post button */}
          <button onClick={handlePost} disabled={!canPost} style={{
            padding: "8px 22px", borderRadius: "10px",
            background: canPost
              ? "linear-gradient(135deg, #6366f1, #818cf8)"
              : "var(--border)",
            border: "none",
            color: canPost ? "white" : "var(--text-muted)",
            fontSize: "13px", fontWeight: 700,
            cursor: canPost ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", gap: "6px",
            transition: "all 0.2s",
            boxShadow: canPost ? "0 4px 14px rgba(99,102,241,0.3)" : "none",
          }}>
            {posting
              ? <><Loader2 size={13} className="animate-spin" /> Uploading…</>
              : <><Send size={13} /> Post</>
            }
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: "white", borderRadius: "18px", padding: "20px", border: "1.5px solid var(--border)", display: "flex", gap: "12px" }}>
              <div className="shimmer" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="shimmer" style={{ height: 12, width: "35%", borderRadius: 6 }} />
                <div className="shimmer" style={{ height: 12, width: "100%", borderRadius: 6 }} />
                <div className="shimmer" style={{ height: 12, width: "65%", borderRadius: 6 }} />
                <div className="shimmer" style={{ height: 180, width: "100%", borderRadius: 10, marginTop: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          background: "white", borderRadius: "18px", padding: "56px 32px",
          textAlign: "center", border: "1.5px solid var(--border)",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>✨</div>
          <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-secondary)", margin: "0 0 6px" }}>Campus is quiet…</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post, idx) => (
          <div key={post.id}
            className={`animate-fade-up stagger-${Math.min(idx + 1, 4)}`}
            style={{
              background: "white", borderRadius: "18px",
              border: "1.5px solid var(--border)",
              overflow: "hidden",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(99,102,241,0.1)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
            }}
          >
            {/* Post header + text */}
            <div style={{ padding: "18px 20px 0" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <UserAvatar name={post.author.displayName} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
                      {post.author.displayName}
                    </span>
                    <span style={{
                      fontSize: "12px", color: "var(--text-muted)",
                      background: "var(--surface-2)", padding: "1px 8px",
                      borderRadius: "99px", border: "1px solid var(--border)",
                    }}>@{post.author.username}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  {post.content && (
                    <p style={{ fontSize: "14px", lineHeight: 1.75, color: "#374151", margin: "10px 0 0" }}>
                      {post.content}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Media */}
            {post.mediaUrl && (
              <div style={{ margin: "14px 0 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                {post.mediaType === "video" ? (
                  <video
                    src={post.mediaUrl}
                    controls
                    style={{ width: "100%", maxHeight: "460px", display: "block", background: "#000" }}
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt="post"
                    style={{ width: "100%", maxHeight: "520px", objectFit: "cover", display: "block" }}
                  />
                )}
              </div>
            )}

            {/* Actions bar */}
            <div style={{ padding: "12px 20px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="heart-pop"
                  onClick={() => handleLike(post.id)}
                  disabled={likingPost === post.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: post.likedByMe ? "#fdf2f8" : "var(--surface-2)",
                    border: `1.5px solid ${post.likedByMe ? "#f9a8d4" : "var(--border)"}`,
                    borderRadius: "99px", padding: "6px 14px",
                    fontSize: "13px", fontWeight: 600, cursor: "pointer",
                    color: post.likedByMe ? "#db2777" : "var(--text-muted)",
                    transition: "all 0.15s",
                  }}
                >
                  <Heart size={14} fill={post.likedByMe ? "currentColor" : "none"} />
                  {post._count?.likes}
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: expandedPost === post.id ? "var(--brand-50)" : "var(--surface-2)",
                    border: `1.5px solid ${expandedPost === post.id ? "var(--brand-200)" : "var(--border)"}`,
                    borderRadius: "99px", padding: "6px 14px",
                    fontSize: "13px", fontWeight: 600, cursor: "pointer",
                    color: expandedPost === post.id ? "var(--brand-600)" : "var(--text-muted)",
                    transition: "all 0.15s",
                  }}
                >
                  <MessageCircle size={14} />
                  {post._count?.comments}
                </button>
              </div>

              {/* Comments section */}
              {expandedPost === post.id && (
                <div className="animate-fade-up" style={{
                  marginTop: "14px", paddingTop: "14px",
                  borderTop: "1px solid var(--border)",
                }}>
                  {(comments[post.id] || []).length === 0 ? (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "8px 0 12px" }}>
                      No comments yet — start the conversation!
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                      {(comments[post.id] || []).map(c => (
                        <div key={c.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <UserAvatar name={c.author.displayName} size={28} />
                          <div style={{
                            background: "var(--surface-2)", borderRadius: "12px",
                            padding: "8px 12px", flex: 1,
                            border: "1px solid var(--border)",
                          }}>
                            <span style={{ fontWeight: 700, fontSize: "12px", color: "var(--text-primary)" }}>
                              {c.author.displayName}
                            </span>
                            <p style={{ fontSize: "13px", color: "#374151", margin: "3px 0 0", lineHeight: 1.6 }}>
                              {c.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      placeholder="Write a comment…"
                      value={commentInput[post.id] || ""}
                      onChange={e => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && handleComment(post.id)}
                      style={{
                        flex: 1, padding: "9px 14px", borderRadius: "12px",
                        border: "1.5px solid var(--border)", fontSize: "13px",
                        fontFamily: "inherit", outline: "none",
                        background: "var(--surface-2)", color: "var(--text-primary)",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={e => (e.target.style.borderColor = "var(--brand-400)")}
                      onBlur={e => (e.target.style.borderColor = "var(--border)")}
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      disabled={submitting === post.id}
                      style={{
                        padding: "9px 16px", borderRadius: "12px",
                        background: "linear-gradient(135deg, #6366f1, #818cf8)",
                        border: "none", color: "white", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "4px",
                        fontSize: "12px", fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                      }}
                    >
                      {submitting === post.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Send size={13} />
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}