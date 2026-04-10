import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Slider,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { settingsApi } from '../../services/admin-service';

export function Settings() {
  const [formData, setFormData] = useState({
    llmBaseUrl: '',
    llmApiKey: '',
    llmModel: '',
    llmTemperature: 0.7,
    systemPrompt: '',
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        llmBaseUrl: settings.llmBaseUrl,
        llmApiKey: settings.llmApiKey,
        llmModel: settings.llmModel,
        llmTemperature: settings.llmTemperature,
        systemPrompt: settings.systemPrompt,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    },
  });

  const testMutation = useMutation({
    mutationFn: settingsApi.testLlm,
    onSuccess: (data: { success: boolean; message: string }) => {
      setTestResult(data);
      setSnackbar({
        open: true,
        message: data.success ? 'LLM connection successful' : 'LLM connection failed',
        severity: data.success ? 'success' : 'error',
      });
    },
    onError: () => {
      setTestResult({ success: false, message: 'Failed to test LLM connection' });
      setSnackbar({ open: true, message: 'Failed to test LLM connection', severity: 'error' });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleTest = () => {
    testMutation.mutate();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 800 }}>
        <Typography variant="h6" gutterBottom>
          LLM Configuration
        </Typography>

        <TextField
          margin="dense"
          label="LLM Base URL"
          type="text"
          fullWidth
          value={formData.llmBaseUrl}
          onChange={(e) => setFormData({ ...formData, llmBaseUrl: e.target.value })}
          helperText="e.g., https://api.openai.com/v1 or http://localhost:11434/v1"
        />

        <TextField
          margin="dense"
          label="API Key"
          type="password"
          fullWidth
          value={formData.llmApiKey}
          onChange={(e) => setFormData({ ...formData, llmApiKey: e.target.value })}
          helperText="Your LLM API key (leave empty for local models)"
        />

        <TextField
          margin="dense"
          label="Model Name"
          type="text"
          fullWidth
          value={formData.llmModel}
          onChange={(e) => setFormData({ ...formData, llmModel: e.target.value })}
          helperText="e.g., gpt-4, llama3.2, gemini-pro"
        />

        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography gutterBottom>
            Temperature: {formData.llmTemperature.toFixed(2)}
          </Typography>
          <Slider
            value={formData.llmTemperature}
            onChange={(_, value) => setFormData({ ...formData, llmTemperature: value as number })}
            min={0}
            max={2}
            step={0.1}
            marks={[
              { value: 0, label: '0' },
              { value: 1, label: '1' },
              { value: 2, label: '2' },
            ]}
          />
        </Box>

        <TextField
          margin="dense"
          label="System Prompt"
          type="text"
          fullWidth
          multiline
          rows={6}
          value={formData.systemPrompt}
          onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
          helperText="System instructions for the AI interviewer"
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleTest}
            disabled={testMutation.isPending}
            startIcon={testMutation.isPending ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            Test Connection
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            startIcon={updateMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Save Settings
          </Button>
        </Box>

        {testResult && (
          <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
            {testResult.message}
          </Alert>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
