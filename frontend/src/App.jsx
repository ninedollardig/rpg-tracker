import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { CharacterProvider } from './context/CharacterContext';
import { ViewModeProvider } from './context/ViewModeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OutsourcePage from './pages/OutsourcePage';
import ActivitiesPage from './pages/ActivitiesPage';
import AchievementsPage from './pages/AchievementsPage';
import QuestsPage from './pages/QuestsPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import StudyDashboardPage from './pages/StudyDashboardPage';
import StudyWorkbenchPage from './pages/StudyWorkbenchPage';
import DailyReportsPage from './pages/DailyReportsPage';
import GuidePage from './pages/GuidePage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <CharacterProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/outsource" element={<OutsourcePage />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/activities" element={<ActivitiesPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/quests" element={<QuestsPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/study" element={<StudyDashboardPage />} />
                <Route path="/study/:id" element={<StudyWorkbenchPage />} />
                <Route path="/daily-reports" element={<DailyReportsPage />} />
                <Route path="/guide" element={<GuidePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </CharacterProvider>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(15,15,25,0.9)',
              backdropFilter: 'blur(20px)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontFamily: '"Inter", "Noto Sans SC", sans-serif',
              fontSize: '14px',
            },
          }}
        />
        <ViewModeProvider><AppRoutes /></ViewModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
