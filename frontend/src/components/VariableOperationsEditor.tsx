import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Button,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { VariableOperation } from '../types/node.types';

interface VariableOperationsEditorProps {
  operations: VariableOperation[];
  onChange: (operations: VariableOperation[]) => void;
  showTitle?: boolean;
}

const VariableOperationsEditor: React.FC<VariableOperationsEditorProps> = ({
  operations = [],
  onChange,
  showTitle = true,
}) => {
  const handleOperationChange = (index: number, field: keyof VariableOperation, value: any) => {
    const newOps = [...operations];
    newOps[index] = { ...newOps[index], [field]: value };
    onChange(newOps);
  };

  const handleAddOperation = () => {
    onChange([
      ...operations,
      { action: 'set', key: '', value: '', type: 'string' }
    ]);
  };

  const handleDeleteOperation = (index: number) => {
    onChange(operations.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ mt: 2 }}>
      {showTitle && (
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Variable Operations</Typography>
      )}
      <Stack spacing={2}>
        {operations.map((op, index) => (
          <Box
            key={index}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl sx={{ width: 150 }} size="small">
                <InputLabel>Action</InputLabel>
                <Select
                  value={op.action}
                  label="Action"
                  onChange={(e) => handleOperationChange(index, 'action', e.target.value)}
                >
                  <MenuItem value="set">Set</MenuItem>
                  <MenuItem value="update">Update</MenuItem>
                  <MenuItem value="delete">Delete</MenuItem>
                  <MenuItem value="increment">Increment</MenuItem>
                  <MenuItem value="decrement">Decrement</MenuItem>
                  <MenuItem value="concat">Concatenate</MenuItem>
                  <MenuItem value="clear">Clear</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Variable Key"
                value={op.key}
                onChange={(e) => handleOperationChange(index, 'key', e.target.value)}
                size="small"
                sx={{ flexGrow: 1 }}
              />

              {op.action !== 'delete' && op.action !== 'clear' && (
                <>
                  <TextField
                    label="Value"
                    value={String(op.value || '')}
                    onChange={(e) => handleOperationChange(index, 'value', e.target.value)}
                    size="small"
                    sx={{ flexGrow: 1 }}
                  />

                  <FormControl sx={{ width: 150 }} size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={op.type || 'string'}
                      label="Type"
                      onChange={(e) => handleOperationChange(index, 'type', e.target.value)}
                    >
                      <MenuItem value="string">String</MenuItem>
                      <MenuItem value="number">Number</MenuItem>
                      <MenuItem value="boolean">Boolean</MenuItem>
                      <MenuItem value="json">JSON</MenuItem>
                      <MenuItem value="array">Array</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              <IconButton
                onClick={() => handleDeleteOperation(index)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Box>
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddOperation}
          sx={{ mt: 1 }}
        >
          Add Operation
        </Button>
      </Stack>
    </Box>
  );
};

export default VariableOperationsEditor; 