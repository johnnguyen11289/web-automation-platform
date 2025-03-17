import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tooltip,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Error,
  Schedule,
  Speed,
} from '@mui/icons-material';
import { Execution, ExecutionStatus, ExecutionStats } from '../../types/execution.types';
import { formatDuration } from '../../utils/dateUtils';

interface ExecutionPanelProps {
  executions: Execution[];
  total?: number;
  stats: ExecutionStats;
  onStart: (workflowId: string, profileId: string, parallel: boolean) => void;
  onPause: (executionId: string) => void;
  onResume: (executionId: string) => void;
  onStop: (executionId: string) => void;
  onRefresh: (page: number, pageSize: number, filters: {
    status?: ExecutionStatus;
    workflowId?: string;
  }) => void;
}

const getStatusColor = (status: ExecutionStatus) => {
  switch (status) {
    case 'running':
      return 'success';
    case 'paused':
      return 'warning';
    case 'completed':
      return 'info';
    case 'failed':
      return 'error';
    case 'stopped':
      return 'default';
    default:
      return 'default';
  }
};

const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  executions = [],
  total = 0,
  stats,
  onStart,
  onPause,
  onResume,
  onStop,
  onRefresh,
}) => {
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | ''>('');
  const [workflowFilter, setWorkflowFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log('ExecutionPanel: Loading data with params:', {
          page: page + 1,
          rowsPerPage,
          statusFilter,
          workflowFilter
        });
        await onRefresh(page + 1, rowsPerPage, {
          status: statusFilter || undefined,
          workflowId: workflowFilter || undefined,
        });
      } catch (error) {
        console.error('ExecutionPanel: Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [page, rowsPerPage, statusFilter, workflowFilter]);

  // Add debug logging for executions prop
  useEffect(() => {
    console.log('ExecutionPanel: Received executions:', executions);
  }, [executions]);

  const handleErrorClick = (execution: Execution) => {
    setSelectedExecution(execution);
    setErrorDialogOpen(true);
  };

  const handleCloseErrorDialog = () => {
    setErrorDialogOpen(false);
    setSelectedExecution(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusChange = (event: SelectChangeEvent<ExecutionStatus | ''>) => {
    setStatusFilter(event.target.value as ExecutionStatus | '');
    setPage(0);
  };

  const handleWorkflowChange = (event: SelectChangeEvent<string>) => {
    setWorkflowFilter(event.target.value);
    setPage(0);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await onRefresh(page + 1, rowsPerPage, {
        status: statusFilter || undefined,
        workflowId: workflowFilter || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Executions</Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={handleStatusChange}
              disabled={isLoading}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="running">Running</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="stopped">Stopped</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Workflow</InputLabel>
            <Select
              value={workflowFilter}
              label="Workflow"
              onChange={handleWorkflowChange}
              disabled={isLoading}
            >
              <MenuItem value="">All</MenuItem>
              {Array.from(new Set(executions.map(e => e.workflowId))).map(workflowId => (
                <MenuItem key={workflowId} value={workflowId}>
                  {workflowId}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.totalExecutions}</Typography>
            <Typography variant="body2">Total</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.runningExecutions}</Typography>
            <Typography variant="body2">Running</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.completedExecutions}</Typography>
            <Typography variant="body2">Completed</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.failedExecutions}</Typography>
            <Typography variant="body2">Failed</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">
              {Math.round(stats.averageDuration / 1000)}s
            </Typography>
            <Typography variant="body2">Avg Duration</Typography>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Workflow</TableCell>
              <TableCell>Profile</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Current Step</TableCell>
              <TableCell>Queue</TableCell>
              <TableCell>Parallel</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography>Loading executions...</Typography>
                </TableCell>
              </TableRow>
            ) : !executions || executions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography>No executions found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              executions.map((execution) => (
                <TableRow key={execution._id}>
                  <TableCell>{execution._id}</TableCell>
                  <TableCell>{execution.workflowId}</TableCell>
                  <TableCell>{execution.profileId}</TableCell>
                  <TableCell>
                    <Chip
                      label={execution.status}
                      color={getStatusColor(execution.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(execution.startTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {execution.endTime ? new Date(execution.endTime).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    {execution.endTime
                      ? `${Math.round(
                          (new Date(execution.endTime).getTime() -
                            new Date(execution.startTime).getTime()) /
                            1000
                        )}s`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {execution.currentStep
                      ? `${execution.currentStep.nodeType} (${execution.currentStep.nodeId})`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {execution.queuePosition ? (
                      <Tooltip title="Queue Position">
                        <Chip
                          icon={<Schedule />}
                          label={execution.queuePosition}
                          size="small"
                        />
                      </Tooltip>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {execution.parallelExecution ? (
                      <Tooltip title="Parallel Execution">
                        <Speed color="primary" />
                      </Tooltip>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {execution.status === 'running' && (
                      <IconButton
                        size="small"
                        onClick={() => onPause(execution._id)}
                      >
                        <Pause />
                      </IconButton>
                    )}
                    {execution.status === 'paused' && (
                      <IconButton
                        size="small"
                        onClick={() => onResume(execution._id)}
                      >
                        <PlayArrow />
                      </IconButton>
                    )}
                    {(execution.status === 'running' || execution.status === 'paused') && (
                      <IconButton
                        size="small"
                        onClick={() => onStop(execution._id)}
                      >
                        <Stop />
                      </IconButton>
                    )}
                    {execution.errorLogs.length > 0 && (
                      <IconButton
                        size="small"
                        onClick={() => handleErrorClick(execution)}
                      >
                        <Error />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        disabled={isLoading}
      />

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onClose={handleCloseErrorDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          Error Logs
        </DialogTitle>
        <DialogContent>
          {selectedExecution?.errorLogs.map((error, index) => (
            <Typography key={index} sx={{ mb: 1 }}>
              {error}
            </Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseErrorDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExecutionPanel; 