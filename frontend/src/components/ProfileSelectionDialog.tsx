import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { BrowserProfile } from '../types/browser.types';

interface ProfileSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  profiles: BrowserProfile[];
  onSelect: (profile: BrowserProfile) => void;
}

const ProfileSelectionDialog: React.FC<ProfileSelectionDialogProps> = ({
  open,
  onClose,
  profiles,
  onSelect,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Browser Profile for Recording</DialogTitle>
      <DialogContent>
        <List>
          {profiles.map((profile) => (
            <ListItem key={profile._id} divider>
              <ListItemText
                primary={profile.name}
                secondary={`${profile.browserType} - ${profile.proxy ? 'With Proxy' : 'No Proxy'}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  color="primary"
                  onClick={() => onSelect(profile)}
                  title="Use this profile"
                >
                  <PlayArrow />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileSelectionDialog; 