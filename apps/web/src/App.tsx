import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';
import { useAuth } from './hooks/use-auth';
import { ProtectedRoute } from './components/auth/protected-route';
import { AdminRoleGuard } from './components/auth/admin-role-guard';
import { LoginPage } from './pages/auth/login';
import { RegisterPage } from './pages/auth/register';
import { ForgotPasswordPage } from './pages/auth/forgot-password';
import { ResetPasswordPage } from './pages/auth/reset-password';
import { VerifyEmailPage } from './pages/auth/verify-email';
import { AdminLayout } from './components/admin/admin-layout';
import { Dashboard } from './pages/admin/dashboard';
import { Careers } from './pages/admin/careers';
import { Topics } from './pages/admin/topics';
import { Questions } from './pages/admin/questions';
import { Scenarios } from './pages/admin/scenarios';
import { Users } from './pages/admin/users';
import { Settings } from './pages/admin/settings';
import { CvUploadPage } from './pages/cv/upload';
import { CvAnalysisPage } from './pages/cv/analysis';
import { MyCvsPage } from './pages/cv/my-cvs';

function HomePage() {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Interview Review Platform
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered interview preparation and practice platform
        </Typography>
        {user && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            Welcome back, {user.name}!
          </Typography>
        )}
      </Box>
    </Container>
  );
}

function App() {
  const { loadUser } = useAuth();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes - only for ADMIN role */}
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
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* CV routes */}
        <Route
          path="/cv/upload"
          element={
            <ProtectedRoute>
              <CvUploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cv/my"
          element={
            <ProtectedRoute>
              <MyCvsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cv/:id"
          element={
            <ProtectedRoute>
              <CvAnalysisPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
