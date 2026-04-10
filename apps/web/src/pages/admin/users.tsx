import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  MenuItem,
  TextField,
  Chip,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import { DataTable, Column } from '../../components/admin/data-table';
import { ConfirmDialog } from '../../components/admin/confirm-dialog';
import { userApi, User } from '../../services/admin-service';

const ROLES = ['USER', 'ADMIN'];

export function Users() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filters, setFilters] = useState({ search: '', role: '' });
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page, rowsPerPage, filters],
    queryFn: () =>
      userApi.getAll({
        ...filters,
        role: filters.role || undefined,
        search: filters.search || undefined,
        page: page + 1,
        limit: rowsPerPage,
      }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => userApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setSnackbar({ open: true, message: 'User role updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update user role', severity: 'error' });
    },
  });

  const handleRoleChange = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role === 'ADMIN' ? 'USER' : 'ADMIN');
    setRoleDialogOpen(true);
  };

  const handleConfirmRoleChange = () => {
    if (selectedUser) {
      updateRoleMutation.mutate({ id: selectedUser.id, role: newRole });
    }
  };

  const columns: Column<User>[] = [
    { id: 'email', label: 'Email', sortable: true },
    { id: 'name', label: 'Name', sortable: true },
    {
      id: 'role',
      label: 'Role',
      align: 'center',
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color={value === 'ADMIN' ? 'error' : 'default'}
        />
      ),
    },
    {
      id: 'isVerified',
      label: 'Verified',
      align: 'center',
      format: (value) => (
        <Chip
          label={value ? 'Yes' : 'No'}
          size="small"
          color={value ? 'success' : 'warning'}
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Created',
      format: (value) => new Date(value).toLocaleDateString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      format: (_, row) => (
        <IconButton
          size="small"
          onClick={() => handleRoleChange(row)}
          color={row.role === 'ADMIN' ? 'warning' : 'primary'}
          title={row.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
        >
          <AdminIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Users
      </Typography>

      <Box sx={{ mb: 2 }}>
        <TextField
          select
          label="Role Filter"
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          sx={{ minWidth: 150 }}
          size="small"
        >
          <MenuItem value="">All Roles</MenuItem>
          {ROLES.map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <DataTable
        columns={columns}
        data={usersData?.data || []}
        total={usersData?.total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={isLoading}
        onSearch={(search) => setFilters({ ...filters, search })}
        searchPlaceholder="Search users by email or name..."
      />

      <ConfirmDialog
        open={roleDialogOpen}
        title="Change User Role"
        message={`Are you sure you want to ${newRole === 'ADMIN' ? 'promote' : 'demote'} "${selectedUser?.name}" to ${newRole}?`}
        onConfirm={handleConfirmRoleChange}
        onCancel={() => setRoleDialogOpen(false)}
        loading={updateRoleMutation.isPending}
        confirmLabel="Change Role"
        confirmColor={newRole === 'ADMIN' ? 'warning' : 'primary'}
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
