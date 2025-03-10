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
}) => {
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
        <label>Enabled:</label>
        <input
          type="checkbox"
          checked={properties.enabled}
          onChange={(e) => handleBasePropertyChange('enabled', e.target.checked)}
        />
      </div>
      <div className="form-group">
        <label>Error Handling:</label>
        <select
          value={properties.errorHandling}
          onChange={(e) => handleBasePropertyChange('errorHandling', e.target.value)}
        >
          <option value="retry">Retry</option>
          <option value="skip">Skip</option>
          <option value="stop">Stop</option>
        </select>
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
              <label>Wait for Page Load:</label>
              <input
                type="checkbox"
                checked={properties.waitForPageLoad}
                onChange={(e) => handleNodeSpecificChange('waitForPageLoad', e.target.checked)}
              />
            </div>
            <div className="form-group">
              <label>Return Page Data:</label>
              <input
                type="checkbox"
                checked={properties.returnPageData}
                onChange={(e) => handleNodeSpecificChange('returnPageData', e.target.checked)}
              />
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
              <label>Click Type:</label>
              <select
                value={properties.clickType}
                onChange={(e) => handleNodeSpecificChange('clickType', e.target.value)}
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="form-group">
              <label>Wait for Element:</label>
              <input
                type="checkbox"
                checked={properties.waitForElement}
                onChange={(e) => handleNodeSpecificChange('waitForElement', e.target.checked)}
              />
            </div>
          </div>
        );

      case 'input':
        return (
          <div className="node-specific-properties">
            <h3>Input Properties</h3>
            <div className="form-group">
              <label>Selector:</label>
              <input
                type="text"
                value={properties.selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Input Type:</label>
              <select
                value={properties.inputType}
                onChange={(e) => handleNodeSpecificChange('inputType', e.target.value)}
              >
                <option value="text">Text</option>
                <option value="password">Password</option>
                <option value="file">File Upload</option>
              </select>
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
              <label>Clear Before Input:</label>
              <input
                type="checkbox"
                checked={properties.clearBeforeInput}
                onChange={(e) => handleNodeSpecificChange('clearBeforeInput', e.target.checked)}
              />
            </div>
          </div>
        );

      case 'submit':
        return (
          <div className="node-specific-properties">
            <h3>Submit Properties</h3>
            <div className="form-group">
              <label>Selector:</label>
              <input
                type="text"
                value={properties.selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
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

      case 'wait':
        return (
          <div className="node-specific-properties">
            <h3>Wait Properties</h3>
            <div className="form-group">
              <label>Wait Type:</label>
              <select
                value={properties.waitType}
                onChange={(e) => handleNodeSpecificChange('waitType', e.target.value)}
              >
                <option value="fixed">Fixed Delay</option>
                <option value="dynamic">Dynamic Wait</option>
              </select>
            </div>
            <div className="form-group">
              <label>Timeout (ms):</label>
              <input
                type="number"
                value={properties.timeout}
                onChange={(e) => handleNodeSpecificChange('timeout', parseInt(e.target.value))}
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="node-specific-properties">
            <h3>Condition Properties</h3>
            <div className="form-group">
              <label>Condition Type:</label>
              <select
                value={properties.conditionType}
                onChange={(e) => handleNodeSpecificChange('conditionType', e.target.value)}
              >
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
                <option value="exists">Exists</option>
              </select>
            </div>
            <div className="form-group">
              <label>Target:</label>
              <input
                type="text"
                value={properties.target}
                onChange={(e) => handleNodeSpecificChange('target', e.target.value)}
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
              <label>True Path:</label>
              <input
                type="text"
                value={properties.truePath}
                onChange={(e) => handleNodeSpecificChange('truePath', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>False Path:</label>
              <input
                type="text"
                value={properties.falsePath}
                onChange={(e) => handleNodeSpecificChange('falsePath', e.target.value)}
              />
            </div>
          </div>
        );

      case 'loop':
        return (
          <div className="node-specific-properties">
            <h3>Loop Properties</h3>
            <div className="form-group">
              <label>Loop Type:</label>
              <select
                value={properties.loopType}
                onChange={(e) => handleNodeSpecificChange('loopType', e.target.value)}
              >
                <option value="fixed">Fixed Count</option>
                <option value="list">List Iteration</option>
              </select>
            </div>
            <div className="form-group">
              <label>Max Iterations:</label>
              <input
                type="number"
                value={properties.maxIterations}
                onChange={(e) => handleNodeSpecificChange('maxIterations', parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Break Condition:</label>
              <input
                type="text"
                value={properties.breakCondition}
                onChange={(e) => handleNodeSpecificChange('breakCondition', e.target.value)}
              />
            </div>
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
              <select
                value={properties.attribute}
                onChange={(e) => handleNodeSpecificChange('attribute', e.target.value)}
              >
                <option value="text">Text</option>
                <option value="html">HTML</option>
                <option value="value">Value</option>
                <option value="class">Class</option>
                <option value="id">ID</option>
                <option value="href">Href</option>
                <option value="src">Src</option>
              </select>
            </div>
            <div className="form-group">
              <label>Variable Name:</label>
              <input
                type="text"
                value={properties.variableName}
                onChange={(e) => handleNodeSpecificChange('variableName', e.target.value)}
              />
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="node-specific-properties">
            <h3>Profile Properties</h3>
            <div className="form-group">
              <label>Profile Name:</label>
              <input
                type="text"
                value={properties.profileName}
                onChange={(e) => handleNodeSpecificChange('profileName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Incognito Mode:</label>
              <input
                type="checkbox"
                checked={properties.incognitoMode}
                onChange={(e) => handleNodeSpecificChange('incognitoMode', e.target.checked)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="node-properties-editor">
      <form onSubmit={handleSubmit}>
        <h2>Edit Node Properties</h2>
        {renderCommonProperties()}
        {renderNodeSpecificProperties()}
        <div className="form-actions">
          <button type="submit">Save</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default NodePropertiesEditor; 