import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
} from '@mui/material';
import { VariableOperation, VariableType } from '../types/node.types';

interface VariableOperationsEditorProps {
  operations: VariableOperation[];
  onChange: (operations: VariableOperation[]) => void;
  showTitle?: boolean;
  availableVariables?: { key: string; type: VariableType; value: string | number | boolean | null }[];
}

const VariableOperationsEditor: React.FC<VariableOperationsEditorProps> = ({
  operations = [],
  onChange,
  showTitle = true,
  availableVariables = [],
}) => {
  const handleVariableSelect = (event: any) => {
    const selectedKeys = event.target.value as string[];
    const newOperations = selectedKeys.map(key => {
      // Try to find existing operation for this key
      const existingOp = operations.find(op => op.key === key);
      if (existingOp) {
        return existingOp;
      }
      // Create new operation for this key
      const variable = availableVariables.find(v => v.key === key);
      if (!variable) return null;
      return {
        action: 'set' as const,
        key,
        value: variable.value,
        type: variable.type
      } satisfies VariableOperation;
    }).filter((op): op is VariableOperation => op !== null);
    onChange(newOperations);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {showTitle && (
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Variable Operations</Typography>
      )}
      <FormControl fullWidth>
        <InputLabel id="variable-select-label">Select Variables</InputLabel>
        <Select
          labelId="variable-select-label"
          multiple
          value={operations.map(op => op.key)}
          onChange={handleVariableSelect}
          input={<OutlinedInput label="Select Variables" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((key) => {
                const variable = availableVariables.find(v => v.key === key);
                return (
                  <Chip 
                    key={key} 
                    label={`${key} = ${variable?.value}`} 
                    size="small"
                    sx={{ 
                      backgroundColor: '#e3f2fd',
                      '& .MuiChip-label': {
                        color: '#1976d2'
                      }
                    }}
                  />
                );
              })}
            </Box>
          )}
        >
          {availableVariables.map((variable) => (
            <MenuItem key={variable.key} value={variable.key}>
              {variable.key} = {variable.value} ({variable.type})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default VariableOperationsEditor; 