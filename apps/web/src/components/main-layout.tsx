import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  AccountCircle,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/auth/login');
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/cv/upload', label: 'Upload CV' },
    { path: '/cv/my', label: 'My CVs' },
    { path: '/interview/start', label: 'Start Interview' },
    { path: '/interview/history', label: 'History' },
    { path: '/interview/scores', label: 'Scores' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ cursor: 'pointer', mr: 3, fontWeight: 700 }}
            onClick={() => navigate('/')}
          >
            Interview Review
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={{
                  fontWeight: isActive(item.path) ? 700 : 400,
                  borderBottom: isActive(item.path) ? '2px solid white' : 'none',
                  borderRadius: 0,
                  textTransform: 'none',
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {user?.role === 'ADMIN' && (
            <Chip
              icon={<AdminIcon />}
              label="Admin"
              color="warning"
              size="small"
              onClick={() => navigate('/admin')}
              sx={{ mr: 1, cursor: 'pointer', color: 'white' }}
              variant="outlined"
            />
          )}

          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.name} ({user?.role})
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
