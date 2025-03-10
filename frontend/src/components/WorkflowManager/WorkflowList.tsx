import React from 'react';
import { Box, List, ListItem, ListItemText, IconButton, Typography, Paper, Tooltip } from '@mui/material';
import { PlayArrow, Edit, Delete } from '@mui/icons-material';
import { Workflow } from '../../services/api';

interface WorkflowListProps {
  workflows: Workflow[];
  onEdit: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
  onExecute: (workflow: Workflow) => void;
}

const WorkflowList: React.FC<WorkflowListProps> = ({
  workflows,
  onEdit,
  onDelete,
  onExecute,
}) => {
  return (
    <Paper elevation={2}>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Workflows
        </Typography>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {workflows.map((workflow) => (
            <ListItem
              key={workflow._id}
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Execute Workflow">
                    <IconButton
                      edge="end"
                      aria-label="execute"
                      onClick={() => onExecute(workflow)}
                      sx={{
                        color: 'success.main',
                        '&:hover': {
                          backgroundColor: 'success.light',
                          color: 'white',
                        },
                      }}
                    >
                      <PlayArrow />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Workflow">
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => onEdit(workflow)}
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          color: 'white',
                        },
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Workflow">
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => onDelete(workflow._id)}
                      sx={{
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'white',
                        },
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              sx={{
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.main',
                  boxShadow: 1,
                },
                transition: 'all 0.2s ease-in-out',
                p: 2,
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                    {workflow.name}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography component="span" variant="body2" color="text.primary">
                      {workflow.description}
                    </Typography>
                    <Typography component="span" variant="caption" color="text.secondary">
                      Created: {new Date(workflow.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
};

export default WorkflowList; 