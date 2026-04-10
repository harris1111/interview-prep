import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import {
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  AcUnit as NordIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useThemeStore, ThemeKey } from '../stores/theme-store';

const themeOptions: { key: ThemeKey; label: string; icon: React.ReactNode }[] = [
  { key: 'light', label: 'Light', icon: <LightIcon fontSize="small" /> },
  { key: 'dark', label: 'Dark', icon: <DarkIcon fontSize="small" /> },
  { key: 'nord-light', label: 'Nord Light', icon: <NordIcon fontSize="small" sx={{ color: '#5E81AC' }} /> },
  { key: 'nord-dark', label: 'Nord Dark', icon: <NordIcon fontSize="small" sx={{ color: '#88C0D0' }} /> },
];

export function ThemeToggle() {
  const { themeKey, setTheme } = useThemeStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentIcon = themeKey.includes('dark') ? <DarkIcon /> : <LightIcon />;

  return (
    <>
      <Tooltip title="Theme">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ color: 'text.secondary' }}>
          {currentIcon}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { minWidth: 180, mt: 1 } } }}
      >
        {themeOptions.map((opt) => (
          <MenuItem
            key={opt.key}
            selected={themeKey === opt.key}
            onClick={() => { setTheme(opt.key); setAnchorEl(null); }}
          >
            <ListItemIcon>{opt.icon}</ListItemIcon>
            <ListItemText>{opt.label}</ListItemText>
            {themeKey === opt.key && <CheckIcon fontSize="small" color="primary" sx={{ ml: 1 }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
