import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Report as ReportIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safetyAPI, SafetyIncident, userAPI, User } from '../services/api';
import { useDialogForm } from '../components/common';

const Safety: React.FC = () => {
  const {
    open,
    setOpen,
    selectedItem: selectedIncident,
    setSelectedItem: setSelectedIncident,
    formData,
    setFormData,
    handleOpen,
    handleClose,
  } = useDialogForm<SafetyIncident>();
  const queryClient = useQueryClient();

  const { data: incidents, isLoading, error } = useQuery({
    queryKey: ['incidents'],
    queryFn: safetyAPI.getIncidents
  });

  const { data: policies } = useQuery({
    queryKey: ['policies'],
    queryFn: safetyAPI.getPolicies
  });

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: userAPI.getUsers,
    retry: 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const reportMutation = useMutation({
    mutationFn: safetyAPI.reportIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      handleClose();
    },
  });

  const handleSubmit = () => {
    if (formData.severity && formData.description && formData.reported_by) {
      reportMutation.mutate(formData as Omit<SafetyIncident, 'id' | 'occurred_at'>);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'severity',
      headerName: '严重程度',
      width: 120,
      renderCell: (params) => {
        const severity = params.value;
        const color = severity === 'high' ? 'error' : 
                     severity === 'medium' ? 'warning' : 'info';
        return <Chip label={severity} color={color} size="small" />;
      },
    },
    { field: 'description', headerName: '描述', width: 300 },
    { field: 'reported_by', headerName: '报告人', width: 150 },
    {
      field: 'occurred_at',
      headerName: '发生时间',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
  ];

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          安全与合规
        </Typography>
        <Alert severity="error">
          安全数据加载失败，请重试。
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          安全与合规
        </Typography>
        <Button
          variant="contained"
          startIcon={<ReportIcon />}
          onClick={() => handleOpen()}
        >
          上报事件
        </Button>
      </Box>

      {/* Safety Policies */}
      {policies && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            安全政策
          </Typography>
          <Grid container spacing={2}>
            {policies.map((policy: any) => (
              <Grid item xs={12} md={6} key={policy.id}>
                <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1">{policy.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {policy.summary}
                  </Typography>
                  <Chip
                    label={policy.status}
                    color={policy.status === 'Active' ? 'success' : 'default'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Incidents Management */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={incidents || []}
          columns={columns}
          loading={isLoading}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedIncident ? '编辑事件' : '上报新事件'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>严重程度</InputLabel>
                <Select
                  value={formData.severity || ''}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  label="严重程度"
                  required
                >
                  <MenuItem value="low">低</MenuItem>
                  <MenuItem value="medium">中</MenuItem>
                  <MenuItem value="high">高</MenuItem>
                  <MenuItem value="critical">严重</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="描述"
                multiline
                rows={4}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>报告人</InputLabel>
                <Select
                  value={formData.reported_by || ''}
                  onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                  label="报告人"
                  required
                >
                  {usersLoading ? (
                    <MenuItem value="" disabled>正在加载用户...</MenuItem>
                  ) : usersError ? (
                    <MenuItem value="" disabled>用户加载出错</MenuItem>
                  ) : users && users.length > 0 ? (
                    users.map((user: User) => (
                      <MenuItem key={user.id} value={user.full_name || user.username}>
                        {user.full_name || user.username}（{user.role}）
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>暂无可用用户</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={reportMutation.isPending}
          >
            {selectedIncident ? '更新' : '上报'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Safety;
