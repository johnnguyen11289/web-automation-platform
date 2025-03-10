import React, { useState } from 'react';
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
  stats: ExecutionStats;
  onStart: (workflowId: string, profileId: string, parallel: boolean) => void;
  onPause: (executionId: string) => void;
  onResume: (executionId: string) => void;
  onStop: (executionId: string) => void;
  onRefresh: () => void;
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
  executions,
  stats,
  onStart,
  onPause,
  onResume,
  onStop,
  onRefresh,
}) => {
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  const handleErrorClick = (execution: Execution) => {
    setSelectedExecution(execution);
    setErrorDialogOpen(true);
  };

  const handleCloseErrorDialog = () => {
    setErrorDialogOpen(false);
    setSelectedExecution(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Stats Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Total Executions</Typography>
            <Typography variant="h4">{stats.totalExecutions}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Running</Typography>
            <Typography variant="h4" color="success.main">{stats.runningExecutions}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Completed</Typography>
            <Typography variant="h4" color="info.main">{stats.completedExecutions}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Failed</Typography>
            <Typography variant="h4" color="error.main">{stats.failedExecutions}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Executions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Workflow ID</TableCell>
              <TableCell>Profile ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Current Step</TableCell>
              <TableCell>Queue</TableCell>
              <TableCell>Parallel</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {executions.map((execution) => (
              <TableRow key={execution._id}>
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
                  {execution.endTime
                    ? formatDuration(execution.startTime, execution.endTime)
                    : formatDuration(execution.startTime, new Date())}
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
                      color="warning"
                    >
                      <Pause />
                    </IconButton>
                  )}
                  {execution.status === 'paused' && (
                    <IconButton
                      size="small"
                      onClick={() => onResume(execution._id)}
                      color="success"
                    >
                      <PlayArrow />
                    </IconButton>
                  )}
                  {(execution.status === 'running' || execution.status === 'paused') && (
                    <IconButton
                      size="small"
                      onClick={() => onStop(execution._id)}
                      color="error"
                    >
                      <Stop />
                    </IconButton>
                  )}
                  {execution.errorLogs.length > 0 && (
                    <IconButton
                      size="small"
                      onClick={() => handleErrorClick(execution)}
                      color="error"
                    >
                      <Error />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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