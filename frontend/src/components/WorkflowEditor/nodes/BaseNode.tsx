import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Paper, Typography, Box, IconButton } from '@mui/material';
import { Settings } from '@mui/icons-material';
import { NodeDataBase } from './types';

interface BaseNodeProps extends NodeProps<NodeDataBase> {
  color: string;
  onSettingsClick?: () => void;
  children?: React.ReactNode;
}

const BaseNode: React.FC<BaseNodeProps> = ({ 
  data, 
  color, 
  onSettingsClick,
  children 
}) => {
  return (
    <Paper
      elevation={2}
      sx={{
        padding: 1,
        minWidth: 200,
        borderLeft: 4,
        borderColor: color,
        backgroundColor: 'background.paper',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" color="text.secondary">
            {data.type}
          </Typography>
          {onSettingsClick && (
            <IconButton 
              size="small" 
              onClick={onSettingsClick}
              sx={{ marginLeft: 1 }}
            >
              <Settings fontSize="small" />
            </IconButton>
          )}
        </Box>
        <Typography variant="body2" gutterBottom>
          {data.label}
        </Typography>
        {children}
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </Paper>
  );
};

export default memo(BaseNode); 