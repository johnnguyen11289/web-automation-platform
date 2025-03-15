import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  IconButton,
  Stack,
  TextField,
  Divider,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { VariableOperation, VariableManagerNodeProperties } from '../../../types/node.types';

interface VariableManagerNodeProps {
  properties: VariableManagerNodeProperties;
  onChange: (properties: VariableManagerNodeProperties) => void;
}

const emptyOperation: VariableOperation = {
  action: 'set',
  key: '',
  value: '',
  type: 'string'
};

export const VariableManagerNode: React.FC<VariableManagerNodeProps> = ({ properties, onChange }) => {
  const [showInitialValues, setShowInitialValues] = useState(!!properties.initializeWith);

  const handleOperationChange = (index: number, field: keyof VariableOperation, value: any) => {
    const newOperations = [...properties.operations];
    newOperations[index] = { ...newOperations[index], [field]: value };
    onChange({ ...properties, operations: newOperations });
  };

  const addOperation = () => {
    onChange({
      ...properties,
      operations: [...properties.operations, { ...emptyOperation }]
    });
  };

  const removeOperation = (index: number) => {
    const newOperations = properties.operations.filter((_, i) => i !== index);
    onChange({ ...properties, operations: newOperations });
  };

  const handleInitialValueChange = (key: string, value: any) => {
    onChange({
      ...properties,
      initializeWith: {
        ...properties.initializeWith,
        [key]: value
      }
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Basic Settings */}
        <FormControl fullWidth>
          <InputLabel id="scope-label">Scope</InputLabel>
          <Select
            labelId="scope-label"
            label="Scope"
            value={properties.scope || 'local'}
            onChange={(e) => onChange({ ...properties, scope: e.target.value as 'local' | 'global' | 'flow' })}
          >
            <MenuItem value="local">Local</MenuItem>
            <MenuItem value="global">Global</MenuItem>
            <MenuItem value="flow">Flow</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={properties.persist}
              onChange={(e) => onChange({ ...properties, persist: e.target.checked })}
            />
          }
          label="Persist Variables"
        />

        <Divider />

        {/* Variable Operations */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Operations
          </Typography>
          <Stack spacing={2}>
            {properties.operations.map((op, index) => (
              <Box key={index} sx={{ p: 2, border: 1, borderRadius: 1, borderColor: 'divider' }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel id={`action-label-${index}`}>Action</InputLabel>
                    <Select
                      labelId={`action-label-${index}`}
                      label="Action"
                      value={op.action}
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

                  <FormControl sx={{ flex: 1 }}>
                    <TextField
                      label="Variable Key"
                      value={op.key}
                      onChange={(e) => handleOperationChange(index, 'key', e.target.value)}
                      placeholder="Enter variable name"
                      size="small"
                    />
                  </FormControl>

                  {op.action !== 'delete' && op.action !== 'clear' && (
                    <>
                      <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel id={`type-label-${index}`}>Type</InputLabel>
                        <Select
                          labelId={`type-label-${index}`}
                          label="Type"
                          value={op.type || 'string'}
                          onChange={(e) => handleOperationChange(index, 'type', e.target.value)}
                        >
                          <MenuItem value="string">String</MenuItem>
                          <MenuItem value="number">Number</MenuItem>
                          <MenuItem value="boolean">Boolean</MenuItem>
                          <MenuItem value="json">JSON</MenuItem>
                          <MenuItem value="array">Array</MenuItem>
                        </Select>
                      </FormControl>

                      {!['increment', 'decrement'].includes(op.action) && (
                        <FormControl sx={{ flex: 1 }}>
                          {op.type === 'json' ? (
                            <TextField
                              label="Value"
                              value={op.value as string}
                              onChange={(e) => handleOperationChange(index, 'value', e.target.value)}
                              placeholder="Enter JSON value"
                              multiline
                              rows={3}
                              size="small"
                            />
                          ) : (
                            <TextField
                              label="Value"
                              value={op.value as string}
                              onChange={(e) => handleOperationChange(index, 'value', e.target.value)}
                              placeholder="Enter value"
                              type={op.type === 'number' ? 'number' : 'text'}
                              size="small"
                            />
                          )}
                        </FormControl>
                      )}
                    </>
                  )}

                  <IconButton
                    onClick={() => removeOperation(index)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>

                {op.action === 'update' && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <TextField
                      label="Expression"
                      value={op.expression || ''}
                      onChange={(e) => handleOperationChange(index, 'expression', e.target.value)}
                      placeholder="JavaScript expression (e.g., `${value} + 1`)"
                      multiline
                      rows={2}
                      size="small"
                    />
                  </FormControl>
                )}
              </Box>
            ))}
          </Stack>

          <Button
            startIcon={<AddIcon />}
            onClick={addOperation}
            sx={{ mt: 2 }}
            variant="outlined"
            color="primary"
          >
            Add Operation
          </Button>
        </Box>

        <Divider />

        {/* Initial Values */}
        <FormControlLabel
          control={
            <Switch
              checked={showInitialValues}
              onChange={(e) => {
                setShowInitialValues(e.target.checked);
                if (!e.target.checked) {
                  onChange({ ...properties, initializeWith: undefined });
                } else {
                  onChange({ ...properties, initializeWith: {} });
                }
              }}
            />
          }
          label="Set Initial Values"
        />

        {showInitialValues && (
          <Box>
            <Stack spacing={2}>
              {Object.entries(properties.initializeWith || {}).map(([key, value]) => (
                <Stack key={key} direction="row" spacing={2} alignItems="flex-start">
                  <FormControl sx={{ flex: 1 }}>
                    <TextField
                      label="Key"
                      value={key}
                      disabled
                      size="small"
                    />
                  </FormControl>
                  <FormControl sx={{ flex: 1 }}>
                    <TextField
                      label="Initial Value"
                      value={value}
                      onChange={(e) => handleInitialValueChange(key, e.target.value)}
                      size="small"
                    />
                  </FormControl>
                  <IconButton
                    onClick={() => {
                      const newInitialValues = { ...properties.initializeWith };
                      delete newInitialValues[key];
                      onChange({ ...properties, initializeWith: newInitialValues });
                    }}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  const key = `variable${Object.keys(properties.initializeWith || {}).length + 1}`;
                  handleInitialValueChange(key, '');
                }}
                variant="outlined"
                color="primary"
              >
                Add Initial Value
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default VariableManagerNode; 