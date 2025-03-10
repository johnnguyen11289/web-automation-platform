import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add, Edit, Delete, ContentCopy } from '@mui/icons-material';

interface Viewport {
  width: number;
  height: number;
}

interface BrowserProfile {
  id: string;
  name: string;
  userAgent: string;
  proxy?: string;
  cookies: { name: string; value: string; domain: string }[];
  viewport: Viewport;
  geolocation?: { latitude: number; longitude: number };
  isHeadless: boolean;
}

interface BrowserProfileManagerProps {
  profiles: BrowserProfile[];
  onAdd: (profile: Omit<BrowserProfile, 'id'>) => void;
  onEdit: (profile: BrowserProfile) => void;
  onDelete: (profileId: string) => void;
  onDuplicate: (profileId: string) => void;
}

const defaultViewport: Viewport = {
  width: 1920,
  height: 1080,
};

const BrowserProfileManager: React.FC<BrowserProfileManagerProps> = ({
  profiles,
  onAdd,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BrowserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<BrowserProfile>>({
    name: '',
    userAgent: '',
    proxy: '',
    viewport: defaultViewport,
    isHeadless: true,
  });

  const handleOpenDialog = (profile?: BrowserProfile) => {
    if (profile) {
      setEditingProfile(profile);
      setFormData(profile);
    } else {
      setEditingProfile(null);
      setFormData({
        name: '',
        userAgent: '',
        proxy: '',
        viewport: defaultViewport,
        isHeadless: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProfile(null);
  };

  const handleSubmit = () => {
    if (editingProfile) {
      onEdit({ ...editingProfile, ...formData } as BrowserProfile);
    } else {
      onAdd(formData as Omit<BrowserProfile, 'id'>);
    }
    handleCloseDialog();
  };

  const handleViewportChange = (field: keyof Viewport, value: string) => {
    const numValue = Number(value) || 0;
    setFormData({
      ...formData,
      viewport: {
        ...(formData.viewport || defaultViewport),
        [field]: numValue,
      },
    });
  };

  return (
    <>
      <Paper elevation={2}>
        <Box p={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Browser Profiles</Typography>
            <Button
              startIcon={<Add />}
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog()}
            >
              New Profile
            </Button>
          </Box>

          <List>
            {profiles.map((profile) => (
              <ListItem
                key={profile.id}
                secondaryAction={
                  <Box>
                    <IconButton onClick={() => handleOpenDialog(profile)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => onDuplicate(profile.id)}>
                      <ContentCopy />
                    </IconButton>
                    <IconButton onClick={() => onDelete(profile.id)} color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={profile.name}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        {profile.userAgent}
                      </Typography>
                      <br />
                      {profile.proxy && (
                        <Typography component="span" variant="caption">
                          Proxy: {profile.proxy}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProfile ? 'Edit Browser Profile' : 'New Browser Profile'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Profile Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="User Agent"
              value={formData.userAgent}
              onChange={(e) => setFormData({ ...formData, userAgent: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Proxy (optional)"
              value={formData.proxy}
              onChange={(e) => setFormData({ ...formData, proxy: e.target.value })}
              margin="normal"
              placeholder="host:port"
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                label="Viewport Width"
                type="number"
                value={formData.viewport?.width ?? defaultViewport.width}
                onChange={(e) => handleViewportChange('width', e.target.value)}
              />
              <TextField
                label="Viewport Height"
                type="number"
                value={formData.viewport?.height ?? defaultViewport.height}
                onChange={(e) => handleViewportChange('height', e.target.value)}
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isHeadless}
                  onChange={(e) =>
                    setFormData({ ...formData, isHeadless: e.target.checked })
                  }
                />
              }
              label="Headless Mode"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingProfile ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BrowserProfileManager; 