import React from 'react';
import './NodePalette.css';

interface NodeType {
  type: string;
  label: string;
  icon: string;
  description: string;
}

const nodeTypes: NodeType[] = [
  {
    type: 'openUrl',
    label: 'Open URL',
    icon: '🌐',
    description: 'Open a web page',
  },
  {
    type: 'click',
    label: 'Click',
    icon: '👆',
    description: 'Click on an element',
  },
  {
    type: 'input',
    label: 'Input',
    icon: '⌨️',
    description: 'Enter text or data',
  },
  {
    type: 'submit',
    label: 'Submit',
    icon: '📤',
    description: 'Submit a form',
  },
  {
    type: 'wait',
    label: 'Wait',
    icon: '⏳',
    description: 'Wait for a condition',
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: '⚖️',
    description: 'Check a condition',
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: '🔄',
    description: 'Repeat actions',
  },
  {
    type: 'extract',
    label: 'Extract',
    icon: '📥',
    description: 'Extract data',
  },
  {
    type: 'profile',
    label: 'Profile',
    icon: '👤',
    description: 'Browser profile settings',
  },
];

const NodePalette: React.FC = () => {
  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="node-palette">
      <h2>Nodes</h2>
      <div className="node-list">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            className="node-item"
            draggable
            onDragStart={(e) => handleDragStart(e, node.type)}
          >
            <div className="node-icon">{node.icon}</div>
            <div className="node-info">
              <div className="node-label">{node.label}</div>
              <div className="node-description">{node.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette; 