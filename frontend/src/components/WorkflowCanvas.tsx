import React, { useState } from 'react';
import { NodeProperties, OpenUrlNodeProperties, ClickNodeProperties, ProfileNodeProperties } from '../types/node.types';
import NodePropertiesEditor from './NodePropertiesEditor';
import { ZoomIn, ZoomOut } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import './WorkflowCanvas.css';

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  properties: NodeProperties;
}

const WorkflowCanvas: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const snapToGrid = (position: { x: number; y: number }) => {
    const gridSize = 20; // Match the grid size in CSS
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDraggingCanvas(true);
      setDragStart({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    if ((e.target as HTMLElement).closest('.delete-node-button')) {
      return;
    }
    
    const currentTime = new Date().getTime();
    if (currentTime - lastClickTime < 300) { // If double click detected
      e.preventDefault();
      setSelectedNode(node);
      setIsEditing(true);
      return;
    }
    
    setIsDraggingNode(true);
    setDraggedNode(node);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleNodeMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingNode || !draggedNode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / scale - offset.x - dragOffset.x;
    const canvasY = (e.clientY - rect.top) / scale - offset.y - dragOffset.y;
    
    const position = snapToGrid({
      x: canvasX,
      y: canvasY,
    });

    setNodes(prev =>
      prev.map(node =>
        node.id === draggedNode.id
          ? { ...node, position }
          : node
      )
    );
  };

  const handleNodeMouseUp = (e: React.MouseEvent) => {
    if (isDraggingNode) {
      const currentTime = new Date().getTime();
      setLastClickTime(currentTime);
    }
    setIsDraggingNode(false);
    setDraggedNode(null);
  };

  const handleNodeClick = (e: React.MouseEvent, node: WorkflowNode) => {
    // Don't open editor if clicking delete button
    if ((e.target as HTMLElement).closest('.delete-node-button')) {
      return;
    }
  };

  const handleNodeDelete = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation(); // Prevent node click event
    e.preventDefault(); // Prevent drag start
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
      setIsEditing(false);
    }
  };

  const createDefaultProperties = (nodeType: string): NodeProperties => {
    const baseProps = {
      nodeName: `New ${nodeType} Node`,
      timeout: 5000,
      enabled: true,
      errorHandling: 'retry' as const,
    };

    switch (nodeType) {
      case 'openUrl':
        return {
          ...baseProps,
          nodeType: 'openUrl' as const,
          url: '',
          openInNewTab: false,
          waitForPageLoad: true,
          returnPageData: false,
        };
      case 'click':
        return {
          ...baseProps,
          nodeType: 'click' as const,
          selector: '',
          clickType: 'single',
          waitForElement: true,
        };
      case 'profile':
        return {
          ...baseProps,
          nodeType: 'profile' as const,
          profileName: 'default',
          incognitoMode: false,
        };
      default:
        // Default to OpenUrl node type if unknown
        return {
          ...baseProps,
          nodeType: 'openUrl' as const,
          url: '',
          openInNewTab: false,
          waitForPageLoad: true,
          returnPageData: false,
        };
    }
  };

  const handleNodeUpdate = (updatedProperties: NodeProperties) => {
    if (selectedNode) {
      setNodes(prev =>
        prev.map(node =>
          node.id === selectedNode.id
            ? { ...node, properties: updatedProperties, position: node.position }
            : node
        )
      );
      setSelectedNode(null);
      setIsEditing(false);
    }
  };

  const getNodeSelector = (properties: NodeProperties): string | undefined => {
    if ('selector' in properties) {
      return properties.selector;
    }
    return undefined;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    if (!nodeType) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const position = snapToGrid({
      x: (e.clientX - rect.left) / scale - offset.x,
      y: (e.clientY - rect.top) / scale - offset.y,
    });

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position,
      properties: createDefaultProperties(nodeType),
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode);
    setIsEditing(true);
  };

  return (
    <div className="workflow-canvas">
      <div className="zoom-controls">
        <IconButton onClick={handleZoomIn} size="small">
          <ZoomIn />
        </IconButton>
        <IconButton onClick={handleZoomOut} size="small">
          <ZoomOut />
        </IconButton>
      </div>
      <div
        className="canvas-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={(e) => {
          handleCanvasMouseMove(e);
          handleNodeMouseMove(e);
        }}
        onMouseUp={(e) => {
          handleCanvasMouseUp();
          handleNodeMouseUp(e);
        }}
        onMouseLeave={(e) => {
          handleCanvasMouseUp();
          handleNodeMouseUp(e);
        }}
        style={{
          transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
          transformOrigin: '0 0',
        }}
      >
        {nodes.map(node => (
          <div
            key={node.id}
            className={`workflow-node ${draggedNode?.id === node.id ? 'dragging' : ''}`}
            data-type={node.type}
            style={{
              left: node.position.x,
              top: node.position.y,
              zIndex: draggedNode?.id === node.id ? 1000 : 1,
            }}
            onClick={(e) => handleNodeClick(e, node)}
            onMouseDown={(e) => handleNodeMouseDown(e, node)}
            onMouseUp={(e) => handleNodeMouseUp(e)}
          >
            <div className="node-header">
              {node.properties.nodeName}
              <button
                className="delete-node-button"
                onClick={(e) => handleNodeDelete(e, node.id)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                ×
              </button>
            </div>
            <div className="node-content">
              <div className="node-type">{node.type}</div>
              {getNodeSelector(node.properties) && (
                <div className="node-selector">{getNodeSelector(node.properties)}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isEditing && selectedNode && (
        <NodePropertiesEditor
          node={selectedNode.properties}
          onUpdate={handleNodeUpdate}
          onClose={() => {
            setIsEditing(false);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkflowCanvas; 