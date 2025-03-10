import React, { useState } from 'react';
import { Box, List, ListItem, ListItemText, IconButton, Typography, Paper, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);

  const handleDeleteClick = (workflow: Workflow) => {
    setWorkflowToDelete(workflow);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (workflowToDelete) {
      onDelete(workflowToDelete._id);
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setWorkflowToDelete(null);
  };

  return (
    <Paper elevation={2}>
      <Box p={1}>
        <Typography variant="h6" gutterBottom>
          Workflows
        </Typography>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {workflows.map((workflow) => (
            <ListItem
              key={workflow._id}
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                  <Tooltip title="Execute Workflow">
                    <IconButton
                      edge="end"
                      aria-label="execute"
                      onClick={() => onExecute(workflow)}
                      size="small"
                      sx={{
                        color: 'success.main',
                        '&:hover': {
                          backgroundColor: 'success.light',
                          color: 'white',
                        },
                        padding: 0.25,
                      }}
                    >
                      <PlayArrow fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Workflow">
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => onEdit(workflow)}
                      size="small"
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          color: 'white',
                        },
                        padding: 0.25,
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Workflow">
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteClick(workflow)}
                      size="small"
                      sx={{
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'white',
                        },
                        padding: 0.25,
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              sx={{
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.main',
                  boxShadow: 1,
                },
                transition: 'all 0.2s ease-in-out',
                py: 0.5,
                px: 1,
                minHeight: '36px',
                width: '100%',
              }}
            >
              <ListItemText
                primary={
                  <Tooltip title={workflow.name} placement="top">
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 'calc(100% - 120px)',
                        mb: 0.5
                      }}
                    >
                      {workflow.name}
                    </Typography>
                  </Tooltip>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, lineHeight: 1 }}>
                    <Tooltip title={workflow.description} placement="top">
                      <Typography 
                        component="span" 
                        variant="caption" 
                        color="text.primary" 
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 'calc(100% - 160px)',
                          display: 'block'
                        }}
                      >
                        {workflow.description}
                      </Typography>
                    </Tooltip>
                    <Typography 
                      component="span" 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        minWidth: 'fit-content'
                      }}
                    >
                      {new Date(workflow.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
                sx={{ 
                  m: 0, 
                  minWidth: 0, 
                  py: 0,
                  '& .MuiListItemText-primary': {
                    pr: 0
                  },
                  '& .MuiListItemText-secondary': {
                    pr: 0
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 600 }}>
          Delete Workflow
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the workflow{' '}
            <Typography
              component="span"
              sx={{
                fontWeight: 600,
                color: 'error.main',
              }}
            >
              "{workflowToDelete?.name}"
            </Typography>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default WorkflowList; 