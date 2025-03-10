import React from 'react';
import { Box, List, ListItem, ListItemText, IconButton, Typography, Paper } from '@mui/material';
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
        <List>
          {workflows.map((workflow) => (
            <ListItem
              key={workflow._id}
              secondaryAction={
                <Box>
                  <IconButton
                    edge="end"
                    aria-label="execute"
                    onClick={() => onExecute(workflow)}
                    color="primary"
                  >
                    <PlayArrow />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => onEdit(workflow)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => onDelete(workflow._id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={workflow.name}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {workflow.description}
                    </Typography>
                    <br />
                    <Typography component="span" variant="caption" color="text.secondary">
                      Created: {new Date(workflow.createdAt).toLocaleDateString()}
                    </Typography>
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

export default WorkflowList; 