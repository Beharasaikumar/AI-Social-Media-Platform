// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useDarkMode } from "./hooks/useDarkMode";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import FeedPage from "./pages/FeedPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import ExplorePage from "./pages/ExplorePage";
import PostPage from "./pages/PostPage";
import UserProfilePage from "./pages/UserProfilePage";
import DMPage from "./pages/DMPage";
import BookmarksPage from "./pages/BookmarksPage";

export default function App() {
  const { user, loading, login, logout, updateUser } = useAuth();
  const { dark, toggle: toggleDark } = useDarkMode();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #eef2ff, #fdf2f8)", gap: "16px",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "14px",
          background: "linear-gradient(135deg, #6366f1, #ec4899)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
        }}>
          <div style={{
            width: 20, height: 20,
            border: "2.5px solid rgba(255,255,255,0.4)",
            borderTop: "2.5px solid white",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: 500 }}>
          Loading CampusConnect…
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!user && (
          <Route path="*" element={<LoginPage onLogin={login} />} />
        )}

        {user && (
          <Route
            path="*"
            element={
              <MainLayout
                onLogout={logout}
                username={user.username}
                displayName={user.displayName}
                dark={dark}
                onToggleDark={toggleDark}
              >
                <Routes>
                  <Route path="/"              element={<FeedPage currentUserId={user.id} />} />
                  <Route path="/explore"       element={<ExplorePage currentUserId={user.id} />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/bookmarks"     element={<BookmarksPage />} />
                  <Route path="/profile"       element={<ProfilePage user={user} onUserUpdate={updateUser} />} />
                  <Route path="/post/:id"      element={<PostPage />} />
                  <Route path="/user/:username"             element={<UserProfilePage />} />
                  <Route path="/messages"                   element={<DMPage currentUserId={user.id} />} />
                  <Route path="/messages/:conversationId"   element={<DMPage currentUserId={user.id} />} />
                  <Route path="*"              element={<Navigate to="/" />} />
                </Routes>
              </MainLayout>
            }
          />
        )}
      </Routes>
    </BrowserRouter>
  );
}