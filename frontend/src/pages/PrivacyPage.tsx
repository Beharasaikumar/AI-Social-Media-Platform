// src/pages/PrivacyPage.tsx
import { Shield, Eye, Lock, Database, Bell, UserX, Mail } from "lucide-react";

interface Section {
  icon: any;
  title: string;
  body: string;
}

const sections: Section[] = [
  {
    icon: Database,
    title: "Information we collect",
    body: "When you register, we collect your display name, username, email address, and password (stored as a secure hash — we never store your plain-text password). When you use the app we also store content you create: posts, comments, reactions, and direct messages. Profile photos and cover images you upload are stored securely on Cloudinary.",
  },
  {
    icon: Eye,
    title: "How your information is used",
    body: "Your information is used solely to operate CampusConnect. We use your email address to send one-time login codes and password-reset links. Your posts and profile information are visible to other verified members of your campus. We do not use your data for advertising or sell it to third parties.",
  },
  {
    icon: Shield,
    title: "Data security",
    body: "All data is transmitted over HTTPS. Passwords are hashed using bcrypt before storage and are never recoverable in plain text. Authentication tokens expire after 7 days. Profile and cover images are served from Cloudinary over a secure CDN. We follow industry-standard practices to protect your data from unauthorized access.",
  },
  {
    icon: UserX,
    title: "Your content and visibility",
    body: "Posts you publish are visible to all authenticated users on the platform. Direct messages are private between you and the recipient. You can delete your own posts at any time. Deleted content is removed immediately from the platform and will no longer be accessible to other users.",
  },
  {
    icon: Bell,
    title: "Notifications and communications",
    body: "We send transactional emails only: OTP codes for login and registration, and password-reset links. We do not send marketing emails. In-app notifications (likes, comments, follows, mentions) are delivered only within the platform and are not shared externally.",
  },
  {
    icon: Lock,
    title: "Cookies and local storage",
    body: "CampusConnect stores your authentication token and basic profile information in your browser's local storage to keep you logged in. No third-party tracking cookies are used. Clearing your browser's local storage will log you out of the platform.",
  },
  {
    icon: Mail,
    title: "Contact and questions",
    body: "If you have questions about this privacy policy or your data, please reach out to the CampusConnect administrator through the platform's messaging system. We are committed to addressing privacy concerns promptly and transparently.",
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="animate-fade-up">
        <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.4px" }}>
          Privacy &amp; Security
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          How CampusConnect handles your data
        </p>
      </div>

      {/* ── Banner ────────────────────────────────────────────────────────── */}
      <div className="animate-fade-up stagger-1" style={{
        background: "linear-gradient(135deg, var(--brand-50), rgba(236,72,153,0.06))",
        border: "1.5px solid var(--brand-200)",
        borderRadius: "16px",
        padding: "18px 20px",
        display: "flex", alignItems: "flex-start", gap: "14px",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "12px", flexShrink: 0,
          background: "linear-gradient(135deg, #6366f1, #ec4899)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
        }}>
          <Shield size={18} color="white" />
        </div>
        <div>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
            Your privacy matters
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            CampusConnect is built for your campus community. We collect only what's necessary
            to run the platform, keep it secure, and never share your data with advertisers.
            This policy explains exactly what we collect and why.
          </p>
        </div>
      </div>

      {/* ── Policy sections ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className={`animate-fade-up stagger-${Math.min(idx + 2, 4)}`}
              style={{
                background: "var(--card-bg)",
                borderRadius: "14px",
                border: "1.5px solid var(--border)",
                padding: "18px 20px",
                display: "flex", gap: "14px",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(99,102,241,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              {/* Icon */}
              <div style={{
                width: 38, height: 38, borderRadius: "10px", flexShrink: 0,
                background: "var(--surface-2)",
                border: "1.5px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={17} style={{ color: "var(--brand-500)" }} strokeWidth={2} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: "0 0 6px", fontWeight: 700, fontSize: "14px",
                  color: "var(--text-primary)",
                }}>
                  {section.title}
                </p>
                <p style={{
                  margin: 0, fontSize: "13px", color: "var(--text-secondary)",
                  lineHeight: 1.75,
                }}>
                  {section.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <div className="animate-fade-up" style={{
        padding: "14px 18px",
        borderRadius: "12px",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
          This privacy policy was last updated for CampusConnect v1.0.
          By using the platform you agree to these terms.
          Policies may be updated as the platform evolves.
        </p>
      </div>

    </div>
  );
}