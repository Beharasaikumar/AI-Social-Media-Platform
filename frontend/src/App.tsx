import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import FeedPage from "./pages/FeedPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import ExplorePage from "./pages/ExplorePage";
import PostPage from "./pages/PostPage";
import UserProfilePage from "./pages/UserProfilePage";

export default function App() {
  const { user, loading, login, logout } = useAuth();

  const handleLogin = (token: string, userData: any) => {
    login(token, userData);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #eef2ff, #fdf2f8)",
        gap: "16px",
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
          <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
        )}

        {user && (
          <Route
            path="*"
            element={
              <MainLayout
                onLogout={logout}
                username={user.username}
                displayName={user.displayName}
              >
                <Routes>
                  <Route path="/" element={<FeedPage />} />
                  <Route path="/explore" element={<ExplorePage currentUserId={user.id} />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route
                    path="/profile"
                    element={
                      <ProfilePage
                        user={user}
                        onUserUpdate={() => {}} 
                      />
                    }
                  />
                  <Route path="/post/:id" element={<PostPage />} />
                  <Route path="/user/:username" element={<UserProfilePage />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </MainLayout>
            }
          />
        )}

      </Routes>
    </BrowserRouter>
  );
}