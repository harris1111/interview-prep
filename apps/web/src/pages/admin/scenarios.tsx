import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Switch,
  Snackbar,
  Alert,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DataTable, Column } from '../../components/admin/data-table';
import { FormDialog } from '../../components/admin/form-dialog';
import { ConfirmDialog } from '../../components/admin/confirm-dialog';
import { scenarioApi, careerApi, topicApi, Scenario, ScenarioRound } from '../../services/admin-service';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export function Scenarios() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [careerFilter, setCareerFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    careerId: '',
    description: '',
    rounds: [] as ScenarioRound[],
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const queryClient = useQueryClient();

  const { data: careers = [] } = useQuery({
    queryKey: ['careers'],
    queryFn: careerApi.getAll,
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics', formData.careerId],
    queryFn: () => topicApi.getAll(formData.careerId || undefined),
    enabled: !!formData.careerId,
  });

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ['scenarios', careerFilter],
    queryFn: () => scenarioApi.getAll(careerFilter || undefined),
  });

  const createMutation = useMutation({
    mutationFn: scenarioApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      setDialogOpen(false);
      resetForm();
      setSnackbar({ open: true, message: 'Scenario created successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create scenario', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Scenario> }) => scenarioApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      setDialogOpen(false);
      setSelectedScenario(null);
      resetForm();
      setSnackbar({ open: true, message: 'Scenario updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update scenario', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: scenarioApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      setDeleteDialogOpen(false);
      setSelectedScenario(null);
      setSnackbar({ open: true, message: 'Scenario deleted successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete scenario', severity: 'error' });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', careerId: '', description: '', rounds: [] });
  };

  const handleCreate = () => {
    setSelectedScenario(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setFormData({
      name: scenario.name,
      careerId: scenario.careerId,
      description: scenario.description || '',
      rounds: scenario.rounds,
    });
    setDialogOpen(true);
  };

  const handleDelete = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (selectedScenario) {
      updateMutation.mutate({ id: selectedScenario.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (scenario: Scenario) => {
    updateMutation.mutate({ id: scenario.id, data: { isActive: !scenario.isActive } });
  };

  const addRound = () => {
    const newRound: ScenarioRound = {
      roundNumber: formData.rounds.length + 1,
      name: '',
      topics: [],
      questionCount: 5,
      difficulty: 'medium',
      durationMinutes: 30,
    };
    setFormData({ ...formData, rounds: [...formData.rounds, newRound] });
  };

  const updateRound = (index: number, field: keyof ScenarioRound, value: any) => {
    const updatedRounds = [...formData.rounds];
    updatedRounds[index] = { ...updatedRounds[index], [field]: value };
    setFormData({ ...formData, rounds: updatedRounds });
  };

  const removeRound = (index: number) => {
    const updatedRounds = formData.rounds.filter((_, i) => i !== index);
    setFormData({ ...formData, rounds: updatedRounds });
  };

  const columns: Column<Scenario>[] = [
    { id: 'name', label: 'Name', sortable: true },
    { id: 'career.name', label: 'Career', format: (_, row) => row.career?.name || '-' },
    { id: 'rounds', label: 'Rounds', align: 'center', format: (value: ScenarioRound[]) => value?.length || 0 },
    {
      id: 'isActive',
      label: 'Active',
      align: 'center',
      format: (value, row) => (
        <Switch
          checked={value}
          onChange={() => handleToggleActive(row)}
          size="small"
        />
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Scenarios</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Add Scenario
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          select
          label="Filter by Career"
          value={careerFilter}
          onChange={(e) => setCareerFilter(e.target.value)}
          sx={{ minWidth: 200 }}
          size="small"
        >
          <MenuItem value="">All Careers</MenuItem>
          {careers.map((career) => (
            <MenuItem key={career.id} value={career.id}>
              {career.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <DataTable
        columns={columns}
        data={scenarios}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormDialog
        open={dialogOpen}
        title={selectedScenario ? 'Edit Scenario' : 'Create Scenario'}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      >
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          type="text"
          fullWidth
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <TextField
          select
          margin="dense"
          label="Career"
          fullWidth
          required
          value={formData.careerId}
          onChange={(e) => setFormData({ ...formData, careerId: e.target.value })}
        >
          {careers.map((career) => (
            <MenuItem key={career.id} value={career.id}>
              {career.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          margin="dense"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={2}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">Rounds</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={addRound}>
            Add Round
          </Button>
        </Box>

        {formData.rounds.map((round, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2 }} variant="outlined">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">Round {index + 1}</Typography>
              <IconButton size="small" onClick={() => removeRound(index)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField
              margin="dense"
              label="Round Name"
              type="text"
              fullWidth
              size="small"
              required
              value={round.name}
              onChange={(e) => updateRound(index, 'name', e.target.value)}
            />
            <TextField
              select
              margin="dense"
              label="Topics"
              fullWidth
              size="small"
              SelectProps={{ multiple: true }}
              value={round.topics}
              onChange={(e) => updateRound(index, 'topics', e.target.value)}
            >
              {topics.map((topic) => (
                <MenuItem key={topic.id} value={topic.id}>
                  {topic.name}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                margin="dense"
                label="Question Count"
                type="number"
                size="small"
                value={round.questionCount}
                onChange={(e) => updateRound(index, 'questionCount', parseInt(e.target.value, 10))}
              />
              <TextField
                select
                margin="dense"
                label="Difficulty"
                size="small"
                value={round.difficulty}
                onChange={(e) => updateRound(index, 'difficulty', e.target.value)}
              >
                {DIFFICULTIES.map((diff) => (
                  <MenuItem key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                margin="dense"
                label="Duration (min)"
                type="number"
                size="small"
                value={round.durationMinutes}
                onChange={(e) => updateRound(index, 'durationMinutes', parseInt(e.target.value, 10))}
              />
            </Box>
          </Paper>
        ))}
      </FormDialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Scenario"
        message={`Are you sure you want to delete "${selectedScenario?.name}"? This action cannot be undone.`}
        onConfirm={() => selectedScenario && deleteMutation.mutate(selectedScenario.id)}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={deleteMutation.isPending}
      />

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
