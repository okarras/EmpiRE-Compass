import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
  DefaultEdgeOptions,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';
import { PredicatesMapping, Template, TemplateGraphProps } from './types';
import { PropertyMapping } from './types';

import { computeHierarchicalLayout } from './utils';
import { TemplateNode } from './TemplateNode';

const nodeTypes = { templateNode: TemplateNode } as const;

export const TemplateGraph: React.FC<TemplateGraphProps> = ({
  data,
  loading = false,
  error = null,
}) => {
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
    const templateNodes = templates.map((t) => {
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

    return templateNodes;
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
            type: 'default', // Changed from 'bezier' to 'default'
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

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update the state when initialNodes/initialEdges change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);

    // Re-run fitView when nodes change to ensure the layout is visible
    if (reactFlowInstanceRef.current && initialNodes.length > 0) {
      setTimeout(() => {
        reactFlowInstanceRef.current?.fitView({ padding: 0.1, duration: 200 });
      }, 100);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const defaultEdgeOptions: DefaultEdgeOptions = useMemo(
    () => ({
      animated: true,
      style: { stroke: '#EA7070', strokeWidth: 4 },
      type: 'default', // Changed from 'bezier' to 'default'
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

  const generateTemplateMapping = useCallback(() => {
    const predicatesMapping: PredicatesMapping = {};

    // Create a map of templates by their target class ID for quick lookup
    const templateMap = new Map<string, Template>();
    templates.forEach((template) => {
      if (template.target_class?.id) {
        templateMap.set(template.target_class.id, template);
      }
    });

    // Process each template and its properties
    templates.forEach((template) => {
      if (!template.properties || template.properties.length === 0) return;

      template.properties.forEach((property) => {
        const pathId = property.path?.id;
        if (!pathId) return;

        // Determine cardinality based on min_count and max_count
        let cardinality = 'one to one';
        if (property.max_count === null || property.max_count > 1) {
          cardinality = 'one to many';
        }

        const propertyMapping: PropertyMapping = {
          label: property.label,
          cardinality,
          description: property.description || property.label,
          comma_separated: false,
        };

        // If property has a class (object property), it's a subtemplate
        if (property.class?.id) {
          const targetTemplate = templateMap.get(property.class.id);
          if (targetTemplate) {
            propertyMapping.subtemplate_id = targetTemplate.id;
            propertyMapping.class_id = property.class.id;

            // Recursively process subtemplate properties
            if (
              targetTemplate.properties &&
              targetTemplate.properties.length > 0
            ) {
              propertyMapping.subtemplate_properties = {};

              targetTemplate.properties.forEach((subProperty) => {
                const subPathId = subProperty.path?.id;
                if (!subPathId) return;

                let subCardinality = 'one to one';
                if (
                  subProperty.max_count === null ||
                  subProperty.max_count > 1
                ) {
                  subCardinality = 'one to many';
                }

                const subPropertyMapping: PropertyMapping = {
                  label: subProperty.label,
                  cardinality: subCardinality,
                  description: subProperty.description || subProperty.label,
                  comma_separated: false,
                };

                // Check if this sub-property also has a class (nested subtemplate)
                if (subProperty.class?.id) {
                  const subTargetTemplate = templateMap.get(
                    subProperty.class.id
                  );
                  if (subTargetTemplate) {
                    subPropertyMapping.subtemplate_id = subTargetTemplate.id;
                    subPropertyMapping.class_id = subProperty.class.id;

                    // Process nested subtemplate properties
                    if (
                      subTargetTemplate.properties &&
                      subTargetTemplate.properties.length > 0
                    ) {
                      subPropertyMapping.subtemplate_properties = {};

                      subTargetTemplate.properties.forEach((nestedProperty) => {
                        const nestedPathId = nestedProperty.path?.id;
                        if (!nestedPathId) return;

                        let nestedCardinality = 'one to one';
                        if (
                          nestedProperty.max_count === null ||
                          nestedProperty.max_count > 1
                        ) {
                          nestedCardinality = 'one to many';
                        }

                        if (subPropertyMapping.subtemplate_properties) {
                          subPropertyMapping.subtemplate_properties[
                            nestedPathId
                          ] = {
                            label: nestedProperty.label,
                            cardinality: nestedCardinality,
                            description:
                              nestedProperty.description ||
                              nestedProperty.label,
                            comma_separated: false,
                          };
                        }
                      });
                    }
                  }
                }

                if (propertyMapping.subtemplate_properties) {
                  propertyMapping.subtemplate_properties[subPathId] =
                    subPropertyMapping;
                }
              });
            }
          }
        }

        predicatesMapping[pathId] = propertyMapping;
      });
    });

    return predicatesMapping;
  }, [templates]);

  const handleDownloadImage = useCallback(async () => {
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
      const padding = 80;
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
  }, [nodes]);

  const handleDownloadJSON = useCallback(() => {
    try {
      const predicatesMapping = generateTemplateMapping();
      const jsonString = JSON.stringify(predicatesMapping, null, 2);

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      const timestamp = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const fileName = `template-mapping-${timestamp.getFullYear()}${pad(timestamp.getMonth() + 1)}${pad(timestamp.getDate())}-${pad(timestamp.getHours())}${pad(timestamp.getMinutes())}${pad(timestamp.getSeconds())}.json`;

      link.download = fileName;
      link.href = url;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export template mapping:', error);
    }
  }, [generateTemplateMapping]);

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f2329',
          color: '#e5e7eb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            Loading template data...
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            Fetching template information from ORKG
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f2329',
          color: '#e5e7eb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{ fontSize: '18px', marginBottom: '8px', color: '#ef4444' }}
          >
            Error loading templates
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f2329',
          color: '#e5e7eb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            No template data available
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            No templates were found or loaded
          </div>
        </div>
      </div>
    );
  }

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
      <div
        style={{
          position: 'absolute',
          left: 48,
          bottom: 12,
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          data-html2image-exclude
          onClick={handleDownloadImage}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #A8A8AF',
            background: '#EA7070',
            color: '#e5e7eb',
            cursor: 'pointer',
          }}
        >
          Download as Image
        </button>
        <button
          data-html2image-exclude
          onClick={handleDownloadJSON}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #A8A8AF',
            background: '#4CAF50',
            color: '#e5e7eb',
            cursor: 'pointer',
          }}
        >
          Download as JSON
        </button>
      </div>
    </div>
  );
};

export default TemplateGraph;
