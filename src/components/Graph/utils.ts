import { Template } from './types';

// Helper: cardinality formatting [min, max], with * for null max
export function formatCardinality(
  minCount: number | null,
  maxCount: number | null
): string {
  const min = typeof minCount === 'number' ? minCount : 0;
  const max = typeof maxCount === 'number' ? String(maxCount) : '*';
  return `[${min}, ${max}]`;
}

// Hierarchical tree layout algorithm (left-to-right orientation)
export function computeHierarchicalLayout(
  templates: Template[],
  targetClassIdToTemplate: Map<string, Template>
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const visited = new Set<string>();
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
