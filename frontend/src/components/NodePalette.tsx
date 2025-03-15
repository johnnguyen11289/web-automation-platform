import React from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Language as OpenUrlIcon,
  TouchApp as ClickIcon,
  Keyboard as TypeIcon,
  Send as SubmitIcon,
  Timer as WaitIcon,
  CompareArrows as ConditionIcon,
  Loop as LoopIcon,
  Download as ExtractIcon,
  Code as EvaluateIcon,
  Keyboard as KeyboardIcon,
  CenterFocusStrong as FocusIcon,
  Mouse as HoverIcon,
  Screenshot as ScreenshotIcon,
  CompareArrows as ScrollIcon,
  PictureInPicture as IframeIcon,
  Warning as AlertIcon,
  Cookie as CookieIcon,
  Storage as StorageIcon,
  Upload as FileUploadIcon,
  DragIndicator as DragDropIcon,
  NetworkCheck as NetworkIcon,
  AccountBalanceWallet as WalletIcon,
  DataObject as VariableIcon,
  RecordVoiceOver as VoiceIcon,
  VideoSettings as VideoIcon,
} from '@mui/icons-material';
import './NodePalette.css';

const nodeGroups = [
  {
    name: 'Navigation',
    nodes: [
      { type: 'openUrl', label: 'Open URL', color: '#e3f2fd', icon: OpenUrlIcon },
      { type: 'wait', label: 'Wait', color: '#fce4ec', icon: WaitIcon },
      { type: 'scroll', label: 'Scroll', color: '#f1f8e9', icon: ScrollIcon },
      { type: 'iframe', label: 'Iframe', color: '#e0f2f1', icon: IframeIcon },
    ]
  },
  {
    name: 'Interaction',
    nodes: [
      { type: 'click', label: 'Click', color: '#f3e5f5', icon: ClickIcon },
      { type: 'type', label: 'Type', color: '#e8f5e9', icon: TypeIcon },
      { type: 'select', label: 'Select', color: '#fff3e0', icon: SubmitIcon },
      { type: 'focus', label: 'Focus', color: '#fff3e0', icon: FocusIcon },
      { type: 'hover', label: 'Hover', color: '#fce4ec', icon: HoverIcon },
      { type: 'keyboard', label: 'Keyboard', color: '#e8f5e9', icon: KeyboardIcon },
      { type: 'dragDrop', label: 'Drag & Drop', color: '#e8eaf6', icon: DragDropIcon },
      { type: 'fileUpload', label: 'File Upload', color: '#fce4ec', icon: FileUploadIcon },
    ]
  },
  {
    name: 'Data Extraction',
    nodes: [
      { type: 'extract', label: 'Extract', color: '#e0f2f1', icon: ExtractIcon },
      { type: 'evaluate', label: 'Evaluate', color: '#f3e5f5', icon: EvaluateIcon },
      { type: 'screenshot', label: 'Screenshot', color: '#e8eaf6', icon: ScreenshotIcon },
    ]
  },
  {
    name: 'Browser Management',
    nodes: [
      { type: 'cookie', label: 'Cookie', color: '#e8f5e9', icon: CookieIcon },
      { type: 'storage', label: 'Storage', color: '#fff3e0', icon: StorageIcon },
      { type: 'network', label: 'Network', color: '#f1f8e9', icon: NetworkIcon },
      { type: 'alert', label: 'Alert', color: '#f3e5f5', icon: AlertIcon },
    ]
  },
  {
    name: 'Wallet Operations',
    nodes: [
      { type: 'walletConnect', label: 'Wallet Connect', color: '#e0f2f1', icon: WalletIcon },
      { type: 'walletSign', label: 'Wallet Sign', color: '#f3e5f5', icon: WalletIcon },
      { type: 'walletSend', label: 'Wallet Send', color: '#e8f5e9', icon: WalletIcon },
      { type: 'walletBalance', label: 'Wallet Balance', color: '#fff3e0', icon: WalletIcon },
      { type: 'walletApprove', label: 'Wallet Approve', color: '#fce4ec', icon: WalletIcon },
      { type: 'walletSwitch', label: 'Wallet Switch', color: '#e8eaf6', icon: WalletIcon },
    ]
  },
  {
    name: 'Flow Control',
    nodes: [
      { type: 'condition', label: 'Condition', color: '#e8eaf6', icon: ConditionIcon },
      { type: 'loop', label: 'Loop', color: '#f1f8e9', icon: LoopIcon },
      { type: 'variableManager', label: 'Variable Manager', color: '#e0f2f1', icon: VariableIcon },
    ]
  },
  {
    name: 'Media Operations',
    nodes: [
      { type: 'subtitleToVoice', label: 'Subtitle to Voice', color: '#e8f5e9', icon: VoiceIcon },
      { type: 'editVideo', label: 'Edit Video', color: '#fff3e0', icon: VideoIcon },
    ]
  }
];

const NodePalette: React.FC = () => {
  const theme = useTheme();
  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fafafa',
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary,
            fontSize: '1.1rem',
          }}
        >
          Node Palette
        </Typography>
      </Box>
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        p: 1,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '3px',
        },
      }}>
        {nodeGroups.map((group) => (
          <Accordion 
            key={group.name} 
            defaultExpanded
            sx={{
              '&:before': {
                display: 'none',
              },
              boxShadow: 'none',
              border: 'none',
              '&.MuiAccordion-root': {
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                minHeight: '40px !important',
                '& .MuiAccordionSummary-content': {
                  margin: '8px 0',
                },
                bgcolor: theme.palette.background.paper,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '0.9rem',
                }}
              >
                {group.name}
              </Typography>
            </AccordionSummary>
            <AccordionDetails 
              sx={{ 
                p: 1,
                bgcolor: theme.palette.background.default,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {group.nodes.map((node) => {
                  const Icon = node.icon;
                  return (
                    <div
                      key={node.type}
                      className="node-palette-item"
                      draggable
                      onDragStart={(e) => handleDragStart(e, node.type)}
                      style={{ 
                        backgroundColor: node.color,
                        transition: 'all 0.2s ease',
                        cursor: 'grab',
                      }}
                    >
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          p: 1,
                          borderRadius: '4px',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Icon 
                          sx={{ 
                            fontSize: 18, 
                            color: 'rgba(0, 0, 0, 0.54)',
                            transition: 'transform 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                            },
                          }} 
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500,
                            color: 'rgba(0, 0, 0, 0.87)',
                            fontSize: '0.85rem',
                          }}
                        >
                          {node.label}
                        </Typography>
                      </Box>
                    </div>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Paper>
  );
};

export default NodePalette; 