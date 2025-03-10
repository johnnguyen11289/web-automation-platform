import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
} from '@mui/material';
import {
  Mouse,
  Keyboard,
  Send,
  Timer,
  CallSplit,
  Loop,
  Extension,
  Code,
  ContentCopy,
  AccountCircle,
  Language,
} from '@mui/icons-material';
import { NODE_COLORS } from './nodes/nodeFactory';

interface ActionType {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const actionTypes: ActionType[] = [
  {
    type: 'openUrl',
    label: 'Open URL',
    icon: <Language />,
    description: 'Navigate to a URL',
    color: NODE_COLORS.openUrl,
  },
  {
    type: 'click',
    label: 'Click',
    icon: <Mouse />,
    description: 'Click on an element',
    color: NODE_COLORS.click,
  },
  {
    type: 'input',
    label: 'Input',
    icon: <Keyboard />,
    description: 'Enter text into a field',
    color: NODE_COLORS.input,
  },
  {
    type: 'submit',
    label: 'Submit',
    icon: <Send />,
    description: 'Submit a form',
    color: NODE_COLORS.submit,
  },
  {
    type: 'wait',
    label: 'Wait',
    icon: <Timer />,
    description: 'Add delay or wait for element',
    color: NODE_COLORS.wait,
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: <CallSplit />,
    description: 'Add if-else logic',
    color: NODE_COLORS.condition,
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: <Loop />,
    description: 'Repeat actions',
    color: NODE_COLORS.loop,
  },
  {
    type: 'extension',
    label: 'Extension',
    icon: <Extension />,
    description: 'Use browser extension',
    color: NODE_COLORS.extension,
  },
  {
    type: 'variable',
    label: 'Variable',
    icon: <Code />,
    description: 'Store and manage data',
    color: NODE_COLORS.variable,
  },
  {
    type: 'extract',
    label: 'Extract',
    icon: <ContentCopy />,
    description: 'Extract data from page',
    color: NODE_COLORS.extract,
  },
  {
    type: 'profile',
    label: 'Profile',
    icon: <AccountCircle />,
    description: 'Select browser profile',
    color: NODE_COLORS.profile,
  },
];

const ToolboxPanel: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Paper
      elevation={2}
      sx={{
        width: 280,
        overflow: 'auto',
      }}
    >
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Actions
        </Typography>
        <List>
          {actionTypes.map((action) => (
            <ListItem
              key={action.type}
              draggable
              onDragStart={(e) => onDragStart(e, action.type)}
              sx={{
                cursor: 'grab',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                borderLeft: 3,
                borderColor: action.color,
                mb: 1,
              }}
            >
              <ListItemIcon sx={{ color: action.color }}>
                {action.icon}
              </ListItemIcon>
              <ListItemText
                primary={action.label}
                secondary={action.description}
                primaryTypographyProps={{
                  variant: 'subtitle2',
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
};

export default ToolboxPanel; 