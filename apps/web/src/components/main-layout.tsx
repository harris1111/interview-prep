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
  Container,
  Avatar,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Psychology as BrainIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { ThemeToggle } from './theme-toggle';

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

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                mr: 3,
              }}
              onClick={() => navigate('/')}
            >
              <BrainIcon sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}
              >
                InterviewAI
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                    fontWeight: isActive(item.path) ? 600 : 500,
                    bgcolor: isActive(item.path) ? 'primary.50' : 'transparent',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.75,
                    fontSize: '0.8125rem',
                    '&:hover': {
                      bgcolor: isActive(item.path) ? 'primary.50' : 'action.hover',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {user?.role === 'ADMIN' && (
              <Chip
                icon={<AdminIcon sx={{ fontSize: 16 }} />}
                label="Admin"
                size="small"
                color="warning"
                onClick={() => navigate('/admin')}
                sx={{ cursor: 'pointer', fontWeight: 600, mr: 0.5 }}
              />
            )}

            <ThemeToggle />

            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ ml: 0.5 }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {userInitial}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: { minWidth: 200, mt: 1 },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ mt: 0.5 }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
