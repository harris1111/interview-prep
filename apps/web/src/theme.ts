import { createTheme, alpha, PaletteOptions } from '@mui/material';
import { ThemeKey } from './stores/theme-store';

const fontFamily = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const palettes: Record<ThemeKey, PaletteOptions> = {
  light: {
    mode: 'light',
    primary: { main: '#2563EB', light: '#60A5FA', dark: '#1D4ED8', contrastText: '#FFFFFF' },
    secondary: { main: '#7C3AED', light: '#A78BFA', dark: '#5B21B6' },
    error: { main: '#EF4444', light: '#FCA5A5', dark: '#DC2626' },
    warning: { main: '#F97316', light: '#FDBA74', dark: '#EA580C' },
    success: { main: '#10B981', light: '#6EE7B7', dark: '#059669' },
    info: { main: '#3B82F6', light: '#93C5FD', dark: '#2563EB' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#1E293B', secondary: '#64748B' },
    divider: '#E2E8F0',
  },
  dark: {
    mode: 'dark',
    primary: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB', contrastText: '#FFFFFF' },
    secondary: { main: '#A78BFA', light: '#C4B5FD', dark: '#7C3AED' },
    error: { main: '#F87171', light: '#FCA5A5', dark: '#EF4444' },
    warning: { main: '#FB923C', light: '#FDBA74', dark: '#F97316' },
    success: { main: '#34D399', light: '#6EE7B7', dark: '#10B981' },
    info: { main: '#60A5FA', light: '#93C5FD', dark: '#3B82F6' },
    background: { default: '#0F172A', paper: '#1E293B' },
    text: { primary: '#F1F5F9', secondary: '#94A3B8' },
    divider: '#334155',
  },
  'nord-light': {
    mode: 'light',
    primary: { main: '#5E81AC', light: '#81A1C1', dark: '#4C6A91', contrastText: '#ECEFF4' },
    secondary: { main: '#B48EAD', light: '#C9A8C4', dark: '#9B7196' },
    error: { main: '#BF616A', light: '#D08770', dark: '#A3545C' },
    warning: { main: '#D08770', light: '#EBCB8B', dark: '#B87461' },
    success: { main: '#A3BE8C', light: '#B5CF9E', dark: '#8FAA78' },
    info: { main: '#81A1C1', light: '#88C0D0', dark: '#5E81AC' },
    background: { default: '#ECEFF4', paper: '#E5E9F0' },
    text: { primary: '#2E3440', secondary: '#4C566A' },
    divider: '#D8DEE9',
  },
  'nord-dark': {
    mode: 'dark',
    primary: { main: '#88C0D0', light: '#8FBCBB', dark: '#81A1C1', contrastText: '#2E3440' },
    secondary: { main: '#B48EAD', light: '#C9A8C4', dark: '#9B7196' },
    error: { main: '#BF616A', light: '#D08770', dark: '#A3545C' },
    warning: { main: '#EBCB8B', light: '#D9C08C', dark: '#D08770' },
    success: { main: '#A3BE8C', light: '#B5CF9E', dark: '#8FAA78' },
    info: { main: '#81A1C1', light: '#88C0D0', dark: '#5E81AC' },
    background: { default: '#2E3440', paper: '#3B4252' },
    text: { primary: '#ECEFF4', secondary: '#D8DEE9' },
    divider: '#4C566A',
  },
};

export function createAppTheme(key: ThemeKey) {
  const palette = palettes[key];
  const isDark = palette.mode === 'dark';
  const dividerColor = (palette.divider as string) || (isDark ? '#334155' : '#E2E8F0');
  const primaryMain = (palette.primary as any)?.main || '#2563EB';
  const scrollbarColor = isDark ? '#475569' : '#CBD5E1';

  return createTheme({
    palette,
    typography: {
      fontFamily,
      h1: { fontWeight: 700, letterSpacing: '-0.025em' },
      h2: { fontWeight: 700, letterSpacing: '-0.025em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 600, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.6 },
      button: { fontWeight: 600, textTransform: 'none' as const },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: scrollbarColor,
              borderRadius: 3,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 20px',
            fontSize: '0.875rem',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
          contained: {
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha(primaryMain, 0.25)}`,
            },
          },
          outlined: {
            borderWidth: 1.5,
            '&:hover': { borderWidth: 1.5 },
          },
          sizeLarge: {
            padding: '12px 28px',
            fontSize: '1rem',
          },
        },
        defaultProps: { disableElevation: true },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${dividerColor}`,
            boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          rounded: { borderRadius: 16 },
        },
        defaultProps: { elevation: 0 },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: 'none',
            borderBottom: `1px solid ${dividerColor}`,
          },
        },
        defaultProps: { elevation: 0 },
      },
      MuiTextField: {
        styleOverrides: {
          root: { '& .MuiOutlinedInput-root': { borderRadius: 10 } },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 500, borderRadius: 8 } },
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 500, minHeight: 48 },
        },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 20 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 12 } },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            fontSize: '0.8125rem',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            '&.Mui-selected': {
              backgroundColor: alpha(primaryMain, 0.08),
              '&:hover': { backgroundColor: alpha(primaryMain, 0.12) },
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${dividerColor}`,
            boxShadow: 'none',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 4, height: 6 } },
      },
      MuiSkeleton: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
    },
  });
}

// Default export for backward compatibility
export const theme = createAppTheme('light');
