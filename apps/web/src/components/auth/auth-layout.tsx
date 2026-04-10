import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { ThemeToggle } from '../theme-toggle';

export function AuthLayout() {
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
        <ThemeToggle />
      </Box>
      <Outlet />
    </Box>
  );
}
