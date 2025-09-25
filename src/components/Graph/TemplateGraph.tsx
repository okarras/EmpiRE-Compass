import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
  DefaultEdgeOptions,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { createPortal } from 'react-dom';

// Types representing the JSON schema pieces we use
type Template = {
  id: string;
  label: string;
  description?: string | null;
  target_class: {
    id: string;
    label: string;
  };
  properties?: TemplateProperty[];
};

type TemplateProperty = {
  id: string;
  label: string;
  description?: string | null;
  order?: number;
  min_count: number | null;
  max_count: number | null;
  path: { id: string; label: string };
  class?: { id: string; label: string };
  datatype?: { id: string; label: string };
};

// Helper: cardinality formatting [min, max], with * for null max
function formatCardinality(
  minCount: number | null,
  maxCount: number | null
): string {
  const min = typeof minCount === 'number' ? minCount : 0;
  const max = typeof maxCount === 'number' ? String(maxCount) : '*';
  return `[${min}, ${max}]`;
}

// Row component for a single property with hover tooltip
const PropertyRow: React.FC<{
  nodeId: string;
  property: TemplateProperty;
}> = ({ nodeId, property }) => {
  const [isHover, setIsHover] = React.useState(false);
  const [tooltipPos, setTooltipPos] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const liRef = React.useRef<HTMLLIElement | null>(null);

  const handleId = `${nodeId}::prop::${property.id}`;
  const label = (property.path?.label ?? property.label)?.trim();
  const propertyId = property.path?.id ?? '—';
  const descriptionText = property.description ?? '—';

  const showTooltip = () => {
    const rect = liRef.current?.getBoundingClientRect();
    if (!rect) return;
    const desiredWidth = 260;
    const horizontalPadding = 12;
    const left = Math.max(horizontalPadding, rect.left - desiredWidth - 20);
    const top = Math.max(8, rect.top - 8);
    setTooltipPos({ x: left, y: top });
    setIsHover(true);
  };

  const hideTooltip = () => {
    setIsHover(false);
    setTooltipPos(null);
  };

  return (
    <li
      key={property.id}
      ref={liRef}
      style={{
        position: 'relative',
        padding: '6px 8px',
        borderRadius: 6,
        border: '1px solid #3c414b',
        marginBottom: 6,
        background: '#1f2329',
      }}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {/* Source handle on the right for possible outgoing edge from this property */}
      <Handle
        type="source"
        position={Position.Right}
        id={handleId}
        style={{
          width: 10,
          height: 10,
          right: -5,
          background: '#EA7070',
          border: '2px solid #3c414b',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span>{label}</span>
        <span style={{ color: '#9ca3af', whiteSpace: 'nowrap' }}>
          {formatCardinality(
            property.min_count ?? 0,
            property.max_count ?? null
          )}
        </span>
      </div>
      {isHover &&
        tooltipPos &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: tooltipPos.y,
              left: tooltipPos.x,
              width: 260,
              zIndex: 9999,
              background: '#2b2f36',
              color: '#e5e7eb',
              border: '1px solid #3c414b',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              padding: '8px 10px',
              pointerEvents: 'none',
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{ minWidth: 92, color: '#9ca3af' }}>Property id</div>
              <div style={{ fontWeight: 600 }}>{propertyId}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ minWidth: 92, color: '#9ca3af' }}>Description</div>
              <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                {descriptionText}
              </div>
            </div>
          </div>,
          document.body
        )}
    </li>
  );
};

// Custom node that renders the template label and its properties with handles per property
const TemplateNode: React.FC<{
  data: { title: string; properties: TemplateProperty[]; nodeId: string };
}> = ({ data }) => {
  return (
    <div
      style={{
        background: '#2b2f36',
        color: '#e5e7eb',
        borderRadius: 8,
        border: '1px solid #3c414b',
        minWidth: 260,
      }}
    >
      {/* General target handle for incoming edges */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${data.nodeId}::target`}
        style={{
          width: 10,
          height: 10,
          left: -5,
          background: '#a78bfa',
          border: '2px solid #3c414b',
        }}
      />
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #3c414b',
          fontWeight: 600,
        }}
      >
        {data.title}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 8 }}>
        {data.properties.map((prop) => (
          <PropertyRow key={prop.id} nodeId={data.nodeId} property={prop} />
        ))}
      </ul>
    </div>
  );
};

const nodeTypes = { templateNode: TemplateNode } as const;

export type TemplateGraphProps = {
  data: Template[];
};

// Hierarchical tree layout algorithm (left-to-right orientation)
function computeHierarchicalLayout(
  templates: Template[],
  targetClassIdToTemplate: Map<string, Template>
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const visited = new Set<string>();
  const nodeWidth = 300; // Approximate node width
  const nodeHeight = 200; // Approximate node height
  const horizontalSpacing = 400; // Horizontal spacing between levels (now x-axis)
  const verticalSpacing = 300; // Vertical spacing between nodes at same level (now y-axis)

  // Find the root node (Empirical Research Practice)
  const rootTemplate = templates.find(
    (t) =>
      t.target_class?.id === 'C27001' ||
      t.label === 'Empirical Research Practice'
  );

  if (!rootTemplate) {
    // Fallback to first template if root not found
    const firstTemplate = templates[0];
    if (firstTemplate) {
      const nodeId = firstTemplate.target_class?.id ?? firstTemplate.id;
      positions[nodeId] = { x: 0, y: 0 };
    }
    return positions;
  }

  const rootNodeId = rootTemplate.target_class?.id ?? rootTemplate.id;

  // Build adjacency list for the graph
  const adjacencyList = new Map<string, string[]>();
  const reverseAdjacencyList = new Map<string, string[]>();

  // Initialize adjacency lists
  templates.forEach((t) => {
    const nodeId = t.target_class?.id ?? t.id;
    adjacencyList.set(nodeId, []);
    reverseAdjacencyList.set(nodeId, []);
  });

  // Build connections
  templates.forEach((sourceTemplate) => {
    const sourceNodeId = sourceTemplate.target_class?.id ?? sourceTemplate.id;
    (sourceTemplate.properties ?? []).forEach((prop) => {
      if (prop.class?.id) {
        const targetTemplate = targetClassIdToTemplate.get(prop.class.id);
        if (targetTemplate) {
          const targetNodeId =
            targetTemplate.target_class?.id ?? targetTemplate.id;
          adjacencyList.get(sourceNodeId)?.push(targetNodeId);
          reverseAdjacencyList.get(targetNodeId)?.push(sourceNodeId);
        }
      }
    });
  });

  // BFS to assign levels and positions
  const queue: Array<{ nodeId: string; level: number; parentY?: number }> = [];
  const levels = new Map<string, number>();
  const levelNodes = new Map<number, string[]>();

  // Start with root node
  queue.push({ nodeId: rootNodeId, level: 0 });
  levels.set(rootNodeId, 0);
  levelNodes.set(0, [rootNodeId]);
  visited.add(rootNodeId);

  // BFS to assign levels
  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;
    const children = adjacencyList.get(nodeId) || [];

    children.forEach((childId) => {
      if (!visited.has(childId)) {
        visited.add(childId);
        const childLevel = level + 1;
        levels.set(childId, childLevel);

        if (!levelNodes.has(childLevel)) {
          levelNodes.set(childLevel, []);
        }
        levelNodes.get(childLevel)!.push(childId);

        queue.push({ nodeId: childId, level: childLevel });
      }
    });
  }

  // Position nodes level by level (left-to-right orientation)
  levelNodes.forEach((nodes, level) => {
    const x = level * horizontalSpacing; // x increases with level (left to right)
    const totalHeight = (nodes.length - 1) * verticalSpacing;
    const startY = -totalHeight / 2; // center nodes vertically within each level

    nodes.forEach((nodeId, index) => {
      const y = startY + index * verticalSpacing;
      positions[nodeId] = { x, y };
    });
  });

  // Handle any remaining unvisited nodes (disconnected components)
  templates.forEach((t) => {
    const nodeId = t.target_class?.id ?? t.id;
    if (!visited.has(nodeId)) {
      // Position disconnected nodes to the right
      const maxX = Math.max(...Object.values(positions).map((p) => p.x), 0);
      const maxY = Math.max(...Object.values(positions).map((p) => p.y), 0);
      positions[nodeId] = { x: maxX + horizontalSpacing, y: maxY };
    }
  });

  return positions;
}

export const TemplateGraph: React.FC<TemplateGraphProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const templates = useMemo(
    () => (Array.isArray(data) ? (data as Template[]) : []),
    [data]
  );
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  // Map target_class.id -> template for quick lookup when creating edges
  const targetClassIdToTemplate = useMemo(() => {
    const map = new Map<string, Template>();
    templates.forEach((t) => {
      if (t.target_class?.id) map.set(t.target_class.id, t);
    });
    return map;
  }, [templates]);

  // Compute hierarchical positions
  const positions = useMemo(() => {
    return computeHierarchicalLayout(templates, targetClassIdToTemplate);
  }, [templates, targetClassIdToTemplate]);

  const initialNodes = useMemo<Node[]>(() => {
    return templates.map((t) => {
      const nodeId = t.target_class?.id ?? t.id;
      return {
        id: nodeId,
        position: positions[nodeId] ?? { x: 0, y: 0 },
        data: {
          title: t.label,
          properties: (t.properties ?? [])
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
          nodeId,
        },
        type: 'templateNode' as const,
      };
    });
  }, [templates, positions]);

  const initialEdges = useMemo<Edge[]>(() => {
    const edges: Edge[] = [];
    templates.forEach((sourceTemplate) => {
      const sourceNodeId = sourceTemplate.target_class?.id ?? sourceTemplate.id;
      (sourceTemplate.properties ?? []).forEach((prop) => {
        // An edge exists if the property has a class (object property)
        if (prop.class?.id) {
          const targetTemplate = targetClassIdToTemplate.get(prop.class.id);
          if (!targetTemplate) return;
          const targetNodeId =
            targetTemplate.target_class?.id ?? targetTemplate.id;
          const sourceHandle = `${sourceNodeId}::prop::${prop.id}`;
          const edgeId = `${sourceHandle}=>${targetNodeId}`;
          edges.push({
            id: edgeId,
            source: sourceNodeId,
            target: targetNodeId,
            sourceHandle,
            animated: true,
            type: 'bezier',
            interactionWidth: 40,
            style: { stroke: '#EA7070', strokeWidth: 4 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#EA7070',
              width: 16,
              height: 16,
            },
          });
        }
      });
    });
    return edges;
  }, [templates, targetClassIdToTemplate]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const defaultEdgeOptions: DefaultEdgeOptions = useMemo(
    () => ({
      animated: true,
      style: { stroke: '#EA7070', strokeWidth: 4 },
      type: 'bezier',
      interactionWidth: 40,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#EA7070',
        width: 16,
        height: 16,
      },
    }),
    []
  );

  const handleDownload = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      const rfEl = containerRef.current.querySelector(
        '.react-flow'
      ) as HTMLElement | null;
      if (!rfEl) return;

      const instance = reactFlowInstanceRef.current;
      let originalViewport: { x: number; y: number; zoom: number } | null =
        null;

      // Compute bounding box of all nodes to size the export image dynamically
      // Fallback to current viewport if node sizes are not yet measured
      const currentNodes =
        (instance?.getNodes ? instance.getNodes() : null) ||
        (Array.isArray(nodes) ? nodes : []);
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      currentNodes.forEach((n) => {
        const x = n.positionAbsolute?.x ?? n.position.x;
        const y = n.positionAbsolute?.y ?? n.position.y;
        const w = n.width ?? 0;
        const h = n.height ?? 0;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      });

      // If bounds are invalid, fallback to fitView method
      const hasValidBounds =
        Number.isFinite(minX) &&
        Number.isFinite(minY) &&
        Number.isFinite(maxX) &&
        Number.isFinite(maxY) &&
        maxX > minX &&
        maxY > minY;
      const padding = 80; // px padding around the graph in the export
      let cleanupViewportTransform: (() => void) | null = null;

      if (instance) {
        originalViewport = instance.getViewport();
      }

      if (hasValidBounds) {
        const exportWidth = Math.ceil(maxX - minX + padding * 2);
        const exportHeight = Math.ceil(maxY - minY + padding * 2);

        // Resize the container element to fit all nodes
        const originalWidth = rfEl.style.width;
        const originalHeight = rfEl.style.height;
        rfEl.style.width = `${exportWidth}px`;
        rfEl.style.height = `${exportHeight}px`;

        // Translate the viewport so the graph fits inside with padding
        const viewportEl = rfEl.querySelector(
          '.react-flow__viewport'
        ) as HTMLElement | null;
        const originalTransform = viewportEl?.style.transform ?? '';
        if (viewportEl) {
          viewportEl.style.transform = `translate(${padding - minX}px, ${padding - minY}px) scale(1)`;
        }

        cleanupViewportTransform = () => {
          if (viewportEl) viewportEl.style.transform = originalTransform;
          rfEl.style.width = originalWidth;
          rfEl.style.height = originalHeight;
        };

        // wait a frame so styles/transforms settle
        await new Promise((resolve) =>
          requestAnimationFrame(() => resolve(null))
        );
      } else if (instance) {
        // Fallback: fitView, then export
        instance.fitView({
          padding: 0.4,
          includeHiddenNodes: true,
          duration: 0,
        });
        await new Promise((resolve) =>
          requestAnimationFrame(() => resolve(null))
        );
      }

      const dataUrl = await toPng(rfEl as HTMLElement, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        filter: (domNode) => {
          const el = domNode as HTMLElement;
          return !(
            el?.dataset &&
            Object.prototype.hasOwnProperty.call(
              el.dataset,
              'html2imageExclude'
            )
          );
        },
      });

      // restore any temporary transforms/sizes
      if (cleanupViewportTransform) cleanupViewportTransform();
      if (instance && originalViewport) {
        instance.setViewport(originalViewport);
      }

      const link = document.createElement('a');
      const timestamp = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const fileName = `template-graph-${timestamp.getFullYear()}${pad(timestamp.getMonth() + 1)}${pad(timestamp.getDate())}-${pad(timestamp.getHours())}${pad(timestamp.getMinutes())}${pad(timestamp.getSeconds())}.png`;
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export graph image:', error);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 600,
        position: 'relative',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance;
        }}
      >
        <Background />
        <MiniMap nodeColor={() => '#2b2f36'} maskColor="rgba(0,0,0,0.1)" />
        <Controls />
      </ReactFlow>
      <button
        data-html2image-exclude
        onClick={handleDownload}
        style={{
          position: 'absolute',
          left: 48,
          bottom: 12,
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #A8A8AF',
          background: '#EA7070',
          color: '#e5e7eb',
          cursor: 'pointer',
        }}
      >
        Download Graph as Image
      </button>
    </div>
  );
};

export default TemplateGraph;
