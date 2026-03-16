import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  username: string;
  displayName: string;
}

export default function MainLayout({ children, onLogout, username, displayName }: MainLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-2)" }}>
      <Sidebar onLogout={onLogout} username={username} displayName={displayName} />
      <main style={{ marginLeft: "var(--sidebar-w)", minHeight: "100vh" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto", padding: "32px 24px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}