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
import AdminDashboard from "./pages/AdminDashboard";
import PlacementsPage from "./pages/PlacementsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import MaterialsPage from "./pages/MaterialsPage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPage from "./pages/PrivacyPage";

export default function App() {
  const { user, login, logout, updateUser } = useAuth();
  const { dark, toggle: toggleDark } = useDarkMode();

  if (!user) {
    return <LoginPage key="login" onLogin={login} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="*"
          element={
            <MainLayout
              onLogout={logout}
              username={user.username}
              displayName={user.displayName}
              avatarUrl={user.avatarUrl}
              dark={dark}
              onToggleDark={toggleDark}
              isAdmin={user.isAdmin}
            >
              <Routes>
                <Route path="/"              element={<FeedPage currentUserId={user.id} />} />
                <Route path="/explore"       element={<ExplorePage currentUserId={user.id} />} />
                <Route path="/placements"    element={<PlacementsPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/materials"     element={<MaterialsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/bookmarks"     element={<BookmarksPage />} />
                <Route path="/profile"       element={<ProfilePage user={user} onUserUpdate={updateUser} />} />
                <Route path="/post/:id"      element={<PostPage />} />
                <Route path="/user/:username" element={<UserProfilePage />} />
                <Route path="/messages"      element={<DMPage currentUserId={user.id} />} />
                <Route path="/messages/:conversationId" element={<DMPage currentUserId={user.id} />} />
                <Route
                  path="/settings"
                  element={
                    <SettingsPage
                      user={user}
                      dark={dark}
                      onToggleDark={toggleDark}
                      onUserUpdate={updateUser}
                    />
                  }
                />
                <Route path="/privacy" element={<PrivacyPage />} />
                {user.isAdmin && (
                  <Route path="/admin" element={<AdminDashboard />} />
                )}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}