import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import {
  Language as OpenUrlIcon,
  TouchApp as ClickIcon,
  Keyboard as InputIcon,
  Send as SubmitIcon,
  Timer as WaitIcon,
  CompareArrows as ConditionIcon,
  Loop as LoopIcon,
  Download as ExtractIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';
import './NodePalette.css';

const nodeTypes = [
  { type: 'openUrl', label: 'Open URL', color: '#e3f2fd', icon: OpenUrlIcon },
  { type: 'click', label: 'Click', color: '#f3e5f5', icon: ClickIcon },
  { type: 'input', label: 'Input', color: '#e8f5e9', icon: InputIcon },
  { type: 'submit', label: 'Submit', color: '#fff3e0', icon: SubmitIcon },
  { type: 'wait', label: 'Wait', color: '#fce4ec', icon: WaitIcon },
  { type: 'condition', label: 'Condition', color: '#e8eaf6', icon: ConditionIcon },
  { type: 'loop', label: 'Loop', color: '#f1f8e9', icon: LoopIcon },
  { type: 'extract', label: 'Extract', color: '#e0f2f1', icon: ExtractIcon },
  { type: 'profile', label: 'Profile', color: '#f3e5f5', icon: ProfileIcon },
];

const NodePalette: React.FC = () => {
  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fafafa'
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight="medium">
          Nodes
        </Typography>
      </Box>
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        p: 1,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '3px',
        },
      }}>
        {nodeTypes.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.type}
              className="node-palette-item"
              draggable
              onDragStart={(e) => handleDragStart(e, node.type)}
              style={{ backgroundColor: node.color }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon sx={{ fontSize: 18, color: 'rgba(0, 0, 0, 0.54)' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {node.label}
                </Typography>
              </Box>
            </div>
          );
        })}
      </Box>
    </Paper>
  );
};

export default NodePalette; 