import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
} from '@mui/material';
import { SubtitleToVoiceNodeProperties } from '../../../types/node.types';

interface SubtitleToVoiceNodeProps {
  properties: SubtitleToVoiceNodeProperties;
  onChange: (properties: SubtitleToVoiceNodeProperties) => void;
}

export const SubtitleToVoiceNode: React.FC<SubtitleToVoiceNodeProps> = ({ properties, onChange }) => {
  const handleChange = (field: keyof SubtitleToVoiceNodeProperties, value: any) => {
    onChange({ ...properties, [field]: value });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <TextField
          fullWidth
          label="Subtitle File"
          value={properties.subtitleFile || ''}
          onChange={(e) => handleChange('subtitleFile', e.target.value)}
          placeholder="Enter subtitle file path"
        />

        <FormControl fullWidth>
          <InputLabel id="subtitle-format-label">Subtitle Format</InputLabel>
          <Select
            labelId="subtitle-format-label"
            label="Subtitle Format"
            value={properties.subtitleFormat || 'srt'}
            onChange={(e) => handleChange('subtitleFormat', e.target.value)}
          >
            <MenuItem value="srt">SRT</MenuItem>
            <MenuItem value="vtt">VTT</MenuItem>
            <MenuItem value="ass">ASS</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Language"
          value={properties.language}
          onChange={(e) => handleChange('language', e.target.value)}
          placeholder="Enter target language"
          required
        />

        <TextField
          fullWidth
          label="Voice"
          value={properties.voice || ''}
          onChange={(e) => handleChange('voice', e.target.value)}
          placeholder="Enter voice model/type"
        />

        <TextField
          fullWidth
          label="Output Path"
          value={properties.outputPath || ''}
          onChange={(e) => handleChange('outputPath', e.target.value)}
          placeholder="Enter output file path"
        />

        <TextField
          fullWidth
          type="number"
          label="Speed"
          value={properties.speed || 1.0}
          onChange={(e) => handleChange('speed', parseFloat(e.target.value))}
          inputProps={{ step: 0.1, min: 0.5, max: 2.0 }}
        />

        <TextField
          fullWidth
          type="number"
          label="Pitch"
          value={properties.pitch || 1.0}
          onChange={(e) => handleChange('pitch', parseFloat(e.target.value))}
          inputProps={{ step: 0.1, min: 0.5, max: 2.0 }}
        />

        <TextField
          fullWidth
          type="number"
          label="Volume"
          value={properties.volume || 1.0}
          onChange={(e) => handleChange('volume', parseFloat(e.target.value))}
          inputProps={{ step: 0.1, min: 0.0, max: 1.0 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={properties.splitByLine || false}
              onChange={(e) => handleChange('splitByLine', e.target.checked)}
            />
          }
          label="Split by Line"
        />

        <FormControlLabel
          control={
            <Switch
              checked={properties.preserveTimings || false}
              onChange={(e) => handleChange('preserveTimings', e.target.checked)}
            />
          }
          label="Preserve Timings"
        />
      </Stack>
    </Box>
  );
};

export default SubtitleToVoiceNode; 