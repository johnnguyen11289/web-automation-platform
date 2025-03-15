import React, { useEffect, useState } from 'react';
import { NodeProperties, VariableType } from '../types/node.types';
import './NodePropertiesEditor.css';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Stack,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VariableOperationsEditor from './VariableOperationsEditor';

interface NodePropertiesEditorProps {
  node: NodeProperties;
  onUpdate: (updatedNode: NodeProperties) => void;
  onClose: () => void;
  availableVariables?: { key: string; type: VariableType; value: string | number | boolean | null }[];
}

type VariableAction = 'set' | 'update' | 'delete' | 'increment' | 'decrement' | 'concat' | 'clear';
type VideoOperationType = 'trim' | 'crop' | 'resize' | 'overlay' | 'merge' | 'addAudio' | 'speed' | 'filter';
type VariableValue = string | number | boolean | null;

const NodePropertiesEditor: React.FC<NodePropertiesEditorProps> = ({
  node,
  onUpdate,
  onClose,
  availableVariables = [],
}): JSX.Element => {
  const [properties, setProperties] = React.useState<NodeProperties>(node);

  const handleBasePropertyChange = (field: keyof NodeProperties, value: any) => {
    setProperties(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNodeSpecificChange = (field: string, value: any) => {
    setProperties(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(properties);
    onClose();
  };

  const shouldShowCommonProperties = () => {
    return properties.nodeType !== 'variableManager';
  };

  const renderCommonProperties = () => {
    if (!shouldShowCommonProperties()) return null;
    
    return (
      <div className="common-properties">
        <h3>Common Properties</h3>
        <div className="form-group">
          <label>Node Name:</label>
          <input
            type="text"
            value={properties.nodeName}
            onChange={(e) => handleBasePropertyChange('nodeName', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Timeout (ms):</label>
          <input
            type="number"
            value={properties.timeout}
            onChange={(e) => handleBasePropertyChange('timeout', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Stop on Error:</label>
          <input
            type="checkbox"
            checked={properties.stopOnError}
            onChange={(e) => handleBasePropertyChange('stopOnError', e.target.checked)}
          />
        </div>
      </div>
    );
  };

  const renderNodeSpecificProperties = () => {
    switch (properties.nodeType) {
      case 'openUrl':
        return (
          <div className="node-specific-properties">
            <h3>OpenURL Properties</h3>
            <div className="form-group">
              <label>URL:</label>
              <input
                type="text"
                value={properties.url}
                onChange={(e) => handleNodeSpecificChange('url', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="form-group">
              <label>Open in New Tab:</label>
              <input
                type="checkbox"
                checked={properties.openInNewTab}
                onChange={(e) => handleNodeSpecificChange('openInNewTab', e.target.checked)}
              />
            </div>
            <div className="form-group">
              <label>Wait Until:</label>
              <select
                value={properties.waitUntil}
                onChange={(e) => handleNodeSpecificChange('waitUntil', e.target.value)}
              >
                <option value="load">Load</option>
                <option value="domcontentloaded">DOM Content Loaded</option>
                <option value="networkidle">Network Idle</option>
                <option value="networkidle0">Network Idle (Strict)</option>
              </select>
            </div>
          </div>
        );

      case 'click':
        return (
          <div className="node-specific-properties">
            <h3>Click Properties</h3>
            <div className="form-group">
              <label>Selector:</label>
              <input
                type="text"
                value={properties.selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Button:</label>
              <select
                value={properties.button}
                onChange={(e) => handleNodeSpecificChange('button', e.target.value)}
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="middle">Middle</option>
              </select>
            </div>
            <div className="form-group">
              <label>Click Count:</label>
              <input
                type="number"
                value={properties.clickCount}
                onChange={(e) => handleNodeSpecificChange('clickCount', parseInt(e.target.value))}
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Delay (ms):</label>
              <input
                type="number"
                value={properties.delay}
                onChange={(e) => handleNodeSpecificChange('delay', parseInt(e.target.value))}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Wait for Navigation:</label>
              <input
                type="checkbox"
                checked={properties.waitForNavigation}
                onChange={(e) => handleNodeSpecificChange('waitForNavigation', e.target.checked)}
              />
            </div>
          </div>
        );

      case 'type':
        return (
          <div className="node-specific-properties">
            <h3>Type Properties</h3>
            <div className="form-group">
              <label>Selector:</label>
              <input
                type="text"
                value={properties.selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Value:</label>
              <input
                type="text"
                value={properties.value}
                onChange={(e) => handleNodeSpecificChange('value', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Clear First:</label>
              <input
                type="checkbox"
                checked={properties.clearFirst}
                onChange={(e) => handleNodeSpecificChange('clearFirst', e.target.checked)}
              />
            </div>
            <div className="form-group">
              <label>Delay (ms):</label>
              <input
                type="number"
                value={properties.delay}
                onChange={(e) => handleNodeSpecificChange('delay', parseInt(e.target.value))}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Press Enter:</label>
              <input
                type="checkbox"
                checked={properties.pressEnter}
                onChange={(e) => handleNodeSpecificChange('pressEnter', e.target.checked)}
              />
            </div>
            <VariableOperationsEditor
              operations={properties.variableOperations || []}
              onChange={(ops) => handleNodeSpecificChange('variableOperations', ops)}
              availableVariables={availableVariables}
            />
          </div>
        );

      case 'select':
        return (
          <div className="node-specific-properties">
            <h3>Select Properties</h3>
            <div className="form-group">
              <label>Selector:</label>
              <input
                type="text"
                value={properties.selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Value:</label>
              <input
                type="text"
                value={properties.value}
                onChange={(e) => handleNodeSpecificChange('value', e.target.value)}
              />
            </div>
            <VariableOperationsEditor
              operations={properties.variableOperations || []}
              onChange={(ops) => handleNodeSpecificChange('variableOperations', ops)}
              availableVariables={availableVariables}
            />
          </div>
        );

      case 'wait':
        return (
          <div className="node-specific-properties">
            <h3>Wait Properties</h3>
            <div className="form-group">
              <label>Condition:</label>
              <select
                value={properties.condition}
                onChange={(e) => handleNodeSpecificChange('condition', e.target.value)}
              >
                <option value="networkIdle">Network Idle</option>
                <option value="delay">Fixed Delay</option>
              </select>
            </div>
            {properties.condition === 'delay' && (
              <div className="form-group">
                <label>Delay (ms):</label>
                <input
                  type="number"
                  value={properties.delay}
                  onChange={(e) => handleNodeSpecificChange('delay', parseInt(e.target.value))}
                  min="0"
                />
              </div>
            )}
          </div>
        );

      case 'extract':
        return (
          <div className="node-specific-properties">
            <h3>Extract Properties</h3>
            <div className="form-group">
              <label>Selector:</label>
              <input
                type="text"
                value={properties.selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Attribute:</label>
              <input
                type="text"
                value={properties.attribute}
                onChange={(e) => handleNodeSpecificChange('attribute', e.target.value)}
                placeholder="textContent, href, etc."
              />
            </div>
            <div className="form-group">
              <label>Key:</label>
              <input
                type="text"
                value={properties.key}
                onChange={(e) => handleNodeSpecificChange('key', e.target.value)}
              />
            </div>
            <VariableOperationsEditor
              operations={properties.variableOperations || []}
              onChange={(ops) => handleNodeSpecificChange('variableOperations', ops)}
              availableVariables={availableVariables}
            />
          </div>
        );

      case 'evaluate':
        return (
          <div className="node-specific-properties">
            <h3>Evaluate Properties</h3>
            <div className="form-group">
              <label>Script:</label>
              <textarea
                value={properties.script}
                onChange={(e) => handleNodeSpecificChange('script', e.target.value)}
                rows={5}
                placeholder="Enter JavaScript code..."
              />
            </div>
          </div>
        );

      case 'keyboard':
        return (
          <div className="node-specific-properties">
            <h3>Keyboard Properties</h3>
            <div className="form-group">
              <label>Key:</label>
              <input
                type="text"
                value={properties.key}
                onChange={(e) => handleNodeSpecificChange('key', e.target.value)}
                placeholder="Enter, Tab, etc."
              />
            </div>
          </div>
        );

      case 'focus':
        return (
          <div className="node-specific-properties">
            <h3>Focus Properties</h3>
            <div className="form-group">
              <label>Selector:</label>
              <input
                type="text"
                value={properties.selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
              />
            </div>
          </div>
        );

      case 'hover':
        return (
          <div className="node-specific-properties">
            <h3>Hover Properties</h3>
            <div className="form-group">
              <label>Selector:</label>
              <input
                type="text"
                value={properties.selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
              />
            </div>
          </div>
        );

      case 'screenshot':
        return (
          <div className="node-specific-properties">
            <h3>Screenshot Properties</h3>
            <div className="form-group">
              <label>Selector:</label>
              <input
                type="text"
                value={properties.selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
                placeholder="Leave empty for full page"
              />
            </div>
            <div className="form-group">
              <label>Path:</label>
              <input
                type="text"
                value={properties.path}
                onChange={(e) => handleNodeSpecificChange('path', e.target.value)}
                placeholder="screenshots/example.png"
              />
            </div>
          </div>
        );

      case 'scroll':
        return (
          <div className="node-specific-properties">
            <h3>Scroll Properties</h3>
            <div className="form-group">
              <label>Selector:</label>
              <input
                type="text"
                value={properties.selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
                placeholder="Leave empty for window"
              />
            </div>
            <div className="form-group">
              <label>Direction:</label>
              <select
                value={properties.direction}
                onChange={(e) => handleNodeSpecificChange('direction', e.target.value)}
              >
                <option value="down">Down</option>
                <option value="up">Up</option>
                <option value="intoView">Into View</option>
              </select>
            </div>
            <div className="form-group">
              <label>Amount (px):</label>
              <input
                type="number"
                value={properties.amount}
                onChange={(e) => handleNodeSpecificChange('amount', parseInt(e.target.value))}
                min="0"
                placeholder="Leave empty for full scroll"
              />
            </div>
            <div className="form-group">
              <label>Smooth Scroll:</label>
              <input
                type="checkbox"
                checked={properties.smooth}
                onChange={(e) => handleNodeSpecificChange('smooth', e.target.checked)}
              />
            </div>
          </div>
        );

      case 'iframe':
        return (
          <div className="node-specific-properties">
            <h3>Iframe Properties</h3>
            <div className="form-group">
              <label>Selector:</label>
              <input
                type="text"
                value={properties.selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Action:</label>
              <select
                value={properties.action}
                onChange={(e) => handleNodeSpecificChange('action', e.target.value)}
              >
                <option value="switch">Switch to Iframe</option>
                <option value="switchBack">Switch Back</option>
              </select>
            </div>
          </div>
        );

      case 'alert':
        return (
          <div className="node-specific-properties">
            <h3>Alert Properties</h3>
            <div className="form-group">
              <label>Action:</label>
              <select
                value={properties.action}
                onChange={(e) => handleNodeSpecificChange('action', e.target.value)}
              >
                <option value="accept">Accept</option>
                <option value="dismiss">Dismiss</option>
                <option value="type">Type and Accept</option>
              </select>
            </div>
            {properties.action === 'type' && (
              <div className="form-group">
                <label>Text:</label>
                <input
                  type="text"
                  value={properties.text}
                  onChange={(e) => handleNodeSpecificChange('text', e.target.value)}
                />
              </div>
            )}
          </div>
        );

      case 'cookie':
        return (
          <div className="node-specific-properties">
            <h3>Cookie Properties</h3>
            <div className="form-group">
              <label>Action:</label>
              <select
                value={properties.action}
                onChange={(e) => handleNodeSpecificChange('action', e.target.value)}
              >
                <option value="get">Get Cookies</option>
                <option value="set">Set Cookie</option>
                <option value="delete">Delete Cookie</option>
                <option value="clear">Clear All Cookies</option>
              </select>
            </div>
            {properties.action === 'set' && (
              <>
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={properties.name}
                    onChange={(e) => handleNodeSpecificChange('name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Value:</label>
                  <input
                    type="text"
                    value={properties.value}
                    onChange={(e) => handleNodeSpecificChange('value', e.target.value)}
                  />
                </div>
              </>
            )}
            {properties.action === 'delete' && (
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={properties.name}
                  onChange={(e) => handleNodeSpecificChange('name', e.target.value)}
                />
              </div>
            )}
          </div>
        );

      case 'storage':
        return (
          <div className="node-specific-properties">
            <h3>Storage Properties</h3>
            <div className="form-group">
              <label>Storage Type:</label>
              <select
                value={properties.storageType}
                onChange={(e) => handleNodeSpecificChange('storageType', e.target.value)}
              >
                <option value="local">Local Storage</option>
                <option value="session">Session Storage</option>
              </select>
            </div>
            <div className="form-group">
              <label>Action:</label>
              <select
                value={properties.action}
                onChange={(e) => handleNodeSpecificChange('action', e.target.value)}
              >
                <option value="get">Get Item</option>
                <option value="set">Set Item</option>
                <option value="remove">Remove Item</option>
                <option value="clear">Clear All</option>
              </select>
            </div>
            {(properties.action === 'get' || properties.action === 'set' || properties.action === 'remove') && (
              <div className="form-group">
                <label>Key:</label>
                <input
                  type="text"
                  value={properties.key}
                  onChange={(e) => handleNodeSpecificChange('key', e.target.value)}
                />
              </div>
            )}
            {properties.action === 'set' && (
              <div className="form-group">
                <label>Value:</label>
                <input
                  type="text"
                  value={properties.value}
                  onChange={(e) => handleNodeSpecificChange('value', e.target.value)}
                />
              </div>
            )}
          </div>
        );

      case 'fileUpload':
        return (
          <div className="node-specific-properties">
            <h3>File Upload Properties</h3>
            <div className="form-group">
              <label>Selector:</label>
              <input
                type="text"
                value={properties.selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>File Path:</label>
              <input
                type="text"
                value={properties.filePath}
                onChange={(e) => handleNodeSpecificChange('filePath', e.target.value)}
              />
            </div>
            <VariableOperationsEditor
              operations={properties.variableOperations || []}
              onChange={(ops) => handleNodeSpecificChange('variableOperations', ops)}
              availableVariables={availableVariables}
            />
          </div>
        );

      case 'dragDrop':
        return (
          <div className="node-specific-properties">
            <h3>Drag & Drop Properties</h3>
            <div className="form-group">
              <label>Source Selector:</label>
              <input
                type="text"
                value={properties.sourceSelector}
                onChange={(e) => handleNodeSpecificChange('sourceSelector', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Target Selector:</label>
              <input
                type="text"
                value={properties.targetSelector}
                onChange={(e) => handleNodeSpecificChange('targetSelector', e.target.value)}
              />
            </div>
          </div>
        );

      case 'network':
        return (
          <div className="node-specific-properties">
            <h3>Network Properties</h3>
            <div className="form-group">
              <label>Action:</label>
              <select
                value={properties.action}
                onChange={(e) => handleNodeSpecificChange('action', e.target.value)}
              >
                <option value="block">Block Request</option>
                <option value="unblock">Unblock Request</option>
                <option value="intercept">Intercept Request</option>
              </select>
            </div>
            <div className="form-group">
              <label>URL Pattern:</label>
              <input
                type="text"
                value={properties.urlPattern}
                onChange={(e) => handleNodeSpecificChange('urlPattern', e.target.value)}
                placeholder="*.example.com/*"
              />
            </div>
            {properties.action === 'intercept' && (
              <div className="form-group">
                <label>Response:</label>
                <textarea
                  value={JSON.stringify(properties.response, null, 2)}
                  onChange={(e) => handleNodeSpecificChange('response', JSON.parse(e.target.value))}
                  rows={5}
                  placeholder="Enter JSON response..."
                />
              </div>
            )}
          </div>
        );

      // Wallet Nodes
      case 'walletConnect':
        return (
          <div className="node-specific-properties">
            <h3>Wallet Connect Properties</h3>
            <div className="form-group">
              <label>Wallet Type:</label>
              <select
                value={properties.walletType}
                onChange={(e) => handleNodeSpecificChange('walletType', e.target.value)}
              >
                <option value="metamask">MetaMask</option>
                <option value="phantom">Phantom</option>
                <option value="solflare">Solflare</option>
                <option value="walletconnect">WalletConnect</option>
              </select>
            </div>
            <div className="form-group">
              <label>Network:</label>
              <input
                type="text"
                value={properties.network}
                onChange={(e) => handleNodeSpecificChange('network', e.target.value)}
                placeholder="ethereum, polygon, etc."
              />
            </div>
            <div className="form-group">
              <label>Action:</label>
              <select
                value={properties.action}
                onChange={(e) => handleNodeSpecificChange('action', e.target.value)}
              >
                <option value="connect">Connect</option>
                <option value="disconnect">Disconnect</option>
              </select>
            </div>
          </div>
        );

      case 'walletSign':
        return (
          <div className="node-specific-properties">
            <h3>Wallet Sign Properties</h3>
            <div className="form-group">
              <label>Action:</label>
              <select
                value={properties.action}
                onChange={(e) => handleNodeSpecificChange('action', e.target.value)}
              >
                <option value="signMessage">Sign Message</option>
                <option value="signTransaction">Sign Transaction</option>
              </select>
            </div>
            {properties.action === 'signMessage' && (
              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={properties.message}
                  onChange={(e) => handleNodeSpecificChange('message', e.target.value)}
                  rows={3}
                  placeholder="Enter message to sign..."
                />
              </div>
            )}
            {properties.action === 'signTransaction' && (
              <div className="form-group">
                <label>Transaction:</label>
                <textarea
                  value={JSON.stringify(properties.transaction, null, 2)}
                  onChange={(e) => handleNodeSpecificChange('transaction', JSON.parse(e.target.value))}
                  rows={5}
                  placeholder="Enter transaction object..."
                />
              </div>
            )}
            <div className="form-group">
              <label>Result Key:</label>
              <input
                type="text"
                value={properties.key}
                onChange={(e) => handleNodeSpecificChange('key', e.target.value)}
                placeholder="Key to store result"
              />
            </div>
          </div>
        );

      case 'walletSend':
        return (
          <div className="node-specific-properties">
            <h3>Wallet Send Properties</h3>
            <div className="form-group">
              <label>To Address:</label>
              <input
                type="text"
                value={properties.to}
                onChange={(e) => handleNodeSpecificChange('to', e.target.value)}
                placeholder="0x..."
              />
            </div>
            <div className="form-group">
              <label>Amount:</label>
              <input
                type="text"
                value={properties.amount}
                onChange={(e) => handleNodeSpecificChange('amount', e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="form-group">
              <label>Token (optional):</label>
              <input
                type="text"
                value={properties.token}
                onChange={(e) => handleNodeSpecificChange('token', e.target.value)}
                placeholder="0x..."
              />
            </div>
            <div className="form-group">
              <label>Network:</label>
              <input
                type="text"
                value={properties.network}
                onChange={(e) => handleNodeSpecificChange('network', e.target.value)}
                placeholder="ethereum, polygon, etc."
              />
            </div>
            <div className="form-group">
              <label>Result Key:</label>
              <input
                type="text"
                value={properties.key}
                onChange={(e) => handleNodeSpecificChange('key', e.target.value)}
                placeholder="Key to store transaction hash"
              />
            </div>
          </div>
        );

      case 'walletBalance':
        return (
          <div className="node-specific-properties">
            <h3>Wallet Balance Properties</h3>
            <div className="form-group">
              <label>Token (optional):</label>
              <input
                type="text"
                value={properties.token}
                onChange={(e) => handleNodeSpecificChange('token', e.target.value)}
                placeholder="0x..."
              />
            </div>
            <div className="form-group">
              <label>Network:</label>
              <input
                type="text"
                value={properties.network}
                onChange={(e) => handleNodeSpecificChange('network', e.target.value)}
                placeholder="ethereum, polygon, etc."
              />
            </div>
            <div className="form-group">
              <label>Result Key:</label>
              <input
                type="text"
                value={properties.key}
                onChange={(e) => handleNodeSpecificChange('key', e.target.value)}
                placeholder="Key to store balance"
              />
            </div>
          </div>
        );

      case 'walletApprove':
        return (
          <div className="node-specific-properties">
            <h3>Wallet Approve Properties</h3>
            <div className="form-group">
              <label>Token Address:</label>
              <input
                type="text"
                value={properties.token}
                onChange={(e) => handleNodeSpecificChange('token', e.target.value)}
                placeholder="0x..."
              />
            </div>
            <div className="form-group">
              <label>Spender Address:</label>
              <input
                type="text"
                value={properties.spender}
                onChange={(e) => handleNodeSpecificChange('spender', e.target.value)}
                placeholder="0x..."
              />
            </div>
            <div className="form-group">
              <label>Amount:</label>
              <input
                type="text"
                value={properties.amount}
                onChange={(e) => handleNodeSpecificChange('amount', e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="form-group">
              <label>Network:</label>
              <input
                type="text"
                value={properties.network}
                onChange={(e) => handleNodeSpecificChange('network', e.target.value)}
                placeholder="ethereum, polygon, etc."
              />
            </div>
            <div className="form-group">
              <label>Result Key:</label>
              <input
                type="text"
                value={properties.key}
                onChange={(e) => handleNodeSpecificChange('key', e.target.value)}
                placeholder="Key to store approval hash"
              />
            </div>
          </div>
        );

      case 'walletSwitch':
        return (
          <div className="node-specific-properties">
            <h3>Wallet Switch Properties</h3>
            <div className="form-group">
              <label>Network:</label>
              <input
                type="text"
                value={properties.network}
                onChange={(e) => handleNodeSpecificChange('network', e.target.value)}
                placeholder="ethereum, polygon, etc."
              />
            </div>
            <div className="form-group">
              <label>Chain ID:</label>
              <input
                type="number"
                value={properties.chainId}
                onChange={(e) => handleNodeSpecificChange('chainId', parseInt(e.target.value))}
                placeholder="1, 137, etc."
              />
            </div>
          </div>
        );

      case 'filePicker':
        return (
          <Box className="node-specific-properties" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>File Picker Properties</Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={properties.multiple || false}
                    onChange={(e) => handleNodeSpecificChange('multiple', e.target.checked)}
                  />
                }
                label="Allow Multiple Files"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={properties.directory || false}
                    onChange={(e) => handleNodeSpecificChange('directory', e.target.checked)}
                  />
                }
                label="Select Directory"
              />

              <TextField
                fullWidth
                label="Source Path"
                value={properties.filePath || ''}
                onChange={(e) => handleNodeSpecificChange('filePath', e.target.value)}
                placeholder="Enter path to pick files from"
                helperText="Directory path where files will be picked from"
              />

              <TextField
                fullWidth
                label="File Name"
                value={properties.fileName || ''}
                onChange={(e) => handleNodeSpecificChange('fileName', e.target.value)}
                placeholder="Leave empty to take first file"
                helperText="Specify file name to search for, or leave empty to take first file"
              />

              <TextField
                fullWidth
                label="Accept File Types"
                value={properties.accept || ''}
                onChange={(e) => handleNodeSpecificChange('accept', e.target.value)}
                placeholder=".pdf,.doc,.docx,image/*"
                helperText="Comma-separated file extensions or MIME types"
              />

              <VariableOperationsEditor
                operations={properties.variableOperations || []}
                onChange={(ops) => handleNodeSpecificChange('variableOperations', ops)}
                availableVariables={availableVariables}
              />
            </Stack>
          </Box>
        );

      case 'variableManager':
        return (
          <Box className="node-specific-properties" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Variable Manager Properties</Typography>
            
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel id="scope-label">Scope</InputLabel>
                <Select
                  labelId="scope-label"
                  value={properties.scope || 'local'}
                  label="Scope"
                  onChange={(e) => handleNodeSpecificChange('scope', e.target.value)}
                >
                  <MenuItem value="local">Local</MenuItem>
                  <MenuItem value="global">Global</MenuItem>
                  <MenuItem value="flow">Flow</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={properties.persist || false}
                    onChange={(e) => handleNodeSpecificChange('persist', e.target.checked)}
                  />
                }
                label="Persist Variables"
              />

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Operations</Typography>
                <Stack spacing={2}>
                  {(properties.operations || []).map((op, index) => (
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
                          <InputLabel id={`action-label-${index}`}>Action</InputLabel>
                          <Select
                            labelId={`action-label-${index}`}
                            value={op.action}
                            label="Action"
                            onChange={(e) => {
                              const newOps = [...(properties.operations || [])];
                              newOps[index] = { ...op, action: e.target.value as VariableAction };
                              handleNodeSpecificChange('operations', newOps);
                            }}
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
                          onChange={(e) => {
                            const newOps = [...(properties.operations || [])];
                            newOps[index] = { ...op, key: e.target.value };
                            handleNodeSpecificChange('operations', newOps);
                          }}
                          size="small"
                          sx={{ flexGrow: 1 }}
                        />

                        {op.action !== 'delete' && op.action !== 'clear' && (
                          <>
                            <TextField
                              label="Value"
                              value={String(op.value || '')}
                              onChange={(e) => {
                                const newOps = [...(properties.operations || [])];
                                newOps[index] = { ...op, value: e.target.value as VariableValue };
                                handleNodeSpecificChange('operations', newOps);
                              }}
                              size="small"
                              sx={{ flexGrow: 1 }}
                            />

                            <FormControl sx={{ width: 150 }} size="small">
                              <InputLabel id={`type-label-${index}`}>Type</InputLabel>
                              <Select
                                labelId={`type-label-${index}`}
                                value={op.type || 'string'}
                                label="Type"
                                onChange={(e) => {
                                  const newOps = [...(properties.operations || [])];
                                  newOps[index] = { ...op, type: e.target.value as VariableType };
                                  handleNodeSpecificChange('operations', newOps);
                                }}
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
                          onClick={() => {
                            const newOps = (properties.operations || []).filter((_, i) => i !== index);
                            handleNodeSpecificChange('operations', newOps);
                          }}
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
                    onClick={() => {
                      const newOps = [
                        ...(properties.operations || []),
                        { action: 'set' as VariableAction, key: '', value: '', type: 'string' as VariableType }
                      ];
                      handleNodeSpecificChange('operations', newOps);
                    }}
                    sx={{ mt: 1 }}
                  >
                    Add Operation
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Box>
        );

      case 'subtitleToVoice':
        return (
          <Box className="node-specific-properties" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Subtitle to Voice Properties</Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Subtitle File"
                value={properties.subtitleFile || ''}
                onChange={(e) => handleNodeSpecificChange('subtitleFile', e.target.value)}
                placeholder="Enter subtitle file path"
              />
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={properties.subtitleFormat || 'srt'}
                  label="Format"
                  onChange={(e) => handleNodeSpecificChange('subtitleFormat', e.target.value)}
                >
                  <MenuItem value="srt">SRT</MenuItem>
                  <MenuItem value="vtt">VTT</MenuItem>
                  <MenuItem value="ass">ASS</MenuItem>
                </Select>
              </FormControl>
              <div className="form-group">
                <label>Language:</label>
                <input
                  type="text"
                  value={properties.language}
                  onChange={(e) => handleNodeSpecificChange('language', e.target.value)}
                  placeholder="Enter target language"
                  required
                />
              </div>
              <div className="form-group">
                <label>Voice:</label>
                <input
                  type="text"
                  value={properties.voice || ''}
                  onChange={(e) => handleNodeSpecificChange('voice', e.target.value)}
                  placeholder="Enter voice model/type"
                />
              </div>
              <div className="form-group">
                <label>Output Path:</label>
                <input
                  type="text"
                  value={properties.outputPath || ''}
                  onChange={(e) => handleNodeSpecificChange('outputPath', e.target.value)}
                  placeholder="Enter output file path"
                />
              </div>
              <div className="form-group">
                <label>Speed:</label>
                <input
                  type="number"
                  value={properties.speed || 1.0}
                  onChange={(e) => handleNodeSpecificChange('speed', parseFloat(e.target.value))}
                  step="0.1"
                  min="0.5"
                  max="2.0"
                />
              </div>
              <div className="form-group">
                <label>Pitch:</label>
                <input
                  type="number"
                  value={properties.pitch || 1.0}
                  onChange={(e) => handleNodeSpecificChange('pitch', parseFloat(e.target.value))}
                  step="0.1"
                  min="0.5"
                  max="2.0"
                />
              </div>
              <div className="form-group">
                <label>Volume:</label>
                <input
                  type="number"
                  value={properties.volume || 1.0}
                  onChange={(e) => handleNodeSpecificChange('volume', parseFloat(e.target.value))}
                  step="0.1"
                  min="0.0"
                  max="1.0"
                />
              </div>
              <div className="form-group">
                <label>Split by Line:</label>
                <input
                  type="checkbox"
                  checked={properties.splitByLine || false}
                  onChange={(e) => handleNodeSpecificChange('splitByLine', e.target.checked)}
                />
              </div>
              <div className="form-group">
                <label>Preserve Timings:</label>
                <input
                  type="checkbox"
                  checked={properties.preserveTimings || false}
                  onChange={(e) => handleNodeSpecificChange('preserveTimings', e.target.checked)}
                />
              </div>
              <VariableOperationsEditor
                operations={properties.variableOperations || []}
                onChange={(ops) => handleNodeSpecificChange('variableOperations', ops)}
                availableVariables={availableVariables}
              />
            </Stack>
          </Box>
        );

      case 'editVideo':
        return (
          <Box className="node-specific-properties" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Video Editor Properties</Typography>
            
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Input Path"
                value={properties.inputPath}
                onChange={(e) => handleNodeSpecificChange('inputPath', e.target.value)}
                placeholder="Enter input video path"
                required
              />

              <TextField
                fullWidth
                label="Output Path"
                value={properties.outputPath || ''}
                onChange={(e) => handleNodeSpecificChange('outputPath', e.target.value)}
                placeholder="Enter output video path"
              />

              <FormControl fullWidth>
                <InputLabel id="format-label">Format</InputLabel>
                <Select
                  labelId="format-label"
                  value={properties.format || 'mp4'}
                  label="Format"
                  onChange={(e) => handleNodeSpecificChange('format', e.target.value)}
                >
                  <MenuItem value="mp4">MP4</MenuItem>
                  <MenuItem value="mov">MOV</MenuItem>
                  <MenuItem value="avi">AVI</MenuItem>
                  <MenuItem value="webm">WebM</MenuItem>
                </Select>
              </FormControl>

              <TextField
                type="number"
                label="Quality"
                value={properties.quality || 100}
                onChange={(e) => handleNodeSpecificChange('quality', parseInt(e.target.value))}
                inputProps={{ min: 0, max: 100 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={properties.preserveAudio || false}
                    onChange={(e) => handleNodeSpecificChange('preserveAudio', e.target.checked)}
                  />
                }
                label="Preserve Audio"
              />

              <TextField
                fullWidth
                label="Audio Track"
                value={properties.audioTrack || ''}
                onChange={(e) => handleNodeSpecificChange('audioTrack', e.target.value)}
                placeholder="Enter custom audio track path"
              />

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Operations</Typography>
                <Stack spacing={2}>
                  {(properties.operations || []).map((op, index) => (
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
                          <InputLabel id={`video-op-type-${index}`}>Operation</InputLabel>
                          <Select
                            labelId={`video-op-type-${index}`}
                            value={op.type}
                            label="Operation"
                            onChange={(e) => {
                              const newOps = [...(properties.operations || [])];
                              newOps[index] = { type: e.target.value as VideoOperationType, params: {} };
                              handleNodeSpecificChange('operations', newOps);
                            }}
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

                        {op.type === 'trim' && (
                          <>
                            <TextField
                              label="Start Time (s)"
                              type="number"
                              value={op.params.start || 0}
                              onChange={(e) => {
                                const newOps = [...(properties.operations || [])];
                                newOps[index] = {
                                  ...op,
                                  params: { ...op.params, start: parseFloat(e.target.value) }
                                };
                                handleNodeSpecificChange('operations', newOps);
                              }}
                              size="small"
                            />
                            <TextField
                              label="End Time (s)"
                              type="number"
                              value={op.params.end || 0}
                              onChange={(e) => {
                                const newOps = [...(properties.operations || [])];
                                newOps[index] = {
                                  ...op,
                                  params: { ...op.params, end: parseFloat(e.target.value) }
                                };
                                handleNodeSpecificChange('operations', newOps);
                              }}
                              size="small"
                            />
                          </>
                        )}

                        {(op.type === 'crop' || op.type === 'resize') && (
                          <>
                            <TextField
                              label="Width"
                              type="number"
                              value={op.params.width || ''}
                              onChange={(e) => {
                                const newOps = [...(properties.operations || [])];
                                newOps[index] = {
                                  ...op,
                                  params: { ...op.params, width: parseInt(e.target.value) }
                                };
                                handleNodeSpecificChange('operations', newOps);
                              }}
                              size="small"
                            />
                            <TextField
                              label="Height"
                              type="number"
                              value={op.params.height || ''}
                              onChange={(e) => {
                                const newOps = [...(properties.operations || [])];
                                newOps[index] = {
                                  ...op,
                                  params: { ...op.params, height: parseInt(e.target.value) }
                                };
                                handleNodeSpecificChange('operations', newOps);
                              }}
                              size="small"
                            />
                          </>
                        )}

                        {op.type === 'overlay' && (
                          <>
                            <TextField
                              label="Overlay File"
                              value={op.params.path || ''}
                              onChange={(e) => {
                                const newOps = [...(properties.operations || [])];
                                newOps[index] = {
                                  ...op,
                                  params: { ...op.params, path: e.target.value }
                                };
                                handleNodeSpecificChange('operations', newOps);
                              }}
                              size="small"
                              sx={{ flexGrow: 1 }}
                            />
                            <TextField
                              label="X Position"
                              type="number"
                              value={op.params.x || 0}
                              onChange={(e) => {
                                const newOps = [...(properties.operations || [])];
                                newOps[index] = {
                                  ...op,
                                  params: { ...op.params, x: parseInt(e.target.value) }
                                };
                                handleNodeSpecificChange('operations', newOps);
                              }}
                              size="small"
                            />
                            <TextField
                              label="Y Position"
                              type="number"
                              value={op.params.y || 0}
                              onChange={(e) => {
                                const newOps = [...(properties.operations || [])];
                                newOps[index] = {
                                  ...op,
                                  params: { ...op.params, y: parseInt(e.target.value) }
                                };
                                handleNodeSpecificChange('operations', newOps);
                              }}
                              size="small"
                            />
                          </>
                        )}

                        {op.type === 'speed' && (
                          <TextField
                            label="Speed"
                            type="number"
                            value={op.params.speed || 1.0}
                            onChange={(e) => {
                              const newOps = [...(properties.operations || [])];
                              newOps[index] = {
                                ...op,
                                params: { ...op.params, speed: parseFloat(e.target.value) }
                              };
                              handleNodeSpecificChange('operations', newOps);
                            }}
                            size="small"
                            inputProps={{ step: 0.1, min: 0.1, max: 10.0 }}
                          />
                        )}

                        {op.type === 'filter' && (
                          <TextField
                            label="Filter Parameters"
                            value={op.params.filter || ''}
                            onChange={(e) => {
                              const newOps = [...(properties.operations || [])];
                              newOps[index] = {
                                ...op,
                                params: { ...op.params, filter: e.target.value }
                              };
                              handleNodeSpecificChange('operations', newOps);
                            }}
                            size="small"
                            sx={{ flexGrow: 1 }}
                          />
                        )}

                        <IconButton
                          onClick={() => {
                            const newOps = (properties.operations || []).filter((_, i) => i !== index);
                            handleNodeSpecificChange('operations', newOps);
                          }}
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
                    onClick={() => {
                      const newOps = [
                        ...(properties.operations || []),
                        { type: 'trim' as VideoOperationType, params: { start: 0, end: 0 } }
                      ];
                      handleNodeSpecificChange('operations', newOps);
                    }}
                    sx={{ mt: 1 }}
                  >
                    Add Operation
                  </Button>
                </Stack>
              </Box>
            </Stack>
            <VariableOperationsEditor
              operations={properties.variableOperations || []}
              onChange={(ops) => handleNodeSpecificChange('variableOperations', ops)}
              availableVariables={availableVariables}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="node-properties-editor">
        {renderCommonProperties()}
        {renderNodeSpecificProperties()}
        <div className="form-actions">
          <button type="submit">Save</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
  );
};

export default NodePropertiesEditor; 