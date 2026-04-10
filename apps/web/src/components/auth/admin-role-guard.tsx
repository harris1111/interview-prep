import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { CircularProgress, Box } from '@mui/material';

interface AdminRoleGuardProps {
  children: React.ReactNode;
}

export function AdminRoleGuard({ children }: AdminRoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
