import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DataTable, Column } from '../../components/admin/data-table';
import { FormDialog } from '../../components/admin/form-dialog';
import { ConfirmDialog } from '../../components/admin/confirm-dialog';
import { careerApi, Career } from '../../services/admin-service';

export function Careers() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const queryClient = useQueryClient();

  const { data: careers = [], isLoading } = useQuery({
    queryKey: ['careers'],
    queryFn: careerApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: careerApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers'] });
      setDialogOpen(false);
      setFormData({ name: '', description: '' });
      setSnackbar({ open: true, message: 'Career created successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create career', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Career> }) => careerApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers'] });
      setDialogOpen(false);
      setSelectedCareer(null);
      setFormData({ name: '', description: '' });
      setSnackbar({ open: true, message: 'Career updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update career', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: careerApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers'] });
      setDeleteDialogOpen(false);
      setSelectedCareer(null);
      setSnackbar({ open: true, message: 'Career deleted successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete career', severity: 'error' });
    },
  });

  const handleCreate = () => {
    setSelectedCareer(null);
    setFormData({ name: '', description: '' });
    setDialogOpen(true);
  };

  const handleEdit = (career: Career) => {
    setSelectedCareer(career);
    setFormData({ name: career.name, description: career.description || '' });
    setDialogOpen(true);
  };

  const handleDelete = (career: Career) => {
    setSelectedCareer(career);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (selectedCareer) {
      updateMutation.mutate({ id: selectedCareer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (career: Career) => {
    updateMutation.mutate({ id: career.id, data: { isActive: !career.isActive } });
  };

  const columns: Column<Career>[] = [
    { id: 'name', label: 'Name', sortable: true },
    { id: 'slug', label: 'Slug', sortable: true },
    { id: 'description', label: 'Description' },
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
        <Typography variant="h4">Careers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Add Career
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={careers}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormDialog
        open={dialogOpen}
        title={selectedCareer ? 'Edit Career' : 'Create Career'}
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
          margin="dense"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Career"
        message={`Are you sure you want to delete "${selectedCareer?.name}"? This action cannot be undone.`}
        onConfirm={() => selectedCareer && deleteMutation.mutate(selectedCareer.id)}
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
