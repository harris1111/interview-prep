import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Paper,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { DataTable, Column } from '../../components/admin/data-table';
import { FormDialog } from '../../components/admin/form-dialog';
import { ConfirmDialog } from '../../components/admin/confirm-dialog';
import { ImportDialog } from '../../components/admin/import-dialog';
import {
  knowledgeApi,
  careerApi,
  KnowledgeEntry,
} from '../../services/admin-service';

export function Knowledge() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(
    null,
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filters, setFilters] = useState({
    careerId: '',
    topicSlug: '',
    search: '',
  });
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source: '',
    careerId: '',
    topicSlug: '',
    tags: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: careers = [] } = useQuery({
    queryKey: ['careers'],
    queryFn: () => careerApi.getAll(),
  });

  const { data: knowledgeData, isLoading } = useQuery({
    queryKey: ['knowledge', page, rowsPerPage, filters],
    queryFn: () =>
      knowledgeApi.getAll({
        ...filters,
        careerId: filters.careerId || undefined,
        topicSlug: filters.topicSlug || undefined,
        search: filters.search || undefined,
        page: page + 1,
        limit: rowsPerPage,
      }),
  });

  const createMutation = useMutation({
    mutationFn: knowledgeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setDialogOpen(false);
      resetForm();
      setSnackbar({
        open: true,
        message: 'Knowledge entry created successfully',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to create knowledge entry',
        severity: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KnowledgeEntry> }) =>
      knowledgeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setDialogOpen(false);
      setSelectedEntry(null);
      resetForm();
      setSnackbar({
        open: true,
        message: 'Knowledge entry updated successfully',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to update knowledge entry',
        severity: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: knowledgeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
      setSnackbar({
        open: true,
        message: 'Knowledge entry deleted successfully',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to delete knowledge entry',
        severity: 'error',
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: knowledgeApi.importFiles,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setImportResult(result);
      setImportDialogOpen(true);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to import files',
        severity: 'error',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      source: '',
      careerId: '',
      topicSlug: '',
      tags: '',
    });
  };

  const handleCreate = () => {
    setSelectedEntry(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      source: entry.source || '',
      careerId: entry.careerId || '',
      topicSlug: entry.topicSlug || '',
      tags: entry.tags?.join(', ') || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (selectedEntry) {
      updateMutation.mutate({ id: selectedEntry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleImport = () => {
    if (selectedFiles.length > 0) {
      importMutation.mutate(selectedFiles);
    }
  };

  const columns: Column<KnowledgeEntry>[] = [
    { id: 'title', label: 'Title', minWidth: 200 },
    {
      id: 'source',
      label: 'Source',
      format: (value) => value || '-',
    },
    {
      id: 'careerId',
      label: 'Career',
      format: (value) => {
        const career = careers.find((c: any) => c.id === value);
        return career ? career.name : '-';
      },
    },
    {
      id: 'topicSlug',
      label: 'Topic',
      format: (value) => value || '-',
    },
    {
      id: 'tags',
      label: 'Tags',
      format: (value: string[]) =>
        value && value.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {value.map((tag, idx) => (
              <Chip key={idx} label={tag} size="small" />
            ))}
          </Box>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h4">Knowledge Base</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add Entry
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Import Knowledge
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
            >
              Select Files
            </Button>
          </label>
          {selectedFiles.length > 0 && (
            <>
              <Typography variant="body2">
                {selectedFiles.length} file(s) selected
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={handleImport}
                disabled={importMutation.isPending}
              >
                Import
              </Button>
            </>
          )}
        </Box>
      </Paper>

      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={filters.search}
          onChange={(e) =>
            setFilters({ ...filters, search: e.target.value })
          }
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          label="Career"
          variant="outlined"
          size="small"
          value={filters.careerId}
          onChange={(e) =>
            setFilters({ ...filters, careerId: e.target.value })
          }
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          {careers.map((career: any) => (
            <MenuItem key={career.id} value={career.id}>
              {career.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <DataTable
        columns={columns}
        data={knowledgeData?.data || []}
        total={knowledgeData?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={isLoading}
      />

      <FormDialog
        open={dialogOpen}
        title={selectedEntry ? 'Edit Knowledge Entry' : 'Create Knowledge Entry'}
        onClose={() => {
          setDialogOpen(false);
          setSelectedEntry(null);
          resetForm();
        }}
        onSubmit={handleSubmit}
      >
        <TextField
          label="Title"
          fullWidth
          margin="normal"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <TextField
          label="Content"
          fullWidth
          margin="normal"
          multiline
          rows={6}
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          required
        />
        <TextField
          label="Source"
          fullWidth
          margin="normal"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
        />
        <TextField
          select
          label="Career"
          fullWidth
          margin="normal"
          value={formData.careerId}
          onChange={(e) =>
            setFormData({ ...formData, careerId: e.target.value })
          }
        >
          <MenuItem value="">None</MenuItem>
          {careers.map((career: any) => (
            <MenuItem key={career.id} value={career.id}>
              {career.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Topic Slug"
          fullWidth
          margin="normal"
          value={formData.topicSlug}
          onChange={(e) =>
            setFormData({ ...formData, topicSlug: e.target.value })
          }
        />
        <TextField
          label="Tags (comma-separated)"
          fullWidth
          margin="normal"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Knowledge Entry"
        message="Are you sure you want to delete this knowledge entry? This action cannot be undone."
        onConfirm={() => {
          if (selectedEntry) {
            deleteMutation.mutate(selectedEntry.id);
          }
        }}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedEntry(null);
        }}
      />

      <ImportDialog
        open={importDialogOpen}
        result={importResult}
        onClose={() => setImportDialogOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
