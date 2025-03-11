import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
  Grid,
  Divider,
  Tooltip,
} from '@mui/material';
import { Edit, Delete, Add, ContentCopy, Launch } from '@mui/icons-material';
import { BrowserProfile, BrowserType, BROWSER_TYPES, DEFAULT_VIEWPORT } from '../../types/browser.types';
import { api } from '../../services/api';

interface BrowserProfileManagerProps {
  profiles: BrowserProfile[];
  onAdd: (profile: Omit<BrowserProfile, '_id' | 'createdAt' | 'updatedAt'>) => void;
  onEdit: (_id: string, profile: Partial<BrowserProfile>) => void;
  onDelete: (_id: string) => void;
  onDuplicate: (_id: string) => void;
}

const BrowserProfileManager: React.FC<BrowserProfileManagerProps> = ({
  profiles,
  onAdd,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<BrowserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<BrowserProfile | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BrowserProfile>>({
    name: '',
    browserType: 'chromium',
    userAgent: '',
    cookies: [],
    localStorage: {},
    sessionStorage: {},
    viewport: DEFAULT_VIEWPORT,
    isHeadless: false,
  });

  const handleOpenDialog = (profile?: BrowserProfile) => {
    if (profile) {
      setEditingProfile(profile);
      setFormData(profile);
    } else {
      setEditingProfile(null);
      setFormData({
        name: '',
        browserType: 'chromium',
        userAgent: '',
        cookies: [],
        localStorage: {},
        sessionStorage: {},
        viewport: DEFAULT_VIEWPORT,
        isHeadless: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProfile(null);
    setFormData({});
  };

  const handleOpenDeleteDialog = (profile: BrowserProfile) => {
    setProfileToDelete(profile);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProfileToDelete(null);
  };

  const handleSubmit = () => {
    if (editingProfile) {
      onEdit(editingProfile._id, formData);
    } else {
      onAdd(formData as Omit<BrowserProfile, '_id' | 'createdAt' | 'updatedAt'>);
    }
    handleCloseDialog();
  };

  const handleDelete = () => {
    if (profileToDelete) {
      onDelete(profileToDelete._id);
      handleCloseDeleteDialog();
    }
  };

  const handleOpenBrowser = async (profile: BrowserProfile) => {
    try {
      setLoading(profile._id);
      setError(null);
      await api.openBrowserProfile(profile._id);
    } catch (error) {
      console.error('Error opening browser:', error);
      setError(error instanceof Error ? error.message : 'Failed to open browser');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Browser Profiles</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Profile
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Paper elevation={2}>
        <List>
          {profiles.map((profile) => (
            <React.Fragment key={profile._id}>
              <ListItem>
                <ListItemText
                  primary={profile.name}
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {BROWSER_TYPES.find(t => t.value === profile.browserType)?.label} •{' '}
                      {profile.isHeadless ? 'Headless' : 'Visible'} •{' '}
                      {profile.viewport.width}x{profile.viewport.height}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Open Browser">
                    <IconButton
                      edge="end"
                      aria-label="open browser"
                      onClick={() => handleOpenBrowser(profile)}
                      disabled={loading === profile._id}
                      sx={{ mr: 1 }}
                    >
                      <Launch />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    edge="end"
                    aria-label="duplicate"
                    onClick={() => onDuplicate(profile._id)}
                    sx={{ mr: 1 }}
                  >
                    <ContentCopy />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleOpenDialog(profile)}
                    sx={{ mr: 1 }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleOpenDeleteDialog(profile)}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProfile ? 'Edit Profile' : 'Add New Profile'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Profile Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Browser Type</InputLabel>
                <Select
                  value={formData.browserType || 'chromium'}
                  label="Browser Type"
                  onChange={(e) => setFormData({ ...formData, browserType: e.target.value as BrowserType })}
                >
                  {BROWSER_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="User Agent"
                value={formData.userAgent || ''}
                onChange={(e) => setFormData({ ...formData, userAgent: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isHeadless || false}
                    onChange={(e) => setFormData({ ...formData, isHeadless: e.target.checked })}
                  />
                }
                label="Headless Mode"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Proxy Settings</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Proxy Host"
                    value={formData.proxy?.host || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      proxy: {
                        host: e.target.value,
                        port: formData.proxy?.port || 8080,
                        username: formData.proxy?.username || '',
                        password: formData.proxy?.password || ''
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Proxy Port"
                    type="number"
                    value={formData.proxy?.port || 8080}
                    onChange={(e) => setFormData({
                      ...formData,
                      proxy: {
                        host: formData.proxy?.host || '',
                        port: parseInt(e.target.value) || 8080,
                        username: formData.proxy?.username || '',
                        password: formData.proxy?.password || ''
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={formData.proxy?.username || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      proxy: {
                        host: formData.proxy?.host || '',
                        port: formData.proxy?.port || 8080,
                        username: e.target.value,
                        password: formData.proxy?.password || ''
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.proxy?.password || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      proxy: {
                        host: formData.proxy?.host || '',
                        port: formData.proxy?.port || 8080,
                        username: formData.proxy?.username || '',
                        password: e.target.value
                      }
                    })}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Viewport Width"
                value={formData.viewport?.width || DEFAULT_VIEWPORT.width}
                onChange={(e) => setFormData({
                  ...formData,
                  viewport: {
                    ...DEFAULT_VIEWPORT,
                    ...formData.viewport,
                    width: parseInt(e.target.value) || DEFAULT_VIEWPORT.width
                  }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Viewport Height"
                value={formData.viewport?.height || DEFAULT_VIEWPORT.height}
                onChange={(e) => setFormData({
                  ...formData,
                  viewport: {
                    ...DEFAULT_VIEWPORT,
                    ...formData.viewport,
                    height: parseInt(e.target.value) || DEFAULT_VIEWPORT.height
                  }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Startup Script (Optional)"
                value={formData.startupScript || ''}
                onChange={(e) => setFormData({ ...formData, startupScript: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProfile ? 'Save Changes' : 'Create Profile'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          Delete Profile
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the profile "<Box component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>{profileToDelete?.name}</Box>"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrowserProfileManager; 