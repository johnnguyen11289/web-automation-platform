import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip,
} from '@mui/material';
import { PlayArrow, Stop, Refresh } from '@mui/icons-material';

interface ExecutionStatus {
  jobId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  progress: number;
  currentStep?: string;
  startTime: string;
  endTime?: string;
}

interface ExecutionPanelProps {
  activeExecutions: ExecutionStatus[];
  onStart: (workflowId: string) => void;
  onStop: (jobId: string) => void;
  onRefresh: () => void;
}

const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  activeExecutions,
  onStart,
  onStop,
  onRefresh,
}) => {
  const getStatusColor = (status: ExecutionStatus['status']) => {
    switch (status) {
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper elevation={2}>
      <Box p={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Execution Panel</Typography>
          <Box>
            <Button
              startIcon={<Refresh />}
              onClick={onRefresh}
              size="small"
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <List>
          {activeExecutions.map((execution) => (
            <ListItem
              key={execution.jobId}
              secondaryAction={
                <Button
                  startIcon={execution.status === 'running' ? <Stop /> : <PlayArrow />}
                  color={execution.status === 'running' ? 'error' : 'primary'}
                  onClick={() =>
                    execution.status === 'running'
                      ? onStop(execution.jobId)
                      : onStart(execution.jobId)
                  }
                >
                  {execution.status === 'running' ? 'Stop' : 'Start'}
                </Button>
              }
            >
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center">
                    {execution.workflowName}
                    <Chip
                      label={execution.status}
                      color={getStatusColor(execution.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" component="span">
                      {execution.currentStep}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <CircularProgress
                        variant="determinate"
                        value={execution.progress}
                        size={20}
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption">
                        {execution.progress}% Complete
                      </Typography>
                    </Box>
                    <Typography variant="caption" display="block">
                      Started: {new Date(execution.startTime).toLocaleString()}
                    </Typography>
                    {execution.endTime && (
                      <Typography variant="caption" display="block">
                        Ended: {new Date(execution.endTime).toLocaleString()}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
};

export default ExecutionPanel; 