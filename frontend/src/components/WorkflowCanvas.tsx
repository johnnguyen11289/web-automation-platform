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
  connections: string[]; // Array of node IDs this node connects to
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
  const [connectingNode, setConnectingNode] = useState<WorkflowNode | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<{ sourceId: string; targetId: string } | null>(null);

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
    // Only handle node movement if not connecting
    if (isDraggingNode && draggedNode && !connectingNode) {
      handleNodeMouseMove(e);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    setIsDraggingCanvas(false);
    // If we're dragging a node and mouse up happens on canvas, stop dragging
    if (isDraggingNode && draggedNode) {
      setIsDraggingNode(false);
      setDraggedNode(null);
      setConnectingNode(null);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    if ((e.target as HTMLElement).closest('.delete-node-button')) {
      return;
    }
    
    const currentTime = new Date().getTime();
    if (currentTime - lastClickTime < 300) { // If double click detected
      e.preventDefault();
      e.stopPropagation();
      setSelectedNode(node);
      setIsEditing(true);
      setLastClickTime(0); // Reset last click time
      return;
    }

    if (e.shiftKey) {
      // Start connection mode
      setConnectingNode(node);
      setLastClickTime(currentTime); // Update last click time
      return;
    }
    
    setIsDraggingNode(true);
    setDraggedNode(node);
    setLastClickTime(currentTime); // Update last click time
    
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

    // Only update if the position has actually changed
    if (position.x !== draggedNode.position.x || position.y !== draggedNode.position.y) {
      setNodes(prev =>
        prev.map(node =>
          node.id === draggedNode.id
            ? { ...node, position }
            : node
        )
      );
    }
  };

  const handleNodeMouseUp = (e: React.MouseEvent, targetNode: WorkflowNode) => {
    if (connectingNode && connectingNode.id !== targetNode.id) {
      // Create connection
      setNodes(prev => prev.map(node => {
        if (node.id === connectingNode.id) {
          return {
            ...node,
            connections: [...node.connections, targetNode.id]
          };
        }
        return node;
      }));
    }
    setConnectingNode(null);
    setIsDraggingNode(false);
    setDraggedNode(null);
    setLastClickTime(0); // Reset last click time
  };

  const handleNodeClick = (e: React.MouseEvent, node: WorkflowNode) => {
    // Don't open editor if clicking delete button
    if ((e.target as HTMLElement).closest('.delete-node-button')) {
      return;
    }
    
    // Update last click time for double-click detection
    const currentTime = new Date().getTime();
    setLastClickTime(currentTime);
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
      case 'click':
        return {
          ...baseProps,
          nodeType: 'click' as const,
          selector: '',
          clickType: 'single',
          waitForElement: true,
        };
      case 'input':
        return {
          ...baseProps,
          nodeType: 'input' as const,
          selector: '',
          inputType: 'text',
          value: '',
          clearBeforeInput: true,
        };
      case 'submit':
        return {
          ...baseProps,
          nodeType: 'submit' as const,
          selector: '',
          waitForNavigation: true,
        };
      case 'wait':
        return {
          ...baseProps,
          nodeType: 'wait' as const,
          waitType: 'fixed',
          timeout: 1000,
        };
      case 'condition':
        return {
          ...baseProps,
          nodeType: 'condition' as const,
          conditionType: 'equals',
          target: '',
          value: '',
          truePath: '',
          falsePath: '',
        };
      case 'loop':
        return {
          ...baseProps,
          nodeType: 'loop' as const,
          loopType: 'fixed',
          maxIterations: 5,
          breakCondition: '',
        };
      case 'extract':
        return {
          ...baseProps,
          nodeType: 'extract' as const,
          selector: '',
          attribute: 'text',
          variableName: '',
        };
      case 'profile':
        return {
          ...baseProps,
          nodeType: 'profile' as const,
          profileName: 'default',
          incognitoMode: false,
        };
      default:
        throw new Error(`Unknown node type: ${nodeType}`);
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
      connections: [],
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode);
    setIsEditing(true);
  };

  const handleRemoveConnection = (sourceId: string, targetId: string) => {
    setNodes(prev => prev.map(node => {
      if (node.id === sourceId) {
        return {
          ...node,
          connections: node.connections.filter(id => id !== targetId)
        };
      }
      return node;
    }));
  };

  const drawConnections = () => {
    return nodes.map(node => 
      node.connections.map(targetId => {
        const targetNode = nodes.find(n => n.id === targetId);
        if (!targetNode) return null;

        const startX = node.position.x + 200; // Right edge of source node
        const startY = node.position.y + 40; // Middle of source node
        const endX = targetNode.position.x; // Left edge of target node
        const endY = targetNode.position.y + 40; // Middle of target node

        // Calculate the middle point of the connection
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        const isHovered = hoveredConnection?.sourceId === node.id && hoveredConnection?.targetId === targetId;

        return (
          <svg
            key={`${node.id}-${targetId}`}
            className="connection-line"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: isHovered ? 2 : 0,
            }}
          >
            <path
              d={`M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`}
              stroke={isHovered ? "#2196f3" : "#666"}
              strokeWidth={isHovered ? 2 : 1.5}
              fill="none"
              markerEnd="url(#arrowhead)"
            />
            <g 
              transform={`translate(${midX - 8}, ${midY - 8})`}
              style={{ cursor: 'pointer', pointerEvents: 'all' }}
              onMouseEnter={() => setHoveredConnection({ sourceId: node.id, targetId })}
              onMouseLeave={() => setHoveredConnection(null)}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleRemoveConnection(node.id, targetId);
              }}
            >
              <text
                x="8"
                y="10"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isHovered ? "#f44336" : "#666"}
                style={{ userSelect: 'none', fontSize: '16px' }}
              >
                ×
              </text>
            </g>
          </svg>
        );
      })
    );
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
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={(e) => {
          handleCanvasMouseUp(e);
          if (connectingNode) {
            handleNodeMouseUp(e, connectingNode);
          }
        }}
        onMouseLeave={(e) => {
          handleCanvasMouseUp(e);
          if (connectingNode) {
            handleNodeMouseUp(e, connectingNode);
          }
          setHoveredConnection(null);
        }}
        style={{
          transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
          transformOrigin: '0 0',
        }}
      >
        <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="4"
              refX="5"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 6 2, 0 4" fill="#666" />
            </marker>
          </defs>
        </svg>
        {drawConnections()}
        {nodes.map(node => (
          <div
            key={node.id}
            className={`workflow-node ${draggedNode?.id === node.id ? 'dragging' : ''} ${connectingNode?.id === node.id ? 'connecting' : ''}`}
            data-type={node.type}
            style={{
              left: node.position.x,
              top: node.position.y,
              zIndex: draggedNode?.id === node.id ? 1000 : 1,
            }}
            onClick={(e) => handleNodeClick(e, node)}
            onMouseDown={(e) => handleNodeMouseDown(e, node)}
            onMouseUp={(e) => handleNodeMouseUp(e, node)}
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