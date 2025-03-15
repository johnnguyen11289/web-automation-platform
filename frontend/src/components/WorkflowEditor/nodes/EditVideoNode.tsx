import React from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  IconButton,
  Typography,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { EditVideoNodeProperties } from '../../../types/node.types';

type OperationType = 'trim' | 'crop' | 'resize' | 'overlay' | 'merge' | 'addAudio' | 'speed' | 'filter';

interface Operation {
  type: OperationType;
  params: {
    start?: number;
    end?: number;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    path?: string;
    speed?: number;
    filter?: string;
    [key: string]: any;
  };
}

interface EditVideoNodeProps {
  properties: EditVideoNodeProperties;
  onChange: (properties: EditVideoNodeProperties) => void;
}

const defaultOperation: Operation = {
  type: 'trim',
  params: {
    start: 0,
    end: 0,
  },
};

export const EditVideoNode: React.FC<EditVideoNodeProps> = ({ properties, onChange }) => {
  const handleChange = (field: keyof EditVideoNodeProperties, value: any) => {
    onChange({ ...properties, [field]: value });
  };

  const handleOperationChange = (index: number, field: string, value: any) => {
    const newOperations = [...properties.operations];
    if (field === 'type') {
      newOperations[index] = { type: value, params: {} };
    } else {
      newOperations[index] = {
        ...newOperations[index],
        params: { ...newOperations[index].params, [field]: value },
      };
    }
    onChange({ ...properties, operations: newOperations });
  };

  const addOperation = () => {
    onChange({
      ...properties,
      operations: [...properties.operations, { ...defaultOperation }],
    });
  };

  const removeOperation = (index: number) => {
    const newOperations = properties.operations.filter((_, i) => i !== index);
    onChange({ ...properties, operations: newOperations });
  };

  const renderOperationParams = (operation: any, index: number) => {
    switch (operation.type) {
      case 'trim':
        return (
          <>
            <TextField
              fullWidth
              type="number"
              label="Start Time (seconds)"
              value={operation.params.start || 0}
              onChange={(e) => handleOperationChange(index, 'start', parseFloat(e.target.value))}
            />
            <TextField
              fullWidth
              type="number"
              label="End Time (seconds)"
              value={operation.params.end || 0}
              onChange={(e) => handleOperationChange(index, 'end', parseFloat(e.target.value))}
            />
          </>
        );
      case 'crop':
      case 'resize':
        return (
          <>
            <TextField
              fullWidth
              type="number"
              label="Width"
              value={operation.params.width || ''}
              onChange={(e) => handleOperationChange(index, 'width', parseInt(e.target.value))}
            />
            <TextField
              fullWidth
              type="number"
              label="Height"
              value={operation.params.height || ''}
              onChange={(e) => handleOperationChange(index, 'height', parseInt(e.target.value))}
            />
          </>
        );
      case 'overlay':
        return (
          <>
            <TextField
              fullWidth
              label="Overlay File Path"
              value={operation.params.path || ''}
              onChange={(e) => handleOperationChange(index, 'path', e.target.value)}
            />
            <TextField
              fullWidth
              type="number"
              label="X Position"
              value={operation.params.x || 0}
              onChange={(e) => handleOperationChange(index, 'x', parseInt(e.target.value))}
            />
            <TextField
              fullWidth
              type="number"
              label="Y Position"
              value={operation.params.y || 0}
              onChange={(e) => handleOperationChange(index, 'y', parseInt(e.target.value))}
            />
          </>
        );
      case 'speed':
        return (
          <TextField
            fullWidth
            type="number"
            label="Speed"
            value={operation.params.speed || 1.0}
            onChange={(e) => handleOperationChange(index, 'speed', parseFloat(e.target.value))}
            inputProps={{ step: 0.1, min: 0.1, max: 10.0 }}
          />
        );
      case 'filter':
        return (
          <TextField
            fullWidth
            label="Filter"
            value={operation.params.filter || ''}
            onChange={(e) => handleOperationChange(index, 'filter', e.target.value)}
            placeholder="Enter filter parameters"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <TextField
          fullWidth
          label="Input Path"
          value={properties.inputPath}
          onChange={(e) => handleChange('inputPath', e.target.value)}
          placeholder="Enter input video path"
          required
        />

        <TextField
          fullWidth
          label="Output Path"
          value={properties.outputPath || ''}
          onChange={(e) => handleChange('outputPath', e.target.value)}
          placeholder="Enter output video path"
        />

        <FormControl fullWidth>
          <InputLabel id="format-label">Format</InputLabel>
          <Select
            labelId="format-label"
            label="Format"
            value={properties.format || 'mp4'}
            onChange={(e) => handleChange('format', e.target.value)}
          >
            <MenuItem value="mp4">MP4</MenuItem>
            <MenuItem value="mov">MOV</MenuItem>
            <MenuItem value="avi">AVI</MenuItem>
            <MenuItem value="webm">WebM</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          type="number"
          label="Quality"
          value={properties.quality || 100}
          onChange={(e) => handleChange('quality', parseInt(e.target.value))}
          inputProps={{ min: 0, max: 100 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={properties.preserveAudio || false}
              onChange={(e) => handleChange('preserveAudio', e.target.checked)}
            />
          }
          label="Preserve Audio"
        />

        <TextField
          fullWidth
          label="Audio Track"
          value={properties.audioTrack || ''}
          onChange={(e) => handleChange('audioTrack', e.target.value)}
          placeholder="Enter custom audio track path"
        />

        <Divider />

        <Typography variant="subtitle1">Operations</Typography>
        {properties.operations.map((operation, index) => (
          <Box key={index} sx={{ p: 2, border: 1, borderRadius: 1, borderColor: 'divider' }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl fullWidth>
                  <InputLabel id={`operation-type-${index}`}>Operation Type</InputLabel>
                  <Select
                    labelId={`operation-type-${index}`}
                    label="Operation Type"
                    value={operation.type}
                    onChange={(e) => handleOperationChange(index, 'type', e.target.value)}
                  >
                    <MenuItem value="trim">Trim</MenuItem>
                    <MenuItem value="crop">Crop</MenuItem>
                    <MenuItem value="resize">Resize</MenuItem>
                    <MenuItem value="overlay">Overlay</MenuItem>
                    <MenuItem value="merge">Merge</MenuItem>
                    <MenuItem value="addAudio">Add Audio</MenuItem>
                    <MenuItem value="speed">Speed</MenuItem>
                    <MenuItem value="filter">Filter</MenuItem>
                  </Select>
                </FormControl>
                <IconButton onClick={() => removeOperation(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Stack>
              {renderOperationParams(operation, index)}
            </Stack>
          </Box>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={addOperation}
          variant="outlined"
          color="primary"
        >
          Add Operation
        </Button>
      </Stack>
    </Box>
  );
};

export default EditVideoNode; 