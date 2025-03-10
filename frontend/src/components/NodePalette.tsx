import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import './NodePalette.css';

const nodeTypes = [
  { type: 'openUrl', label: 'Open URL', color: '#e3f2fd' },
  { type: 'click', label: 'Click', color: '#f3e5f5' },
  { type: 'input', label: 'Input', color: '#e8f5e9' },
  { type: 'submit', label: 'Submit', color: '#fff3e0' },
  { type: 'wait', label: 'Wait', color: '#fce4ec' },
  { type: 'condition', label: 'Condition', color: '#e8eaf6' },
  { type: 'loop', label: 'Loop', color: '#f1f8e9' },
  { type: 'extract', label: 'Extract', color: '#e0f2f1' },
  { type: 'profile', label: 'Profile', color: '#f3e5f5' },
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
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            className="node-palette-item"
            draggable
            onDragStart={(e) => handleDragStart(e, node.type)}
            style={{ backgroundColor: node.color }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {node.label}
            </Typography>
          </div>
        ))}
      </Box>
    </Paper>
  );
};

export default NodePalette; 