import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/use-auth';
import { ProtectedRoute } from './components/auth/protected-route';
import { AdminRoleGuard } from './components/auth/admin-role-guard';
import { MainLayout } from './components/main-layout';
import { HomePage } from './pages/home-page';
import { LoginPage } from './pages/auth/login';
import { RegisterPage } from './pages/auth/register';
import { ForgotPasswordPage } from './pages/auth/forgot-password';
import { ResetPasswordPage } from './pages/auth/reset-password';
import { VerifyEmailPage } from './pages/auth/verify-email';
import { AdminLayout } from './components/admin/admin-layout';
import { AuthLayout } from './components/auth/auth-layout';
import { Dashboard } from './pages/admin/dashboard';
import { Careers } from './pages/admin/careers';
import { Topics } from './pages/admin/topics';
import { Questions } from './pages/admin/questions';
import { Scenarios } from './pages/admin/scenarios';
import { Knowledge } from './pages/admin/knowledge';
import { Users } from './pages/admin/users';
import { Settings } from './pages/admin/settings';
import { CvUploadPage } from './pages/cv/upload';
import { CvAnalysisPage } from './pages/cv/analysis';
import { MyCvsPage } from './pages/cv/my-cvs';
import { InterviewStartPage } from './pages/interview/start';
import { InterviewSessionPage } from './pages/interview/session';
import { InterviewHistoryPage } from './pages/interview/history';
import { InterviewReviewPage } from './pages/interview/review';
import { InterviewScoresPage } from './pages/interview/scores';

function App() {
  const { loadUser } = useAuth();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes (with theme toggle) */}
        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Protected routes with main layout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="/cv/upload" element={<CvUploadPage />} />
          <Route path="/cv/my" element={<MyCvsPage />} />
          <Route path="/cv/:id" element={<CvAnalysisPage />} />
          <Route path="/interview/start" element={<InterviewStartPage />} />
          <Route path="/interview/history" element={<InterviewHistoryPage />} />
          <Route path="/interview/scores" element={<InterviewScoresPage />} />
          <Route path="/interview/:id" element={<InterviewSessionPage />} />
          <Route path="/interview/:id/review" element={<InterviewReviewPage />} />
        </Route>

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <AdminRoleGuard>
              <AdminLayout />
            </AdminRoleGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="careers" element={<Careers />} />
          <Route path="topics" element={<Topics />} />
          <Route path="questions" element={<Questions />} />
          <Route path="scenarios" element={<Scenarios />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
