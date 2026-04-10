import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { cvService, CvUpload } from '../../services/cv-service';

export function MyCvsPage() {
  const navigate = useNavigate();
  const [cvs, setCvs] = useState<CvUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCvs = async () => {
    try {
      setLoading(true);
      const data = await cvService.getMyCvs();
      setCvs(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load CVs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCvs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this CV?')) return;

    try {
      await cvService.delete(id);
      setCvs(cvs.filter(cv => cv.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete CV');
    }
  };

  const getStatusChip = (status: string) => {
    const statusMap = {
      PENDING: { label: 'Pending', color: 'default' as const },
      PROCESSING: { label: 'Processing', color: 'info' as const },
      COMPLETED: { label: 'Completed', color: 'success' as const },
      FAILED: { label: 'Failed', color: 'error' as const },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.PENDING;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">My CVs</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button startIcon={<RefreshIcon />} onClick={loadCvs}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => navigate('/cv/upload')}
          >
            Upload New CV
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {cvs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No CVs uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload your first CV to get started with AI-powered analysis
          </Typography>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => navigate('/cv/upload')}
          >
            Upload CV
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell>Upload Date</TableCell>
                <TableCell>Analysis Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cvs.map((cv) => (
                <TableRow key={cv.id}>
                  <TableCell>{cv.fileName}</TableCell>
                  <TableCell>
                    {new Date(cv.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {cv.analysis ? getStatusChip(cv.analysis.status) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/cv/${cv.id}`)}
                      title="View Analysis"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(cv.id)}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
