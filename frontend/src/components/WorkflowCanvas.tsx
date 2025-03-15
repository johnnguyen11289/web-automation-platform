import React, { useState, useEffect } from 'react';
import { NodeProperties } from '../types/node.types';
import NodePropertiesEditor from './NodePropertiesEditor';
import { ZoomIn, ZoomOut, Save, FiberManualRecord } from '@mui/icons-material';
import { IconButton, Button, Snackbar, Alert } from '@mui/material';
import { Workflow } from '../services/api';
import './WorkflowCanvas.css';

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  properties: NodeProperties;
  connections: string[]; // Array of node IDs this node connects to
}

interface WorkflowCanvasProps {
  workflow: Workflow | null;
  onSave: (workflow: { nodes: any[]; name: string; description?: string }) => Promise<boolean>;
  initialWorkflow?: Workflow | null;
  onCreateNew?: () => void;
  onStartRecording?: () => void;
  isRecording?: boolean;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ workflow, onSave, initialWorkflow, onCreateNew, onStartRecording, isRecording = false }) => {
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
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showSaveError, setShowSaveError] = useState(false);
  const [showVariableManagerError, setShowVariableManagerError] = useState(false);

  // Load initial workflow data when it changes
  useEffect(() => {
    if (initialWorkflow) {
      console.log('Loading initial workflow:', initialWorkflow);
      // Ensure nodes have proper position format
      const initializedNodes = initialWorkflow.nodes.map(node => ({
        ...node,
        position: {
          x: typeof node.position.x === 'number' ? node.position.x : 0,
          y: typeof node.position.y === 'number' ? node.position.y : 0
        }
      }));
      
      setNodes(initializedNodes);
      setWorkflowName(initialWorkflow.name);
      setWorkflowDescription(initialWorkflow.description || '');
      
      // Reset canvas state
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setIsDraggingNode(false);
      setDraggedNode(null);
      setConnectingNode(null);
      setSelectedNode(null);
      setIsEditing(false);
    } else {
      // Reset to empty state when no workflow is selected
      console.log('Resetting workflow state');
      setNodes([]);
      setWorkflowName('New Workflow');
      setWorkflowDescription('');
      setSelectedNode(null);
      setIsEditing(false);
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setIsDraggingNode(false);
      setDraggedNode(null);
      setConnectingNode(null);
    }
  }, [initialWorkflow]);

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
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }

    // Handle node dragging
    if (isDraggingNode && draggedNode && !connectingNode) {
      handleNodeMouseMove(e);
    }

    // Update temporary connection line
    if (connectingNode) {
      const canvasRect = e.currentTarget.getBoundingClientRect();
      if (!canvasRect) return;
      
      // Convert mouse coordinates to canvas coordinates
      const mouseX = (e.clientX - canvasRect.left) / scale;
      const mouseY = (e.clientY - canvasRect.top) / scale;
      setTempConnection({ x: mouseX, y: mouseY });
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    setIsDraggingCanvas(false);
    // If we're dragging a node and mouse up happens on canvas, stop dragging
    if (isDraggingNode && draggedNode) {
      setIsDraggingNode(false);
      setDraggedNode(null);
      setConnectingNode(null);
      setTempConnection(null);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    if ((e.target as HTMLElement).closest('.delete-node-button')) {
      return;
    }

    const currentTime = new Date().getTime();

    // Start connection mode with Shift + Left Click
    if (e.shiftKey && e.button === 0) {
      e.preventDefault();
      // Start connection mode
      setConnectingNode(node);
      const canvasRect = e.currentTarget.parentElement?.getBoundingClientRect();
      if (!canvasRect) return;
      
      // Convert mouse coordinates to canvas coordinates
      const mouseX = (e.clientX - canvasRect.left) / scale;
      const mouseY = (e.clientY - canvasRect.top) / scale;
      setTempConnection({ x: mouseX, y: mouseY });
      return;
    }

    if (currentTime - lastClickTime < 300) {
      // Double click detected
      e.stopPropagation();
      setSelectedNode(node);
      setIsEditing(true);
      setLastClickTime(0);
      return;
    }

    // Handle dragging
    setIsDraggingNode(true);
    setDraggedNode(node);
    setLastClickTime(currentTime);

    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!canvasRect) return;

    // Calculate the offset relative to the node's position
    const nodeX = node.position.x * scale + offset.x * scale;
    const nodeY = node.position.y * scale + offset.y * scale;
    
    setDragOffset({
      x: e.clientX - nodeX,
      y: e.clientY - nodeY
    });
  };

  const handleNodeMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingNode || !draggedNode) return;

    // Clear any temporary connection while dragging
    if (connectingNode) {
      setConnectingNode(null);
      setTempConnection(null);
    }

    // Calculate the new position in canvas coordinates
    const newX = (e.clientX - dragOffset.x) / scale - offset.x;
    const newY = (e.clientY - dragOffset.y) / scale - offset.y;
    
    const position = snapToGrid({
      x: newX,
      y: newY
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
    e.stopPropagation();
    e.preventDefault();

    // Handle connection creation
    if (connectingNode && connectingNode.id !== targetNode.id) {
      // Prevent connections to/from VariableManager nodes
      if (connectingNode.type === 'variableManager' || targetNode.type === 'variableManager') {
        setConnectingNode(null);
        setTempConnection(null);
        return;
      }

      // Check if connection already exists
      const connectionExists = connectingNode.connections.includes(targetNode.id);
      
      if (!connectionExists) {
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
    }

    // Clear all states
    setConnectingNode(null);
    setTempConnection(null);
    setIsDraggingNode(false);
    setDraggedNode(null);
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
      stopOnError: false,
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
          waitUntil: 'networkidle',
        };
      case 'click':
        return {
          ...baseProps,
          nodeType: 'click' as const,
          selector: '',
          button: 'left',
          clickCount: 1,
          delay: 0,
          waitForNavigation: false,
        };
      case 'type':
        return {
          ...baseProps,
          nodeType: 'type' as const,
          selector: '',
          value: '',
          clearFirst: false,
          delay: 0,
          pressEnter: false,
        };
      case 'select':
        return {
          ...baseProps,
          nodeType: 'select' as const,
          selector: '',
          value: '',
        };
      case 'wait':
        return {
          ...baseProps,
          nodeType: 'wait' as const,
          condition: 'delay',
          delay: 1000,
        };
      case 'extract':
        return {
          ...baseProps,
          nodeType: 'extract' as const,
          selector: '',
          key: '',
          attribute: 'text',
        };
      case 'evaluate':
        return {
          ...baseProps,
          nodeType: 'evaluate' as const,
          script: '',
          key: '',
        };
      case 'keyboard':
        return {
          ...baseProps,
          nodeType: 'keyboard' as const,
          key: '',
        };
      case 'focus':
        return {
          ...baseProps,
          nodeType: 'focus' as const,
          selector: '',
        };
      case 'hover':
        return {
          ...baseProps,
          nodeType: 'hover' as const,
          selector: '',
        };
      case 'screenshot':
        return {
          ...baseProps,
          nodeType: 'screenshot' as const,
          selector: '',
          path: `screenshot-${Date.now()}.png`,
        };
      case 'scroll':
        return {
          ...baseProps,
          nodeType: 'scroll' as const,
          selector: '',
          direction: 'down',
          amount: 0,
          smooth: true,
        };
      case 'iframe':
        return {
          ...baseProps,
          nodeType: 'iframe' as const,
          selector: '',
          action: 'switch',
        };
      case 'alert':
        return {
          ...baseProps,
          nodeType: 'alert' as const,
          action: 'accept',
          text: '',
        };
      case 'cookie':
        return {
          ...baseProps,
          nodeType: 'cookie' as const,
          action: 'get',
          name: '',
          value: '',
        };
      case 'storage':
        return {
          ...baseProps,
          nodeType: 'storage' as const,
          storageType: 'local',
          action: 'get',
          key: '',
          value: '',
        };
      case 'fileUpload':
        return {
          ...baseProps,
          nodeType: 'fileUpload' as const,
          selector: '',
          filePath: '',
        };
      case 'dragDrop':
        return {
          ...baseProps,
          nodeType: 'dragDrop' as const,
          sourceSelector: '',
          targetSelector: '',
        };
      case 'network':
        return {
          ...baseProps,
          nodeType: 'network' as const,
          action: 'block',
          urlPattern: '',
          response: {},
        };
      case 'walletConnect':
        return {
          ...baseProps,
          nodeType: 'walletConnect' as const,
          walletType: 'metamask',
          network: 'ethereum',
          action: 'connect',
        };
      case 'walletSign':
        return {
          ...baseProps,
          nodeType: 'walletSign' as const,
          action: 'signMessage',
          message: '',
          transaction: {},
          key: '',
        };
      case 'walletSend':
        return {
          ...baseProps,
          nodeType: 'walletSend' as const,
          action: 'sendTransaction',
          to: '',
          amount: '',
          token: '',
          network: 'ethereum',
          key: '',
        };
      case 'walletBalance':
        return {
          ...baseProps,
          nodeType: 'walletBalance' as const,
          action: 'getBalance',
          token: '',
          network: 'ethereum',
          key: '',
        };
      case 'walletApprove':
        return {
          ...baseProps,
          nodeType: 'walletApprove' as const,
          action: 'approveToken',
          token: '',
          spender: '',
          amount: '',
          network: 'ethereum',
          key: '',
        };
      case 'walletSwitch':
        return {
          ...baseProps,
          nodeType: 'walletSwitch' as const,
          action: 'switchNetwork',
          network: 'ethereum',
          chainId: 1,
        };
      default:
        return {
          ...baseProps,
          nodeType: nodeType as any,
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

    // Check if trying to add a VariableManager node when one already exists
    if (nodeType === 'variableManager') {
      const existingVariableManager = nodes.find(node => node.type === 'variableManager');
      if (existingVariableManager) {
        setShowVariableManagerError(true);
        return;
      }
    }

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
    // Helper function to calculate intersection point with circle
    const getCircleIntersection = (x1: number, y1: number, x2: number, y2: number, cx: number, cy: number, radius: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      // Normalize direction vector
      const ux = dx / len;
      const uy = dy / len;
      
      // Calculate intersection point
      const px = cx + ux * radius;
      const py = cy + uy * radius;
      
      return { x: px, y: py };
    };

    // Create a Set to track unique connections
    const uniqueConnections = new Set<string>();

    return (
      <>
        {nodes.map(node => 
          node.connections.map(targetId => {
            const targetNode = nodes.find(n => n.id === targetId);
            if (!targetNode) return null;

            // Create a unique key for this connection
            const connectionKey = [node.id, targetId].sort().join('-');
            if (uniqueConnections.has(connectionKey)) return null;
            uniqueConnections.add(connectionKey);

            // Calculate center points of the nodes
            const sourceX = node.position.x + 60;
            const sourceY = node.position.y + 60;
            const targetX = targetNode.position.x + 60;
            const targetY = targetNode.position.y + 60;

            // Calculate intersection points with circles
            const sourceIntersection = getCircleIntersection(sourceX, sourceY, targetX, targetY, sourceX, sourceY, 60);
            const targetIntersection = getCircleIntersection(targetX, targetY, sourceX, sourceY, targetX, targetY, 60);

            // Calculate the middle point of the connection
            const midX = (sourceIntersection.x + targetIntersection.x) / 2;
            const midY = (sourceIntersection.y + targetIntersection.y) / 2;

            const isHovered = hoveredConnection?.sourceId === node.id && hoveredConnection?.targetId === targetId;

            return (
              <svg
                key={connectionKey}
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
                  d={`M ${sourceIntersection.x} ${sourceIntersection.y} C ${sourceIntersection.x + 50} ${sourceIntersection.y}, ${targetIntersection.x - 50} ${targetIntersection.y}, ${targetIntersection.x} ${targetIntersection.y}`}
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
        )}
        {/* Temporary connection line */}
        {connectingNode && tempConnection && (
          <svg
            className="temp-connection-line"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            {/* Calculate intersection point for the source node */}
            {(() => {
              const sourceX = connectingNode.position.x + 60;
              const sourceY = connectingNode.position.y + 60;
              const sourceIntersection = getCircleIntersection(
                sourceX, sourceY,
                tempConnection.x, tempConnection.y,
                sourceX, sourceY,
                60
              );

              return (
                <path
                  d={`M ${sourceIntersection.x} ${sourceIntersection.y} C ${sourceIntersection.x + 50} ${sourceIntersection.y}, ${tempConnection.x - 50} ${tempConnection.y}, ${tempConnection.x} ${tempConnection.y}`}
                  stroke="#2196f3"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
              );
            })()}
          </svg>
        )}
      </>
    );
  };

  const handleSave = async () => {
    console.log('Canvas: Starting save process');
    try {
      if (onSave) {
        console.log('Canvas: Calling onSave with data:', {
          nodes,
          name: workflowName,
          description: workflowDescription,
        });
        const success = await onSave({
          nodes,
          name: workflowName,
          description: workflowDescription,
        });
        console.log('Canvas: Save result:', success);
        if (success) {
          setShowSaveSuccess(true);
        } else {
          setShowSaveError(true);
        }
      } else {
        console.error('Canvas: onSave prop is not provided');
        setShowSaveError(true);
      }
    } catch (error) {
      console.error('Canvas: Error saving workflow:', error);
      setShowSaveError(true);
    }
  };

  // Add context menu prevention
  const handleContextMenu = (e: React.MouseEvent) => {
    if (connectingNode) {
      e.preventDefault();
    }
  };

  return (
    <div className="workflow-canvas">
      <div className="workflow-header">
        <div className="workflow-info">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="workflow-name-input"
            placeholder="Workflow Name"
          />
          <input
            type="text"
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            className="workflow-description-input"
            placeholder="Workflow Description (optional)"
          />
        </div>
        <div className="workflow-actions">
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              console.log('Canvas: Create New button clicked');
              if (onCreateNew) {
                onCreateNew();
              }
            }}
            sx={{ mr: 1 }}
          >
            Create New
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FiberManualRecord />}
            onClick={onStartRecording}
            disabled={isRecording}
            sx={{ mr: 1 }}
          >
            {isRecording ? 'Recording...' : 'Record Workflow'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={nodes.length === 0}
          >
            Save Workflow
          </Button>
        </div>
      </div>
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
        onContextMenu={handleContextMenu}
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
            data-name={node.properties.nodeName}
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

      <Snackbar
        open={showSaveSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSaveSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSaveSuccess(false)}>
          Workflow saved successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={showSaveError}
        autoHideDuration={3000}
        onClose={() => setShowSaveError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setShowSaveError(false)}>
          Error saving workflow. Please try again.
        </Alert>
      </Snackbar>

      <Snackbar
        open={showVariableManagerError}
        autoHideDuration={3000}
        onClose={() => setShowVariableManagerError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setShowVariableManagerError(false)}>
          Only one Variable Manager node is allowed per workflow.
        </Alert>
      </Snackbar>
    </div>
  );
};

export default WorkflowCanvas; 