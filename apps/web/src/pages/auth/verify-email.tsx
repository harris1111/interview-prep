import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Paper, Typography, Box, Alert, CircularProgress, Link } from '@mui/material';
import { Psychology as BrainIcon } from '@mui/icons-material';
import { authService } from '../../services/auth-service';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification token');
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message);
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: 'primary.main',
              mb: 2,
            }}
          >
            <BrainIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          <Typography variant="h4" fontWeight={700}>
            Email Verification
          </Typography>
        </Box>

        <Paper sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}>

          {status === 'loading' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Verifying your email...
              </Typography>
            </Box>
          )}

          {status === 'success' && (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                {message}
              </Alert>
              <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                Redirecting to login page...
              </Typography>
            </>
          )}

          {status === 'error' && (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                {message}
              </Alert>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link component={RouterLink} to="/auth/login" variant="body2">
                  Go to Login
                </Link>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
