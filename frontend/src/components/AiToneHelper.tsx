import { useState, useRef, useEffect } from "react";
import { Sparkles, X, RefreshCw, Copy, Check, Wand2 } from "lucide-react";
import client from "../api/client";

interface AiToneHelperProps {
  draft: string;
  onApply: (text: string) => void;
  onClose: () => void;
}

const TONES = [
  { id: "casual",       label: "Casual",       emoji: "😊", desc: "Friendly & relaxed" },
  { id: "formal",       label: "Formal",       emoji: "👔", desc: "Professional tone" },
  { id: "enthusiastic", label: "Hype",         emoji: "🔥", desc: "Excited & energetic" },
  { id: "witty",        label: "Witty",        emoji: "😏", desc: "Clever & humorous" },
  { id: "empathetic",   label: "Empathetic",   emoji: "💙", desc: "Warm & understanding" },
  { id: "concise",      label: "Concise",      emoji: "⚡", desc: "Short & punchy" },
];

export default function AiToneHelper({ draft, onApply, onClose }: AiToneHelperProps) {
  const [selectedTone, setSelectedTone] = useState("casual");
  const [result, setResult]             = useState("");
  const [loading, setLoading]           = useState(false);
  const [copied, setCopied]             = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // auto-generate on mount with default tone
    if (draft.trim()) handleRewrite("casual");
  }, []);

  const handleRewrite = async (tone?: string) => {
    const t = tone || selectedTone;
    if (!draft.trim()) return;
    setLoading(true); setResult("");
    try {
      const res = await client.post("/ai/rewrite-tone", {
        text: draft,
        tone: t,
        customInstruction: customPrompt,
      });
      setResult(res.data.result);
    } catch {
      setResult("Couldn't rewrite right now. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={overlayRef} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(15,17,23,0.45)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
      animation: "fadeIn 0.2s ease",
    }} onClick={e => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="animate-bounce-in" style={{
        background: "white", borderRadius: "20px",
        width: "100%", maxWidth: "520px",
        boxShadow: "0 24px 64px rgba(99,102,241,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Wand2 size={16} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>AI Tone Helper</p>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Rewrite your thought in any style</p>
          </div>
          <button onClick={onClose} style={{
            border: "none", background: "var(--surface-2)", borderRadius: "8px",
            width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-muted)",
          }}><X size={16} /></button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Original */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Your draft</p>
            <div style={{
              background: "var(--surface-2)", borderRadius: "10px", padding: "10px 14px",
              fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6,
              border: "1px solid var(--border)",
            }}>{draft || <span style={{ color: "var(--text-muted)" }}>Nothing typed yet…</span>}</div>
          </div>

          {/* Tone chips */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Choose tone</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {TONES.map(t => (
                <button
                  key={t.id}
                  className={`tone-chip ${selectedTone === t.id ? "active" : ""}`}
                  onClick={() => { setSelectedTone(t.id); handleRewrite(t.id); }}
                  title={t.desc}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom instruction */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Custom instruction <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></p>
            <input
              placeholder='e.g. "add a question at the end" or "use emojis"'
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRewrite()}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: "10px",
                border: "1px solid var(--border)", fontSize: "13px",
                fontFamily: "inherit", outline: "none", color: "var(--text-primary)",
                background: "white",
              }}
            />
          </div>

          {/* Result */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Result</p>
              <button
                onClick={() => handleRewrite()}
                style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--brand-500)", fontWeight: 600, padding: "2px 6px" }}
              >
                <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Regenerate
              </button>
            </div>
            <div style={{
              minHeight: "80px", background: "var(--surface-3)",
              borderRadius: "10px", padding: "12px 14px",
              border: "1.5px solid var(--brand-200)",
              fontSize: "13px", lineHeight: 1.7, color: "var(--text-primary)",
              position: "relative",
            }}>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[1,2,3].map(i => (
                    <div key={i} className="shimmer" style={{ height: 12, borderRadius: 6, width: i === 3 ? "60%" : "100%" }} />
                  ))}
                </div>
              ) : result ? result : (
                <span style={{ color: "var(--text-muted)" }}>Result will appear here…</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleCopy} disabled={!result} style={{
              flex: 1, padding: "10px", borderRadius: "10px",
              border: "1.5px solid var(--border)", background: "white",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              color: "var(--text-secondary)", transition: "all 0.15s",
              opacity: result ? 1 : 0.5,
            }}>
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
            <button onClick={() => { if (result) { onApply(result); onClose(); } }} disabled={!result} style={{
              flex: 2, padding: "10px", borderRadius: "10px",
              background: result ? "linear-gradient(135deg, #6366f1, #ec4899)" : "var(--border)",
              border: "none", color: "white",
              fontSize: "13px", fontWeight: 700, cursor: result ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              transition: "all 0.15s", opacity: result ? 1 : 0.6,
            }}>
              <Sparkles size={14} /> Use this
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}