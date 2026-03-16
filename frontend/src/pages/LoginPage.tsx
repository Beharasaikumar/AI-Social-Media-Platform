import { useState } from "react";
import { Zap, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

interface LoginPageProps {
  onLogin: (token: string, user: any) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm]             = useState({ username: "", displayName: "", password: "" });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [showPass, setShowPass]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      onLogin(data.token, data.user);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "linear-gradient(135deg, #eef2ff 0%, #fdf2f8 50%, #f0fdf4 100%)",
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: "none",
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
        padding: "48px", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }} className="left-panel">
        <div style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: `${120 + i * 60}px`, height: `${120 + i * 60}px`,
              borderRadius: "50%", border: "1px solid white",
              top: `${10 + i * 8}%`, left: `${5 + i * 5}%`,
            }} />
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "16px",
              background: "linear-gradient(135deg, #6366f1, #ec4899)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
            }}>
              <Zap size={24} color="white" fill="white" />
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              Campus<span style={{
                background: "linear-gradient(135deg, #6366f1, #ec4899)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Connect</span>
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
              {isRegister ? "Join your campus community" : "Welcome back to campus"}
            </p>
          </div>

          {/* Form card */}
          <div style={{
            background: "white", borderRadius: "20px", padding: "32px",
            boxShadow: "0 8px 40px rgba(99,102,241,0.1), 0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid var(--border)",
          }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Username */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.3px" }}>USERNAME</label>
                <input
                  placeholder="e.g. john_doe"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                  style={{
                    padding: "12px 14px", borderRadius: "12px",
                    border: "1.5px solid var(--border)", fontSize: "14px",
                    fontFamily: "inherit", outline: "none", background: "var(--surface-2)",
                    color: "var(--text-primary)", transition: "border-color 0.15s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--brand-400)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Display name (register only) */}
              {isRegister && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.3px" }}>DISPLAY NAME</label>
                  <input
                    placeholder="e.g. John Doe"
                    value={form.displayName}
                    onChange={e => setForm({ ...form, displayName: e.target.value })}
                    required
                    style={{
                      padding: "12px 14px", borderRadius: "12px",
                      border: "1.5px solid var(--border)", fontSize: "14px",
                      fontFamily: "inherit", outline: "none", background: "var(--surface-2)",
                      color: "var(--text-primary)", transition: "border-color 0.15s",
                    }}
                    onFocus={e => (e.target.style.borderColor = "var(--brand-400)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>
              )}

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.3px" }}>PASSWORD</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    style={{
                      width: "100%", padding: "12px 44px 12px 14px", borderRadius: "12px",
                      border: "1.5px solid var(--border)", fontSize: "14px",
                      fontFamily: "inherit", outline: "none", background: "var(--surface-2)",
                      color: "var(--text-primary)", transition: "border-color 0.15s",
                    }}
                    onFocus={e => (e.target.style.borderColor = "var(--brand-400)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)",
                    display: "flex", alignItems: "center",
                  }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: "10px",
                  background: "#fff1f2", border: "1px solid #fecdd3",
                  fontSize: "13px", color: "#e11d48",
                }}>{error}</div>
              )}

              <button type="submit" disabled={loading} style={{
                padding: "13px", borderRadius: "12px", border: "none",
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "white", fontSize: "14px", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)", transition: "opacity 0.15s",
                opacity: loading ? 0.8 : 1,
              }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", margin: "20px 0 0" }}>
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => { setIsRegister(!isRegister); setError(""); }} style={{
                border: "none", background: "none", cursor: "pointer",
                color: "var(--brand-600)", fontWeight: 700, fontSize: "13px", fontFamily: "inherit",
              }}>
                {isRegister ? "Sign in" : "Register"}
              </button>
            </p>
          </div>

          <p style={{ textAlign: "center", fontSize: "11px", color: "var(--text-muted)", marginTop: "24px" }}>
            CampusConnect · Your college social space
          </p>
        </div>
      </div>
    </div>
  );
}