import { useState, useEffect, useRef, useMemo } from "react";
import { Search, TrendingUp, Users, FileText, Sparkles, X, Heart, MessageCircle, Flame } from "lucide-react";
import { formatDate } from "../lib/utils";
import type { Post } from "../types";
import client from "../api/client";
import { useNavigate } from "react-router-dom";

type Tab = "posts" | "people";

function UserAvatar({ name, size = 36 }: { name: string; size?: number }) {
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
      border: `2px solid ${fg}25`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, color: fg,
    }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} style={{
            background: "#e0e7ff", color: "#4338ca",
            borderRadius: "3px", padding: "0 2px",
          }}>{part}</mark>
        ) : part
      )}
    </>
  );
}

export default function ExplorePage({ currentUserId }: { currentUserId: string }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    client.get("/posts").then(res => {
      setAllPosts(res.data);
      setPosts(res.data);
    }).finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setPosts(allPosts);
      setAiSummary("");
      return;
    }
    debounceRef.current = setTimeout(() => handleSearch(query.trim()), 400);
  }, [query, allPosts]);

  const handleSearch = (q: string) => {
    setLoading(true);
    const lower = q.toLowerCase();
    const filtered = allPosts.filter(p =>
      p.content.toLowerCase().includes(lower) ||
      p.author.displayName.toLowerCase().includes(lower) ||
      p.author.username.toLowerCase().includes(lower)
    );
    setPosts(filtered);
    setLoading(false);
    if (filtered.length > 0) fetchAiSummary(q, filtered);
  };

  const fetchAiSummary = async (q: string, results: Post[]) => {
    setAiLoading(true);
    setAiSummary("");
    try {
      const res = await client.post("/ai/search-summary", {
        query: q,
        posts: results.slice(0, 5).map(p => ({ content: p.content, author: p.author.displayName })),
      });
      setAiSummary(res.data.summary);
    } catch { setAiSummary(""); }
    finally { setAiLoading(false); }
  };

  // ── Real trending: score words by frequency + likes weight ──
  const trendingTopics = useMemo(() => {
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
      "is", "it", "i", "my", "you", "your", "we", "our", "are", "was", "be", "been",
      "have", "has", "had", "do", "did", "will", "can", "get", "got", "that", "this",
      "from", "just", "so", "not", "what", "whats", "how", "hey", "hlo", "hello", "hi", "im",
      "its", "are", "also", "very", "more", "some", "they", "them", "their", "about",
      "want", "need", "going", "like", "know", "think", "time", "good", "great",
    ]);
    const wordScore: Record<string, number> = {};
    allPosts.forEach(post => {
      const words = post.content
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));
      const weight = 1 + (post._count?.likes || 0) * 2 + (post._count?.comments || 0);
      words.forEach(w => { wordScore[w] = (wordScore[w] || 0) + weight; });
    });
    return Object.entries(wordScore)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, score]) => ({
        tag: tag.charAt(0).toUpperCase() + tag.slice(1),
        count: Math.round(score),
      }));
  }, [allPosts]);

  const people = useMemo(() =>
    allPosts
      .reduce((acc: any[], p) => {
        if (!acc.find(u => u.id === p.author.id)) acc.push(p.author);
        return acc;
      }, [])
      .filter(u => u.id !== currentUserId)
      .filter(u =>
        !query ||
        u.displayName.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase())
      ),
    [allPosts, query, currentUserId]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div className="animate-fade-up">
        <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.4px" }}>
          Explore
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          Discover posts and people on campus
        </p>
      </div>

      {/* Search bar */}
      <div className="animate-fade-up stagger-1" style={{ position: "relative" }}>
        <Search size={16} style={{
          position: "absolute", left: 14, top: "50%",
          transform: "translateY(-50%)", color: "var(--text-muted)",
        }} />
        <input
          placeholder="Search posts, people, topics..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: "100%", padding: "12px 40px", borderRadius: "14px",
            border: "1.5px solid var(--border)", fontSize: "14px",
            fontFamily: "inherit", outline: "none",
            background: "white", color: "var(--text-primary)",
            boxShadow: "0 2px 12px rgba(99,102,241,0.06)",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={e => {
            e.target.style.borderColor = "#818cf8";
            e.target.style.boxShadow = "0 2px 16px rgba(99,102,241,0.14)";
          }}
          onBlur={e => {
            e.target.style.borderColor = "var(--border)";
            e.target.style.boxShadow = "0 2px 12px rgba(99,102,241,0.06)";
          }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            border: "none", background: "var(--surface-2)", borderRadius: "6px",
            width: 24, height: 24, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-muted)",
          }}><X size={13} /></button>
        )}
      </div>

      {/* AI Summary */}
      {(aiLoading || aiSummary) && (
        <div className="animate-fade-in" style={{
          background: "linear-gradient(135deg, #eef2ff, #fdf2f8)",
          border: "1.5px solid #c7d2fe", borderRadius: "14px", padding: "14px 16px",
          display: "flex", gap: "12px", alignItems: "flex-start",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "10px", flexShrink: 0,
            background: "linear-gradient(135deg, #6366f1, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={14} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: "0.4px" }}>
              AI Summary
            </p>
            {aiLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[1, 2].map(i => (
                  <div key={i} className="shimmer" style={{ height: 11, borderRadius: 6, width: i === 2 ? "70%" : "100%", background: "#c7d2fe" }} />
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "13px", color: "#3730a3", lineHeight: 1.7 }}>{aiSummary}</p>
            )}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", alignItems: "start" }}>

        {/* ── Left: results ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Tabs */}
          <div style={{
            display: "flex", gap: "4px",
            background: "var(--surface-3)", borderRadius: "12px",
            padding: "4px", width: "fit-content",
            border: "1px solid var(--border)",
          }}>
            {(["posts", "people"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "7px 16px", borderRadius: "9px",
                border: "none", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
                background: tab === t ? "white" : "transparent",
                color: tab === t ? "var(--brand-600)" : "var(--text-muted)",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                {t === "posts" ? <FileText size={13} /> : <Users size={13} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Result count */}
          {query && !loading && tab === "posts" && (
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0" }}>
              {posts.length} result{posts.length !== 1 ? "s" : ""} for <strong style={{ color: "var(--text-secondary)" }}>"{query}"</strong>
            </p>
          )}

          {/* Posts tab */}
          {tab === "posts" && (
            initialLoading || loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    background: "white", borderRadius: "16px", padding: "18px",
                    border: "1.5px solid var(--border)", display: "flex", gap: "12px",
                  }}>
                    <div className="shimmer" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div className="shimmer" style={{ height: 12, width: "35%", borderRadius: 6 }} />
                      <div className="shimmer" style={{ height: 12, width: "100%", borderRadius: 6 }} />
                      <div className="shimmer" style={{ height: 12, width: "65%", borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div style={{
                background: "white", borderRadius: "16px", padding: "48px 24px",
                textAlign: "center", border: "1.5px solid var(--border)",
              }}>
                <Search size={28} style={{ color: "#e2e8f0", margin: "0 auto 12px", display: "block" }} />
                <p style={{ fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 4px" }}>
                  No posts found
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                  Try a different search term
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {posts.map(post => (
                  <div key={post.id} style={{
                    background: "white", borderRadius: "16px",
                    border: "1.5px solid var(--border)", overflow: "hidden",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(99,102,241,0.1)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                    }}
                  >
                    {/* Post header */}
                    <div style={{ padding: "16px 16px 0" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <UserAvatar name={post.author.displayName} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
                              {post.author.displayName}
                            </span>
                            <span style={{
                              fontSize: "11px", color: "var(--text-muted)",
                              background: "var(--surface-2)", padding: "1px 7px",
                              borderRadius: "99px", border: "1px solid var(--border)",
                            }}>@{post.author.username}</span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                          {post.content && (
                            <p style={{
                              fontSize: "13px", lineHeight: 1.75,
                              color: "#374151", margin: "8px 0 0",
                              wordBreak: "break-word",
                            }}>
                              {query ? highlightText(post.content, query) : post.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Media */}
                    {post.mediaUrl && (
                      <div style={{ marginTop: "12px", borderTop: "1px solid var(--border)" }}>
                        {post.mediaType === "video" ? (
                          <video src={post.mediaUrl} controls style={{
                            width: "100%", maxHeight: "320px", display: "block", background: "#000",
                          }} />
                        ) : (
                          <img src={post.mediaUrl} alt="post media" style={{
                            width: "100%", maxHeight: "360px", objectFit: "cover", display: "block",
                          }} />
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div style={{ padding: "10px 16px 14px", display: "flex", gap: "14px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                        <Heart size={13} style={{ color: "#db2777" }} /> {post._count?.likes ?? 0}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                        <MessageCircle size={13} style={{ color: "#6366f1" }} /> {post._count?.comments ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* People tab */}
          {tab === "people" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {people.length === 0 ? (
                <div style={{
                  background: "white", borderRadius: "16px", padding: "48px 24px",
                  textAlign: "center", border: "1.5px solid var(--border)",
                }}>
                  <Users size={28} style={{ color: "#e2e8f0", margin: "0 auto 12px", display: "block" }} />
                  <p style={{ fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 4px" }}>No people found</p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Try searching by name or username</p>
                </div>
              ) : (
                people.map(u => (
                  <div key={u.id}
                    onClick={() => navigate(`/user/${u.username}`)}
                    style={{
                      background: "white", borderRadius: "14px", padding: "14px 16px",
                      border: "1.5px solid var(--border)",
                      display: "flex", alignItems: "center", gap: "12px",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(99,102,241,0.09)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    }}
                  >
                    <UserAvatar name={u.displayName} size={44} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", margin: "0 0 2px" }}>
                        {u.displayName}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>@{u.username}</p>
                    </div>
                    <div style={{
                      padding: "4px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: 600,
                      background: "var(--brand-50)", color: "var(--brand-600)",
                      border: "1px solid var(--brand-200)",
                    }}>
                      {allPosts.filter(p => p.author.id === u.id).length} posts
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "32px" }}>

          {/* Trending topics */}
          <div style={{
            background: "white", borderRadius: "16px",
            border: "1.5px solid var(--border)", overflow: "hidden",
            boxShadow: "0 2px 12px rgba(99,102,241,0.05)",
          }}>
            <div style={{
              padding: "14px 16px 12px",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "8px",
                background: "linear-gradient(135deg, #fef3c7, #fbbf2430)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Flame size={14} style={{ color: "#d97706" }} />
              </div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                Trending topics
              </p>
            </div>
            <div style={{ padding: "8px" }}>
              {trendingTopics.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", padding: "8px", textAlign: "center" }}>
                  Post more to see trends!
                </p>
              ) : (
                trendingTopics.map((t, idx) => (
                  <button key={t.tag} onClick={() => setQuery(t.tag)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "10px",
                    padding: "9px 10px", borderRadius: "10px",
                    border: "none", background: "transparent",
                    cursor: "pointer", transition: "background 0.15s",
                    textAlign: "left",
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
                  >
                    <span style={{
                      width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
                      background: idx === 0 ? "#fef3c7" : idx === 1 ? "#fee2e2" : "var(--surface-2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: 800,
                      color: idx === 0 ? "#d97706" : idx === 1 ? "#dc2626" : "var(--text-muted)",
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                      #{t.tag}
                    </span>
                    <span style={{
                      fontSize: "11px", fontWeight: 700, padding: "2px 8px",
                      borderRadius: "99px", background: "var(--brand-50)",
                      color: "var(--brand-600)", border: "1px solid var(--brand-200)",
                    }}>{t.count}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* People on campus */}
          <div style={{
            background: "white", borderRadius: "16px",
            border: "1.5px solid var(--border)", overflow: "hidden",
            boxShadow: "0 2px 12px rgba(99,102,241,0.05)",
          }}>
            <div style={{
              padding: "14px 16px 12px",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "8px",
                background: "linear-gradient(135deg, #dbeafe, #2563eb20)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Users size={14} style={{ color: "#2563eb" }} />
              </div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                People on campus
              </p>
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {allPosts
                .reduce((acc: any[], p) => {
                  if (!acc.find(u => u.id === p.author.id)) acc.push(p.author);
                  return acc;
                }, [])
                .filter((u: any) => u.id !== currentUserId)
                .slice(0, 5)
                .map(u => (
                  <div key={u.id}
                    onClick={() => navigate(`/user/${u.username}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "8px", borderRadius: "10px", transition: "background 0.15s", cursor: "default",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--surface-2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                  >
                    <UserAvatar name={u.displayName} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: "12px", color: "var(--text-primary)", margin: "0 0 1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {u.displayName}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                        @{u.username}
                      </p>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>
                      {allPosts.filter(p => p.author.id === u.id).length} posts
                    </span>
                  </div>
                ))}
              {allPosts.reduce((acc: any[], p) => {
                if (!acc.find(u => u.id === p.author.id)) acc.push(p.author);
                return acc;
              }, []).length === 0 && (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>
                    No users yet
                  </p>
                )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}