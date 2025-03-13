import React from 'react';
import { NodeProperties } from '../types/node.types';
import './NodePropertiesEditor.css';

interface NodePropertiesEditorProps {
  node: NodeProperties;
  onUpdate: (updatedNode: NodeProperties) => void;
  onClose: () => void;
}

const NodePropertiesEditor: React.FC<NodePropertiesEditorProps> = ({
  node,
  onUpdate,
  onClose,
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

  const renderCommonProperties = () => (
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
                defaultValue="1"
              />
            </div>
            <div className="form-group">
              <label>Delay (ms):</label>
              <input
                type="number"
                value={properties.delay}
                onChange={(e) => handleNodeSpecificChange('delay', parseInt(e.target.value))}
                min="0"
                defaultValue="0"
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
                defaultValue="0"
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
              <label>Key:</label>
              <input
                type="text"
                value={properties.key}
                onChange={(e) => handleNodeSpecificChange('key', e.target.value)}
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