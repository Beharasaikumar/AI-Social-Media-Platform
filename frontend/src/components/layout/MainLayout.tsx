import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  username: string;
  displayName: string;
  avatarUrl?: string;
  dark: boolean;
  onToggleDark: () => void;
  isAdmin?: boolean;
}

export default function MainLayout({
  children, onLogout, username, displayName, avatarUrl, dark, onToggleDark, isAdmin
}: MainLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", transition: "background 0.3s" }}>
      <Sidebar
        onLogout={onLogout}
        username={username}
        displayName={displayName}
        avatarUrl={avatarUrl}
        dark={dark}
        onToggleDark={onToggleDark}
        isAdmin={isAdmin}
      />
      <main style={{ marginLeft: "var(--sidebar-w)", minHeight: "100vh" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto", padding: "32px 24px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}