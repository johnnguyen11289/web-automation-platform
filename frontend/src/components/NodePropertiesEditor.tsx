import React from 'react';
import { NodeProperties, BaseNodeProperties } from '../types/node.types';
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

  const handleBasePropertyChange = (field: keyof BaseNodeProperties, value: any) => {
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
                value={(properties as any).url}
                onChange={(e) => handleNodeSpecificChange('url', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Open in New Tab:</label>
              <input
                type="checkbox"
                checked={(properties as any).openInNewTab}
                onChange={(e) => handleNodeSpecificChange('openInNewTab', e.target.checked)}
              />
            </div>
            <div className="form-group">
              <label>Wait for Page Load:</label>
              <input
                type="checkbox"
                checked={(properties as any).waitForPageLoad}
                onChange={(e) => handleNodeSpecificChange('waitForPageLoad', e.target.checked)}
              />
            </div>
            <div className="form-group">
              <label>Return Page Data:</label>
              <input
                type="checkbox"
                checked={(properties as any).returnPageData}
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
                value={(properties as any).selector}
                onChange={(e) => handleNodeSpecificChange('selector', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Click Type:</label>
              <select
                value={(properties as any).clickType}
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
                checked={(properties as any).waitForElement}
                onChange={(e) => handleNodeSpecificChange('waitForElement', e.target.checked)}
              />
            </div>
          </div>
        );

      // Add cases for other node types...

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