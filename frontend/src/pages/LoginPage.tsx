import { useState, useEffect, useRef, useCallback } from "react";
import { Zap, Eye, EyeOff, ArrowRight, Loader2, Mail, Lock, User, Check, AlertCircle, RefreshCw, KeyRound, ShieldCheck } from "lucide-react";

const ADMIN_EMAIL = "admin@gmail.com";

interface LoginPageProps {
  onLogin: (token: string, user: any) => void;
}

type AuthMode = "login" | "register" | "otp" | "forgot" | "reset";

// ── FormInput ─────────────────────────────────────────────────────────────────
const FormInput = ({
  label, placeholder, type = "text", value, onChange, icon: Icon,
  fieldName, isFocused, onFocus, onBlur, showPassword, onTogglePassword,
}: any) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase" }}>
      {label}
    </label>
    <div style={{ position: "relative" }}>
      {Icon && (
        <Icon size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
      )}
      <input
        type={type === "password" ? (showPassword ? "text" : "password") : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        required
        style={{
          width: "100%",
          padding: type === "password" ? "12px 44px 12px 40px" : Icon ? "12px 44px 12px 40px" : "12px 14px",
          borderRadius: "10px",
          border: `1.5px solid ${isFocused ? "#6366f1" : "#e2e8f0"}`,
          fontSize: "14px",
          fontFamily: "inherit",
          outline: "none",
          background: isFocused ? "#fff" : "#f8fafc",
          color: "#1e293b",
          transition: "all 0.2s",
          boxSizing: "border-box",
          boxShadow: isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
        }}
      />
      {type === "password" && (
        <button
          type="button"
          onClick={onTogglePassword}
          style={{
            position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
            border: "none", background: "none", cursor: "pointer", color: "#94a3b8",
            display: "flex", alignItems: "center", padding: "4px",
          }}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

// ── OTP digit input ───────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = (value + "    ").slice(0, 4).split("");

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i].trim()) {
        const next = digits.map((d, j) => (j === i ? " " : d)).join("").trimEnd();
        onChange(next);
      } else if (i > 0) {
        inputsRef.current[i - 1]?.focus();
        const next = digits.map((d, j) => (j === i - 1 ? " " : d)).join("").trimEnd();
        onChange(next);
      }
    }
  }

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    if (!char) return;
    const next = digits.map((d, j) => (j === i ? char : d)).join("").trimEnd();
    onChange(next);
    if (i < 3) inputsRef.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      onChange(pasted);
      inputsRef.current[3]?.focus();
    }
    e.preventDefault();
  }

  return (
    <div style={{ display: "flex", gap: "12px", justifyContent: "center", margin: "8px 0" }}>
      {[0, 1, 2, 3].map(i => (
        <input
          key={i}
          ref={el => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: "56px",
            height: "64px",
            textAlign: "center",
            fontSize: "28px",
            fontWeight: 800,
            borderRadius: "12px",
            border: `2px solid ${digits[i].trim() ? "#6366f1" : "#334155"}`,
            outline: "none",
            background: digits[i].trim() ? "#1e1b4b" : "#0f172a",
            color: "#e0e7ff",
            fontFamily: "inherit",
            transition: "all 0.15s",
            boxShadow: digits[i].trim() ? "0 0 0 3px rgba(99,102,241,0.25)" : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Math CAPTCHA ──────────────────────────────────────────────────────────────
function generateCaptcha() {
  const ops = ["+", "-", "×"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;
  if (op === "+") {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    answer = a + b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 20) + 10;
    b = Math.floor(Math.random() * 10) + 1;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 9) + 2;
    b = Math.floor(Math.random() * 9) + 2;
    answer = a * b;
  }
  return { question: `${a} ${op} ${b}`, answer };
}

function CaptchaBox({
  captcha, value, onChange, onRefresh, isFocused, onFocus, onBlur,
}: {
  captcha: { question: string; answer: number };
  value: string;
  onChange: (v: string) => void;
  onRefresh: () => void;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
        <ShieldCheck size={13} />
        Human Verification
      </label>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {/* Question chip */}
        <div style={{
          padding: "10px 16px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #1e1b4b, #312e81)",
          border: "1.5px solid #4338ca",
          fontSize: "18px",
          fontWeight: 800,
          color: "#a5b4fc",
          letterSpacing: "1px",
          whiteSpace: "nowrap",
          userSelect: "none",
          fontFamily: "monospace",
          minWidth: "100px",
          textAlign: "center",
        }}>
          {captcha.question} = ?
        </div>

        {/* Answer input */}
        <input
          type="number"
          placeholder="Answer"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: "10px",
            border: `1.5px solid ${isFocused ? "#6366f1" : "#e2e8f0"}`,
            fontSize: "14px",
            fontFamily: "inherit",
            outline: "none",
            background: isFocused ? "#fff" : "#f8fafc",
            color: "#1e293b",
            transition: "all 0.2s",
            boxSizing: "border-box",
            boxShadow: isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
            MozAppearance: "textfield",
          }}
        />

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          title="Get a new question"
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: "1.5px solid #e2e8f0",
            background: "#f8fafc",
            cursor: "pointer",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({
    email: "", username: "", displayName: "", password: "",
    newPassword: "", confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [pendingUserId, setPendingUserId] = useState("");
  const [otpPurpose, setOtpPurpose] = useState<"register" | "login">("login");
  const [maskedEmail, setMaskedEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const togglePass = (field: string) => setShowPass(prev => ({ ...prev, [field]: !prev[field] }));

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const focus = (f: string) => ({
    onFocus: () => setFocusedField(f),
    onBlur: () => setFocusedField(null),
    isFocused: focusedField === f,
  });

  // ── CAPTCHA state ────────────────────────────────────────────────────────
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaAnswer("");
  }, []);

  // Reset captcha whenever the visible form mode changes (login ↔ register)
  useEffect(() => {
    if (mode === "login" || mode === "register") {
      refreshCaptcha();
    }
  }, [mode, refreshCaptcha]);

  // Pick up reset token from URL query param (?resetToken=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("resetToken");
    if (token) {
      sessionStorage.setItem("cc_reset_token", token);
      setMode("reset");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function maskEmail(email: string) {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    return local.slice(0, 2) + "***@" + domain;
  }

  function goToOtp(userId: string, email: string, purpose: "register" | "login") {
    setPendingUserId(userId);
    setMaskedEmail(maskEmail(email));
    setOtpPurpose(purpose);
    setOtp("");
    setError("");
    setSuccess("");
    setMode("otp");
    setResendCooldown(30);
  }

  // ── CAPTCHA validation helper ─────────────────────────────────────────────
  function validateCaptcha(): boolean {
    if (parseInt(captchaAnswer, 10) !== captcha.answer) {
      setError("Incorrect CAPTCHA answer. Please try again.");
      refreshCaptcha();
      return false;
    }
    return true;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "login") {
        // Validate CAPTCHA first for all users
        if (!validateCaptcha()) return;

        const isAdmin = form.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email.trim(), password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        if (isAdmin) {
          // Admin: skip OTP, backend returns token directly
          // The backend login route must detect admin and return { token, user }
          // instead of { pendingUserId } — see admin.ts notes.
          if (!data.token) {
            // Fallback: if backend still returns pendingUserId for admin, skip OTP client-side
            // by calling verify-otp with a bypass flag (requires backend support)
            throw new Error("Admin login configuration error: token not returned");
          }
          onLogin(data.token, data.user);
        } else {
          // Regular user: proceed to OTP step
          goToOtp(data.pendingUserId, form.email.trim(), "login");
        }

      } else if (mode === "register") {
        // Validate CAPTCHA first
        if (!validateCaptcha()) return;

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            username: form.username.trim(),
            displayName: form.displayName.trim(),
            password: form.password,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");
        goToOtp(data.pendingUserId, form.email.trim(), "register");

      } else if (mode === "otp") {
        if (otp.length !== 4) throw new Error("Enter the full 4-digit code");
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pendingUserId, otp, purpose: otpPurpose }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Invalid OTP");
        onLogin(data.token, data.user);

      } else if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to send reset email");
        setSuccess(data.message);

      } else if (mode === "reset") {
        if (form.newPassword !== form.confirmPassword) throw new Error("Passwords do not match");
        if (form.newPassword.length < 6) throw new Error("Password must be at least 6 characters");
        const token = sessionStorage.getItem("cc_reset_token") || "";
        if (!token) throw new Error("Reset token missing — please use the link from your email");

        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password: form.newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to reset password");
        sessionStorage.removeItem("cc_reset_token");
        setSuccess(data.message);
        setTimeout(() => {
          setMode("login");
          setForm(f => ({ ...f, newPassword: "", confirmPassword: "" }));
          setSuccess("");
        }, 2500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingUserId, purpose: otpPurpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess("A new OTP has been sent to your email");
      setOtp("");
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const titles: Record<AuthMode, React.ReactNode> = {
    login: <>Campus<span style={{ background: "linear-gradient(135deg,#6366f1,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Connect</span></>,
    register: <>Campus<span style={{ background: "linear-gradient(135deg,#6366f1,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Connect</span></>,
    otp: "Check your inbox",
    forgot: "Forgot password?",
    reset: "New password",
  };

  const subtitles: Record<AuthMode, string> = {
    login: "Sign in with your email",
    register: "Create your campus account",
    otp: `We sent a 4-digit code to ${maskedEmail}`,
    forgot: "Enter your email to get a reset link",
    reset: "Enter and confirm your new password",
  };

  const submitLabel: Record<AuthMode, string> = {
    login: "Continue",
    register: "Create account",
    otp: "Verify & sign in",
    forgot: "Send reset link",
    reset: "Reset password",
  };

  const otpComplete = otp.replace(/\s/g, "").length === 4;
  const captchaValid = captchaAnswer !== "" && parseInt(captchaAnswer, 10) === captcha.answer;
  const showCaptcha = mode === "login" || mode === "register";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Logo & Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: 60, height: 60, borderRadius: "16px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 20px 40px rgba(99,102,241,0.3)",
          }}>
            {mode === "otp"
              ? <KeyRound size={30} color="white" />
              : <Zap size={32} color="white" fill="white" />
            }
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: 800, margin: "0 0 6px", color: "#fff", letterSpacing: "-0.5px" }}>
            {titles[mode]}
          </h1>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>{subtitles[mode]}</p>
        </div>

        {/* Card */}
        <div style={{
          background: "linear-gradient(to bottom, #1e293b, #0f172a)",
          borderRadius: "16px",
          padding: "32px",
          border: "1px solid rgba(148,163,184,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* Login */}
            {mode === "login" && (
              <>
                <FormInput label="Email" placeholder="you@university.edu" type="email"
                  value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })}
                  icon={Mail} fieldName="login-email" {...focus("login-email")} />
                <FormInput label="Password" placeholder="••••••••" type="password"
                  value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })}
                  icon={Lock} fieldName="login-password" {...focus("login-password")}
                  showPassword={!!showPass["login-password"]} onTogglePassword={() => togglePass("login-password")} />
                <button type="button" onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                  style={{ border: "none", background: "none", color: "#818cf8", fontSize: "13px", fontWeight: 600, cursor: "pointer", textAlign: "right", fontFamily: "inherit", marginTop: "-10px" }}>
                  Forgot password?
                </button>
              </>
            )}

            {/* Register */}
            {mode === "register" && (
              <>
                <FormInput label="Email" placeholder="you@university.edu" type="email"
                  value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })}
                  icon={Mail} fieldName="reg-email" {...focus("reg-email")} />
                <FormInput label="Username" placeholder="e.g. john_doe"
                  value={form.username} onChange={(e: any) => setForm({ ...form, username: e.target.value })}
                  icon={User} fieldName="reg-username" {...focus("reg-username")} />
                <FormInput label="Display Name" placeholder="e.g. John Doe"
                  value={form.displayName} onChange={(e: any) => setForm({ ...form, displayName: e.target.value })}
                  fieldName="reg-display" {...focus("reg-display")} />
                <FormInput label="Password" placeholder="••••••••" type="password"
                  value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })}
                  icon={Lock} fieldName="reg-password" {...focus("reg-password")}
                  showPassword={!!showPass["reg-password"]} onTogglePassword={() => togglePass("reg-password")} />
              </>
            )}

            {/* CAPTCHA — shown on login and register */}
            {showCaptcha && (
              <CaptchaBox
                captcha={captcha}
                value={captchaAnswer}
                onChange={setCaptchaAnswer}
                onRefresh={refreshCaptcha}
                isFocused={focusedField === "captcha"}
                onFocus={() => setFocusedField("captcha")}
                onBlur={() => setFocusedField(null)}
              />
            )}

            {/* OTP */}
            {mode === "otp" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
                <p style={{ color: "#cbd5e1", fontSize: "14px", margin: 0, textAlign: "center", lineHeight: 1.6 }}>
                  Enter the 4-digit code. It expires in{" "}
                  <strong style={{ color: "#a5b4fc" }}>10 minutes</strong>.
                </p>
                <OtpInput value={otp} onChange={setOtp} />
                <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                  style={{
                    border: "none", background: "none",
                    cursor: resendCooldown > 0 ? "default" : "pointer",
                    color: resendCooldown > 0 ? "#475569" : "#818cf8",
                    fontWeight: 600, fontSize: "13px", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: "6px",
                  }}>
                  <RefreshCw size={13} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            )}

            {/* Forgot */}
            {mode === "forgot" && (
              <>
                <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "0 0 4px", lineHeight: 1.6 }}>
                  We'll send a secure reset link to your email address.
                </p>
                <FormInput label="Email" placeholder="you@university.edu" type="email"
                  value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })}
                  icon={Mail} fieldName="forgot-email" {...focus("forgot-email")} />
              </>
            )}

            {/* Reset */}
            {mode === "reset" && (
              <>
                <FormInput label="New Password" placeholder="••••••••" type="password"
                  value={form.newPassword} onChange={(e: any) => setForm({ ...form, newPassword: e.target.value })}
                  icon={Lock} fieldName="reset-new" {...focus("reset-new")}
                  showPassword={!!showPass["reset-new"]} onTogglePassword={() => togglePass("reset-new")} />
                <FormInput label="Confirm Password" placeholder="••••••••" type="password"
                  value={form.confirmPassword} onChange={(e: any) => setForm({ ...form, confirmPassword: e.target.value })}
                  icon={Lock} fieldName="reset-confirm" {...focus("reset-confirm")}
                  showPassword={!!showPass["reset-confirm"]} onTogglePassword={() => togglePass("reset-confirm")} />
              </>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: "13px", color: "#fca5a5", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={16} />{error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", fontSize: "13px", color: "#86efac", display: "flex", alignItems: "center", gap: "8px" }}>
                <Check size={16} />{success}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={
                loading ||
                (mode === "otp" && !otpComplete) ||
                (showCaptcha && !captchaValid)
              }
              style={{
                padding: "13px", borderRadius: "10px", border: "none",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white", fontSize: "14px", fontWeight: 700,
                cursor: (loading || (mode === "otp" && !otpComplete) || (showCaptcha && !captchaValid)) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: "0 10px 30px rgba(99,102,241,0.3)",
                transition: "all 0.2s",
                opacity: (loading || (mode === "otp" && !otpComplete) || (showCaptcha && !captchaValid)) ? 0.6 : 1,
                marginTop: "8px",
              }}>
              {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              {loading ? "Please wait…" : submitLabel[mode]}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Footer nav */}
          <div style={{ textAlign: "center", fontSize: "13px", color: "#94a3b8", marginTop: "24px" }}>
            {mode === "otp" && (
              <button
                type="button"
                onClick={() => { setMode(otpPurpose === "register" ? "register" : "login"); setError(""); setSuccess(""); }}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#818cf8", fontWeight: 700, fontSize: "13px", fontFamily: "inherit" }}>
                ← Back to {otpPurpose === "register" ? "registration" : "sign in"}
              </button>
            )}
            {mode === "forgot" && (
              <>
                Remember it?{" "}
                <button type="button" onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#818cf8", fontWeight: 700, fontSize: "13px", fontFamily: "inherit" }}>
                  Sign in
                </button>
              </>
            )}
            {(mode === "login" || mode === "register") && (
              <>
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button type="button"
                  onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); }}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#818cf8", fontWeight: 700, fontSize: "13px", fontFamily: "inherit" }}>
                  {mode === "login" ? "Register" : "Sign in"}
                </button>
              </>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "#64748b", marginTop: "24px" }}>
          CampusConnect · Your college social space
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}