import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DataTable, Column } from '../../components/admin/data-table';
import { FormDialog } from '../../components/admin/form-dialog';
import { ConfirmDialog } from '../../components/admin/confirm-dialog';
import { questionApi, topicApi, Question } from '../../services/admin-service';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export function Questions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filters, setFilters] = useState({ topicId: '', difficulty: '', search: '' });
  const [formData, setFormData] = useState({
    content: '',
    expectedAnswer: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    topicId: '',
    tags: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const queryClient = useQueryClient();

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => topicApi.getAll(),
  });

  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['questions', page, rowsPerPage, filters],
    queryFn: () =>
      questionApi.getAll({
        ...filters,
        topicId: filters.topicId || undefined,
        difficulty: filters.difficulty || undefined,
        search: filters.search || undefined,
        page: page + 1,
        limit: rowsPerPage,
      }),
  });

  const createMutation = useMutation({
    mutationFn: questionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setDialogOpen(false);
      resetForm();
      setSnackbar({ open: true, message: 'Question created successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create question', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Question> }) => questionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setDialogOpen(false);
      setSelectedQuestion(null);
      resetForm();
      setSnackbar({ open: true, message: 'Question updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update question', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: questionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setDeleteDialogOpen(false);
      setSelectedQuestion(null);
      setSnackbar({ open: true, message: 'Question deleted successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete question', severity: 'error' });
    },
  });

  const resetForm = () => {
    setFormData({ content: '', expectedAnswer: '', difficulty: 'medium', topicId: '', tags: '' });
  };

  const handleCreate = () => {
    setSelectedQuestion(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);
    setFormData({
      content: question.content,
      expectedAnswer: question.expectedAnswer || '',
      difficulty: question.difficulty,
      topicId: question.topicId,
      tags: question.tags?.join(', ') || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (question: Question) => {
    setSelectedQuestion(question);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    if (selectedQuestion) {
      updateMutation.mutate({ id: selectedQuestion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns: Column<Question>[] = [
    { id: 'content', label: 'Content', minWidth: 200 },
    { id: 'topic.name', label: 'Topic', format: (_, row) => row.topic?.name || '-' },
    {
      id: 'difficulty',
      label: 'Difficulty',
      align: 'center',
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color={value === 'easy' ? 'success' : value === 'medium' ? 'warning' : 'error'}
        />
      ),
    },
    {
      id: 'tags',
      label: 'Tags',
      format: (value: string[]) =>
        value?.length > 0 ? value.map((tag) => <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />) : '-',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Questions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Add Question
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Topic"
          value={filters.topicId}
          onChange={(e) => setFilters({ ...filters, topicId: e.target.value })}
          sx={{ minWidth: 200 }}
          size="small"
        >
          <MenuItem value="">All Topics</MenuItem>
          {topics.map((topic) => (
            <MenuItem key={topic.id} value={topic.id}>
              {topic.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Difficulty"
          value={filters.difficulty}
          onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          sx={{ minWidth: 150 }}
          size="small"
        >
          <MenuItem value="">All Difficulties</MenuItem>
          {DIFFICULTIES.map((diff) => (
            <MenuItem key={diff} value={diff}>
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <DataTable
        columns={columns}
        data={questionsData?.data || []}
        total={questionsData?.total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearch={(search) => setFilters({ ...filters, search })}
        searchPlaceholder="Search questions..."
      />

      <FormDialog
        open={dialogOpen}
        title={selectedQuestion ? 'Edit Question' : 'Create Question'}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      >
        <TextField
          select
          margin="dense"
          label="Topic"
          fullWidth
          required
          value={formData.topicId}
          onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
        >
          {topics.map((topic) => (
            <MenuItem key={topic.id} value={topic.id}>
              {topic.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          autoFocus
          margin="dense"
          label="Content"
          type="text"
          fullWidth
          required
          multiline
          rows={3}
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        />
        <TextField
          margin="dense"
          label="Expected Answer"
          type="text"
          fullWidth
          multiline
          rows={3}
          value={formData.expectedAnswer}
          onChange={(e) => setFormData({ ...formData, expectedAnswer: e.target.value })}
        />
        <TextField
          select
          margin="dense"
          label="Difficulty"
          fullWidth
          required
          value={formData.difficulty}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
        >
          {DIFFICULTIES.map((diff) => (
            <MenuItem key={diff} value={diff}>
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          margin="dense"
          label="Tags (comma-separated)"
          type="text"
          fullWidth
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          helperText="Enter tags separated by commas"
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        onConfirm={() => selectedQuestion && deleteMutation.mutate(selectedQuestion.id)}
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
