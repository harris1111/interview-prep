import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { cvService } from '../../services/cv-service';

export function CvUploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        setFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await cvService.upload(file);

      clearInterval(progressInterval);
      setProgress(100);

      // Redirect to analysis page
      setTimeout(() => {
        navigate(`/cv/${result.id}`);
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Upload Your CV
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload your CV in PDF format for AI-powered analysis and gap assessment
      </Typography>

      <Paper sx={{ p: 4, mt: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed',
            borderColor: file ? 'primary.main' : 'divider',
            borderRadius: 3,
            p: 5,
            textAlign: 'center',
            backgroundColor: file ? 'action.hover' : 'background.default',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            },
          }}
        >
          <UploadIcon sx={{ fontSize: 56, color: file ? 'primary.main' : 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {file ? file.name : 'Drag and drop your CV here'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            or
          </Typography>
          <Button variant="outlined" component="label" disabled={uploading}>
            Browse Files
            <input
              type="file"
              hidden
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
            PDF only, max 10MB
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {file && !uploading && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleUpload}
              startIcon={<UploadIcon />}
            >
              Upload and Analyze
            </Button>
          </Box>
        )}

        {uploading && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Uploading... {progress}%
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}
      </Paper>
    </Container>
  );
}
