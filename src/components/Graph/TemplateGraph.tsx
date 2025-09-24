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
        {data.properties.map((prop) => {
          const handleId = `${data.nodeId}::prop::${prop.id}`;
          const label = (prop.path?.label ?? prop.label)?.trim();
          return (
            <li
              key={prop.id}
              style={{
                position: 'relative',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #3c414b',
                marginBottom: 6,
                background: '#1f2329',
              }}
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
                    prop.min_count ?? 0,
                    prop.max_count ?? null
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const nodeTypes = { templateNode: TemplateNode } as const;

export type TemplateGraphProps = {
  data: Template[];
};

// Naive radial layout for nodes so they do not stack at (0,0)
function computeNodePositions<T extends { id: string }>(
  items: T[],
  radius = 500,
  center = { x: 0, y: 0 }
): Record<string, { x: number; y: number }> {
  const angleStep = (2 * Math.PI) / Math.max(items.length, 1);
  const positions: Record<string, { x: number; y: number }> = {};
  items.forEach((item, index) => {
    const angle = index * angleStep;
    positions[item.id] = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
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

  // Compute base positions
  const positions = useMemo(() => {
    const items = templates.map((t) => ({ id: t.target_class?.id ?? t.id }));
    // Ensure enough arc length between neighbors: s = (2πR)/n ≥ desiredSpacing
    // => R ≥ desiredSpacing * n / (2π)
    const desiredSpacing = 340; // px, roughly node width plus gap
    const minBaseRadius = 520; // px, baseline so few nodes aren't too close to center
    const adaptiveRadius = Math.max(
      minBaseRadius,
      (desiredSpacing * Math.max(items.length, 1)) / (2 * Math.PI)
    );
    return computeNodePositions(items, adaptiveRadius, { x: 0, y: 0 });
  }, [templates]);

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
