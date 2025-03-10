import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Paper, Typography, Box } from '@mui/material';

interface ActionNodeData {
  label: string;
  type: string;
}

const ActionNode = ({ data }: NodeProps<ActionNodeData>) => {
  const getNodeColor = () => {
    switch (data.type) {
      case 'click':
        return '#2196f3';
      case 'type':
        return '#4caf50';
      case 'wait':
        return '#ff9800';
      case 'screenshot':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        padding: 1,
        minWidth: 150,
        borderLeft: 4,
        borderColor: getNodeColor(),
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          {data.type}
        </Typography>
        <Typography variant="body2">{data.label}</Typography>
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </Paper>
  );
};

export default memo(ActionNode); 