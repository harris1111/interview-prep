import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DataTable, Column } from '../../components/admin/data-table';
import { FormDialog } from '../../components/admin/form-dialog';
import { ConfirmDialog } from '../../components/admin/confirm-dialog';
import { topicApi, careerApi, Topic } from '../../services/admin-service';

export function Topics() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [careerFilter, setCareerFilter] = useState('');
  const [formData, setFormData] = useState({ name: '', careerId: '', description: '', sortOrder: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const queryClient = useQueryClient();

  const { data: careers = [] } = useQuery({
    queryKey: ['careers'],
    queryFn: careerApi.getAll,
  });

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['topics', careerFilter],
    queryFn: () => topicApi.getAll(careerFilter || undefined),
  });

  const createMutation = useMutation({
    mutationFn: topicApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      setDialogOpen(false);
      resetForm();
      setSnackbar({ open: true, message: 'Topic created successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create topic', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Topic> }) => topicApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      setDialogOpen(false);
      setSelectedTopic(null);
      resetForm();
      setSnackbar({ open: true, message: 'Topic updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update topic', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: topicApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      setDeleteDialogOpen(false);
      setSelectedTopic(null);
      setSnackbar({ open: true, message: 'Topic deleted successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete topic', severity: 'error' });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', careerId: '', description: '', sortOrder: 0 });
  };

  const handleCreate = () => {
    setSelectedTopic(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (topic: Topic) => {
    setSelectedTopic(topic);
    setFormData({
      name: topic.name,
      careerId: topic.careerId,
      description: topic.description || '',
      sortOrder: topic.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleDelete = (topic: Topic) => {
    setSelectedTopic(topic);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (selectedTopic) {
      updateMutation.mutate({ id: selectedTopic.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns: Column<Topic>[] = [
    { id: 'name', label: 'Name', sortable: true },
    { id: 'slug', label: 'Slug', sortable: true },
    { id: 'career.name', label: 'Career', format: (_, row) => row.career?.name || '-' },
    { id: 'sortOrder', label: 'Sort Order', align: 'center', sortable: true },
    { id: 'description', label: 'Description' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Topics</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Add Topic
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
        data={topics}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormDialog
        open={dialogOpen}
        title={selectedTopic ? 'Edit Topic' : 'Create Topic'}
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
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <TextField
          margin="dense"
          label="Sort Order"
          type="number"
          fullWidth
          value={formData.sortOrder}
          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) })}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Topic"
        message={`Are you sure you want to delete "${selectedTopic?.name}"? This action cannot be undone.`}
        onConfirm={() => selectedTopic && deleteMutation.mutate(selectedTopic.id)}
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
