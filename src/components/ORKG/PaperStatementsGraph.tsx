import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dagre from '@dagrejs/dagre';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  type ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Tooltip,
  IconButton,
  Paper,
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Checkbox,
  FormGroup,
} from '@mui/material';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { fetchOrkgStatementsBundle } from '../../services/orkgStatementsService';
import type { OrkgStatement } from '../../types/orkgStatements';

const MIN_NODE_W = 200;
const MAX_NODE_W = 300;
/** Extra space Dagre reserves around each card (larger = more gap vs edges) */
const DAGRE_PAD_W = 76;
const DAGRE_PAD_H = 68;
/** Fixed left-to-right layout spacing (nodes, ranks, parallel edges, margins) */
const DAGRE_SPACING = {
  nodesep: 200,
  ranksep: 360,
  margin: 112,
  edgesep: 56,
} as const;
const NODE_HEADER_H = 22;
const NODE_INNER_PAD_X = 24;
const LINE_H = 15;
/** ~px per character for wrapping estimate at small caption size */
const EST_CHAR_PX = 6.35;

/** Allowed max triple counts in the graph (user-selectable) */
const GRAPH_BATCH_OPTIONS = [3, 5, 8, 10] as const;

function nodeKey(part: { _class: string; id: string }): string {
  return `${part._class}:${part.id}`;
}

/** Compare ORKG ids whether bundle uses R123 or full IRI */
function normalizeOrkgResourceId(id: string): string {
  const t = id.trim();
  if (t.includes('/')) {
    const seg = t.split('/').pop() ?? t;
    return seg;
  }
  return t;
}

function referenceForPart(part: { _class: string; id: string }): {
  resourceId?: string;
  referenceUrl?: string;
} {
  if (part._class !== 'resource') return {};
  const resourceId = normalizeOrkgResourceId(part.id);
  const referenceUrl = `https://orkg.org/resource/${encodeURIComponent(resourceId)}`;
  return { resourceId, referenceUrl };
}

function displayLabel(part: {
  _class: string;
  id: string;
  label?: string;
}): string {
  const raw = part.label?.trim();
  if (raw) return raw.length > 200 ? `${raw.slice(0, 197)}…` : raw;
  return part.id;
}

function truncateMiddle(s: string, max: number): string {
  if (s.length <= max) return s;
  const half = Math.floor((max - 1) / 2);
  return `${s.slice(0, half)}…${s.slice(-half)}`;
}

function statementRowSummary(s: OrkgStatement): string {
  const sub = truncateMiddle(displayLabel(s.subject), 28);
  const pred = truncateMiddle(s.predicate.label?.trim() || s.predicate.id, 22);
  const obj = truncateMiddle(displayLabel(s.object), 28);
  return `${sub} → ${pred} → ${obj}`;
}

function estimateNodeSize(
  label: string,
  isResource = false
): { width: number; height: number } {
  const singleLineW = Math.min(
    MAX_NODE_W,
    Math.max(MIN_NODE_W, Math.ceil(label.length * 6.4) + NODE_INNER_PAD_X)
  );
  const width = Math.min(MAX_NODE_W, Math.max(MIN_NODE_W, singleLineW));
  const innerW = Math.max(80, width - NODE_INNER_PAD_X);
  const charsPerLine = Math.max(12, Math.floor(innerW / EST_CHAR_PX));
  const lines = Math.max(1, Math.ceil(label.length / charsPerLine));
  // Resource cards render two extra metadata rows (id + reference link).
  const metaLines = isResource ? 2 : 0;
  const bodyH = (lines + metaLines) * LINE_H;
  const height = Math.min(260, Math.max(72, NODE_HEADER_H + bodyH + 36));
  return { width, height };
}

function outgoingCountBySubject(
  statements: OrkgStatement[]
): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of statements) {
    const sk = nodeKey(s.subject);
    m.set(sk, (m.get(sk) ?? 0) + 1);
  }
  return m;
}

/** All object keys reachable from R via directed subject→object edges (not including R) */
function descendantObjectKeys(
  R: string,
  statements: OrkgStatement[]
): Set<string> {
  const hidden = new Set<string>();
  const queue: string[] = [];
  for (const s of statements) {
    if (nodeKey(s.subject) !== R) continue;
    const ok = nodeKey(s.object);
    hidden.add(ok);
    if (s.object._class === 'resource') queue.push(ok);
  }
  while (queue.length) {
    const u = queue.shift()!;
    for (const s of statements) {
      if (nodeKey(s.subject) !== u) continue;
      const ok = nodeKey(s.object);
      if (hidden.has(ok)) continue;
      hidden.add(ok);
      if (s.object._class === 'resource') queue.push(ok);
    }
  }
  return hidden;
}

/** BFS from paper root: child resource key → parent resource key */
function resourceParentMapFromRoot(
  rootKey: string,
  statements: OrkgStatement[]
): Map<string, string> {
  const parent = new Map<string, string>();
  const visited = new Set<string>([rootKey]);
  const queue: string[] = [rootKey];
  while (queue.length) {
    const u = queue.shift()!;
    for (const s of statements) {
      if (nodeKey(s.subject) !== u) continue;
      if (s.object._class !== 'resource') continue;
      const ok = nodeKey(s.object);
      if (visited.has(ok)) continue;
      visited.add(ok);
      parent.set(ok, u);
      queue.push(ok);
    }
  }
  return parent;
}

/** Number of hops from root down to k (0 = root). Only defined for nodes on the tree from root. */
function depthBelowRoot(
  k: string,
  rootKey: string,
  parent: Map<string, string>
): number {
  if (k === rootKey) return 0;
  let d = 0;
  let cur = k;
  while (cur !== rootKey) {
    const p = parent.get(cur);
    if (!p) return 0;
    cur = p;
    d++;
    if (d > 500) return 0;
  }
  return d;
}

function unionHiddenForCollapsed(
  collapsed: Set<string>,
  statements: OrkgStatement[]
): Set<string> {
  const all = new Set<string>();
  collapsed.forEach((k) => {
    descendantObjectKeys(k, statements).forEach((h) => all.add(h));
  });
  return all;
}

function filterStatementsByHidden(
  statements: OrkgStatement[],
  hidden: Set<string>
): OrkgStatement[] {
  return statements.filter(
    (s) => !hidden.has(nodeKey(s.subject)) && !hidden.has(nodeKey(s.object))
  );
}

/** Sub-template hubs: resource objects of the paper that have their own outgoing statements */
function defaultCollapsedSubTemplates(
  statements: OrkgStatement[],
  paperResourceId: string
): Set<string> {
  const paperNorm = normalizeOrkgResourceId(paperResourceId).toLowerCase();
  const out = outgoingCountBySubject(statements);
  const collapsed = new Set<string>();
  for (const s of statements) {
    if (s.object._class !== 'resource') continue;
    const subjNorm = normalizeOrkgResourceId(s.subject.id).toLowerCase();
    if (subjNorm !== paperNorm) continue;
    const ok = nodeKey(s.object);
    if ((out.get(ok) ?? 0) > 0) collapsed.add(ok);
  }
  return collapsed;
}

type NodeExtra = {
  graphKey: string;
  hasBranches: boolean;
  branchCollapsed: boolean;
  hiddenDescendantCount: number;
  onToggleBranch?: () => void;
};

type DagreLayoutOptions = {
  showEdgeLabels: boolean;
};

function layoutWithDagre(
  visibleStatements: OrkgStatement[],
  nodeExtras: Map<string, NodeExtra>,
  layoutOpts: DagreLayoutOptions
): { nodes: Node[]; edges: Edge[] } {
  if (visibleStatements.length === 0) {
    return { nodes: [], edges: [] };
  }

  const merged = new Map<
    string,
    {
      label: string;
      isResource: boolean;
      width: number;
      height: number;
      resourceId?: string;
      referenceUrl?: string;
    }
  >();
  for (const s of visibleStatements) {
    for (const part of [s.subject, s.object]) {
      const k = nodeKey(part);
      const label = displayLabel(part);
      const isResource = part._class === 'resource';
      const { width, height } = estimateNodeSize(label, isResource);
      const { resourceId, referenceUrl } = referenceForPart(part);
      const prev = merged.get(k);
      if (!prev) {
        merged.set(k, {
          label,
          isResource,
          width,
          height,
          resourceId,
          referenceUrl,
        });
      } else {
        merged.set(k, {
          label: prev.label.length >= label.length ? prev.label : label,
          isResource: prev.isResource,
          width: Math.max(prev.width, width),
          height: Math.max(prev.height, height),
          resourceId: prev.resourceId ?? resourceId,
          referenceUrl: prev.referenceUrl ?? referenceUrl,
        });
      }
    }
  }

  const predText = (s: OrkgStatement) =>
    s.predicate.label?.trim() || s.predicate.id;
  const edges: Edge[] = visibleStatements.map((s, i) => ({
    id: `e-${i}`,
    type: 'smoothstep',
    pathOptions: { borderRadius: 28 },
    source: nodeKey(s.subject),
    target: nodeKey(s.object),
    label: layoutOpts.showEdgeLabels ? predText(s) : undefined,
    animated: false,
    style: { stroke: '#90a4ae', strokeWidth: 1.25 },
    labelStyle: layoutOpts.showEdgeLabels
      ? {
          fill: '#455a64',
          fontSize: 9,
          fontWeight: 600,
        }
      : undefined,
    labelShowBg: layoutOpts.showEdgeLabels,
    labelBgStyle: layoutOpts.showEdgeLabels
      ? {
          fill: '#eceff1',
          fillOpacity: 1,
        }
      : undefined,
    labelBgPadding: layoutOpts.showEdgeLabels
      ? ([4, 6] as [number, number])
      : undefined,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#90a4ae',
      width: 9,
      height: 9,
    },
  }));

  try {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: 'LR',
      nodesep: DAGRE_SPACING.nodesep,
      ranksep: DAGRE_SPACING.ranksep,
      marginx: DAGRE_SPACING.margin,
      marginy: DAGRE_SPACING.margin,
      edgesep: DAGRE_SPACING.edgesep,
      ranker: 'network-simplex',
    });

    merged.forEach((m, id) => {
      g.setNode(id, {
        width: m.width + DAGRE_PAD_W,
        height: m.height + DAGRE_PAD_H,
      });
    });

    visibleStatements.forEach((s, i) => {
      g.setEdge(nodeKey(s.subject), nodeKey(s.object), {}, `e-${i}`);
    });

    dagre.layout(g);

    const nodes: Node[] = [...merged.keys()].map((id) => {
      const pos = g.node(id);
      const x = Number.isFinite(pos?.x) ? pos!.x : 0;
      const y = Number.isFinite(pos?.y) ? pos!.y : 0;
      const m = merged.get(id)!;
      const extra = nodeExtras.get(id);
      return {
        id,
        type: 'statementNode',
        position: {
          x: x - m.width / 2,
          y: y - m.height / 2,
        },
        style: {
          width: m.width,
          height: m.height,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: m.label,
          isResource: m.isResource,
          width: m.width,
          height: m.height,
          graphKey: id,
          flowDirection: 'LR' as const,
          resourceId: m.resourceId,
          referenceUrl: m.referenceUrl,
          hasBranches: extra?.hasBranches ?? false,
          branchCollapsed: extra?.branchCollapsed ?? false,
          hiddenDescendantCount: extra?.hiddenDescendantCount ?? 0,
          onToggleBranch: extra?.onToggleBranch,
        },
      };
    });

    return { nodes, edges };
  } catch (err) {
    console.error('[PaperStatementsGraph] dagre layout failed', err);
    const ids = [...merged.keys()];
    const nodes: Node[] = ids.map((id, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const m = merged.get(id)!;
      const extra = nodeExtras.get(id);
      return {
        id,
        type: 'statementNode',
        position: { x: col * (m.width + 140), y: row * (m.height + 96) },
        style: {
          width: m.width,
          height: m.height,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: m.label,
          isResource: m.isResource,
          width: m.width,
          height: m.height,
          graphKey: id,
          flowDirection: 'LR' as const,
          resourceId: m.resourceId,
          referenceUrl: m.referenceUrl,
          hasBranches: extra?.hasBranches ?? false,
          branchCollapsed: extra?.branchCollapsed ?? false,
          hiddenDescendantCount: extra?.hiddenDescendantCount ?? 0,
          onToggleBranch: extra?.onToggleBranch,
        },
      };
    });
    return { nodes, edges };
  }
}

const StatementNode: React.FC<
  NodeProps<{
    label: string;
    isResource: boolean;
    width: number;
    height: number;
    graphKey: string;
    flowDirection?: 'LR';
    resourceId?: string;
    referenceUrl?: string;
    hasBranches: boolean;
    branchCollapsed: boolean;
    hiddenDescendantCount: number;
    onToggleBranch?: () => void;
  }>
> = ({ data }) => {
  const h = data.height ?? 56;
  const showToggle = data.isResource && data.hasBranches && data.onToggleBranch;
  const flowLR = (data.flowDirection ?? 'LR') === 'LR';
  const targetPos = flowLR ? Position.Left : Position.Top;
  const sourcePos = flowLR ? Position.Right : Position.Bottom;

  return (
    <>
      <Handle
        type="target"
        position={targetPos}
        style={{
          width: 6,
          height: 6,
          background: data.isResource ? '#1565c0' : '#78909c',
          border: '2px solid #fff',
        }}
      />
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: h,
          maxWidth: '100%',
          boxSizing: 'border-box',
          px: 1.5,
          py: 1,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          ...(data.isResource
            ? { borderLeftWidth: 3, borderLeftColor: 'primary.main' }
            : {}),
          backgroundColor: data.isResource ? 'background.paper' : 'grey.50',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.07)',
          fontSize: '0.7rem',
          lineHeight: 1.45,
          wordBreak: 'break-word',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {showToggle && (
          <Tooltip
            title={
              data.branchCollapsed
                ? `Expand sub-template (${data.hiddenDescendantCount} hidden nodes)`
                : 'Collapse sub-template'
            }
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                data.onToggleBranch?.();
              }}
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                p: 0.25,
                color: 'primary.main',
              }}
              aria-label={
                data.branchCollapsed ? 'Expand sub-template' : 'Collapse'
              }
            >
              {data.branchCollapsed ? (
                <UnfoldMoreIcon sx={{ fontSize: 18 }} />
              ) : (
                <UnfoldLessIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip>
        )}
        <Typography
          variant="caption"
          component="div"
          sx={{
            fontWeight: 700,
            fontSize: '0.62rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: data.isResource ? 'primary.dark' : 'text.secondary',
            mb: 0.5,
            pr: showToggle ? 2.5 : 0,
          }}
        >
          {data.isResource ? 'Resource' : 'Literal'}
          {data.branchCollapsed && data.hiddenDescendantCount > 0 && (
            <Typography
              component="span"
              variant="caption"
              sx={{
                ml: 0.75,
                fontWeight: 600,
                color: 'primary.main',
                fontSize: '0.6rem',
                textTransform: 'none',
                letterSpacing: 'normal',
              }}
            >
              (+{data.hiddenDescendantCount} hidden)
            </Typography>
          )}
        </Typography>
        <Typography
          variant="body2"
          component="div"
          sx={{
            color: 'text.primary',
            fontSize: '0.74rem',
            fontWeight: 400,
            lineHeight: 1.5,
          }}
        >
          {data.label}
        </Typography>
        {data.isResource && (
          <Box sx={{ mt: 0.75, display: 'grid', gap: 0.25 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontSize: '0.62rem' }}
            >
              Resource ID: {data.resourceId ?? 'N/A'}
            </Typography>
            {data.referenceUrl && (
              <Typography
                component="a"
                href={data.referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                variant="caption"
                sx={{
                  color: 'primary.main',
                  fontSize: '0.62rem',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Reference: {data.referenceUrl}
              </Typography>
            )}
          </Box>
        )}
      </Box>
      <Handle
        type="source"
        position={sourcePos}
        style={{
          width: 6,
          height: 6,
          background: data.isResource ? '#1565c0' : '#78909c',
          border: '2px solid #fff',
        }}
      />
    </>
  );
};

const nodeTypes = { statementNode: StatementNode } as const;

function minimapNodeColor(node: Node): string {
  const res = (node.data as { isResource?: boolean })?.isResource;
  return res ? '#1565c0' : '#b0bec5';
}

export interface PaperStatementsGraphProps {
  resourceId: string;
  height?: number;
  maxLevel?: number;
}

const PaperStatementsGraphInner: React.FC<PaperStatementsGraphProps> = ({
  resourceId,
  height = 420,
  maxLevel = 15,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statements, setStatements] = useState<OrkgStatement[]>([]);
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [graphBatchSize, setGraphBatchSize] = useState<number>(5);
  /** 0 = sliding window, 1 = manual row pick */
  const [graphSelectionTab, setGraphSelectionTab] = useState(0);
  const [graphWindowStart, setGraphWindowStart] = useState(0);
  const [pickedStatementIndices, setPickedStatementIndices] = useState<
    Set<number>
  >(() => new Set());
  const rfInstance = useRef<ReactFlowInstance | null>(null);

  useEffect(() => {
    setGraphWindowStart(0);
    setPickedStatementIndices(new Set());
    setGraphSelectionTab(0);
  }, [resourceId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setStatements([]);
    fetchOrkgStatementsBundle(resourceId, maxLevel)
      .then((rows) => {
        if (!cancelled) setStatements(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load statements'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resourceId, maxLevel]);

  useEffect(() => {
    if (statements.length === 0) {
      setCollapsedKeys(new Set());
      return;
    }
    setCollapsedKeys(defaultCollapsedSubTemplates(statements, resourceId));
  }, [statements, resourceId]);

  const outgoingFull = useMemo(
    () => outgoingCountBySubject(statements),
    [statements]
  );

  const paperNodeKey = useMemo(() => {
    const norm = normalizeOrkgResourceId(resourceId).toLowerCase();
    for (const s of statements) {
      if (normalizeOrkgResourceId(s.subject.id).toLowerCase() === norm) {
        return nodeKey(s.subject);
      }
      if (normalizeOrkgResourceId(s.object.id).toLowerCase() === norm) {
        return nodeKey(s.object);
      }
    }
    return `resource:${normalizeOrkgResourceId(resourceId)}`;
  }, [statements, resourceId]);

  const resourceParentByChild = useMemo(
    () => resourceParentMapFromRoot(paperNodeKey, statements),
    [paperNodeKey, statements]
  );

  const hiddenKeys = useMemo(
    () => unionHiddenForCollapsed(collapsedKeys, statements),
    [collapsedKeys, statements]
  );

  const visibleStatements = useMemo(
    () => filterStatementsByHidden(statements, hiddenKeys),
    [statements, hiddenKeys]
  );

  useEffect(() => {
    const n = visibleStatements.length;
    const maxStart = Math.max(0, n - Math.min(graphBatchSize, n || 1));
    setGraphWindowStart((s) => Math.min(Math.max(0, s), maxStart));
  }, [visibleStatements.length, graphBatchSize]);

  useEffect(() => {
    const n = visibleStatements.length;
    setPickedStatementIndices((prev) => {
      const next = new Set([...prev].filter((i) => i >= 0 && i < n));
      if (graphSelectionTab === 1 && next.size === 0 && n > 0) {
        for (let i = 0; i < Math.min(graphBatchSize, n); i++) next.add(i);
      }
      return next;
    });
  }, [visibleStatements.length, graphSelectionTab, graphBatchSize]);

  const graphStatementIndices = useMemo(() => {
    const n = visibleStatements.length;
    if (n === 0) return [] as number[];
    if (graphSelectionTab === 0) {
      const span = Math.min(graphBatchSize, n);
      const start = Math.min(graphWindowStart, Math.max(0, n - span));
      const out: number[] = [];
      for (let j = 0; j < span; j++) out.push(start + j);
      return out;
    }
    return [...pickedStatementIndices]
      .filter((i) => i >= 0 && i < n)
      .sort((a, b) => a - b)
      .slice(0, graphBatchSize);
  }, [
    visibleStatements.length,
    graphSelectionTab,
    graphWindowStart,
    graphBatchSize,
    pickedStatementIndices,
  ]);

  const graphStatements = useMemo(
    () => graphStatementIndices.map((i) => visibleStatements[i]),
    [graphStatementIndices, visibleStatements]
  );

  const dagreOpts: DagreLayoutOptions = useMemo(
    () => ({ showEdgeLabels }),
    [showEdgeLabels]
  );

  const maxWindowStart = Math.max(
    0,
    visibleStatements.length -
      Math.min(graphBatchSize, visibleStatements.length || 1)
  );

  const togglePickStatement = useCallback((index: number) => {
    setPickedStatementIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        if (next.size <= 1) return next;
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const resetPickToFirstBlock = useCallback(() => {
    const n = visibleStatements.length;
    const next = new Set<number>();
    for (let i = 0; i < Math.min(graphBatchSize, n); i++) next.add(i);
    setPickedStatementIndices(next);
  }, [graphBatchSize, visibleStatements.length]);

  const toggleCollapse = useCallback((key: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const collapseAllSubTemplates = useCallback(() => {
    setCollapsedKeys(defaultCollapsedSubTemplates(statements, resourceId));
  }, [statements, resourceId]);

  const expandAllSubTemplates = useCallback(() => {
    setCollapsedKeys(new Set());
  }, []);

  const nodeExtras = useMemo(() => {
    const m = new Map<string, NodeExtra>();
    const keysInGraph = new Set<string>();
    graphStatements.forEach((s) => {
      keysInGraph.add(nodeKey(s.subject));
      keysInGraph.add(nodeKey(s.object));
    });

    for (const k of keysInGraph) {
      const outFull = outgoingFull.get(k) ?? 0;
      const isResourceKey = k.startsWith('resource:');
      const hasBranches = isResourceKey && outFull > 0;
      const hiddenCount = descendantObjectKeys(k, statements).size;
      const branchCollapsed = collapsedKeys.has(k);
      m.set(k, {
        graphKey: k,
        hasBranches,
        branchCollapsed,
        hiddenDescendantCount: hiddenCount,
        onToggleBranch: hasBranches
          ? () => {
              toggleCollapse(k);
            }
          : undefined,
      });
    }
    return m;
  }, [
    graphStatements,
    statements,
    outgoingFull,
    collapsedKeys,
    toggleCollapse,
  ]);

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => layoutWithDagre(graphStatements, nodeExtras, dagreOpts),
    [graphStatements, nodeExtras, dagreOpts]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    rfInstance.current = instance;
  }, []);

  useEffect(() => {
    if (!layoutNodes.length || !rfInstance.current) return;
    const t = window.setTimeout(() => {
      rfInstance.current?.fitView({
        padding: 0.28,
        maxZoom: 1.2,
        duration: 220,
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [layoutNodes.length, collapsedKeys, graphStatements.length, dagreOpts]);

  const collapsedPanelItems = useMemo(() => {
    const labelForNodeKey = (k: string): string => {
      for (const s of statements) {
        if (nodeKey(s.subject) === k) return displayLabel(s.subject);
        if (nodeKey(s.object) === k) return displayLabel(s.object);
      }
      return k.replace(/^resource:/, '').replace(/^literal:/, '');
    };
    const items: {
      key: string;
      label: string;
      count: number;
      depth: number;
    }[] = [];
    collapsedKeys.forEach((k) => {
      const count = descendantObjectKeys(k, statements).size;
      const depth = depthBelowRoot(k, paperNodeKey, resourceParentByChild);
      items.push({ key: k, label: labelForNodeKey(k), count, depth });
    });
    items.sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.label.localeCompare(b.label);
    });
    return items;
  }, [collapsedKeys, statements, paperNodeKey, resourceParentByChild]);

  if (loading) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={36} color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 1 }}>
        {error}
      </Alert>
    );
  }

  if (statements.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        No statements returned for this resource (empty bundle or not found).
      </Typography>
    );
  }

  const panelW = 340;
  const graphShowsSubset =
    graphStatements.length < visibleStatements.length ||
    (graphSelectionTab === 1 && pickedStatementIndices.size > graphBatchSize);
  const pickTruncated =
    graphSelectionTab === 1 && pickedStatementIndices.size > graphBatchSize;
  const hiddenByCollapse = statements.length - visibleStatements.length;
  const windowRowFrom =
    graphStatementIndices.length > 0 ? graphStatementIndices[0] + 1 : 0;
  const windowRowTo =
    graphStatementIndices.length > 0
      ? graphStatementIndices[graphStatementIndices.length - 1] + 1
      : 0;

  return (
    <Box
      sx={{
        width: '100%',
        height,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'grey.50',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1.5, maxWidth: { xs: '100%', md: '48%' } }}
          >
            <strong>{statements.length}</strong> in bundle
            {hiddenByCollapse > 0 && (
              <>
                {' · '}
                <strong>{visibleStatements.length}</strong> visible
              </>
            )}
            {' · '}
            Graph: <strong>{graphStatements.length}</strong>
            {graphShowsSubset ? (
              <>
                {' '}
                of {visibleStatements.length} visible
                {pickTruncated && (
                  <>
                    {' '}
                    (first {graphBatchSize} of {pickedStatementIndices.size}{' '}
                    selected)
                  </>
                )}
              </>
            ) : (
              <> triple{graphStatements.length === 1 ? '' : 's'}</>
            )}
            {' · '}
            <strong>{collapsedKeys.size}</strong> hub
            {collapsedKeys.size === 1 ? '' : 's'} collapsed
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={collapseAllSubTemplates}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              Collapse hubs
            </Button>
            <Button
              size="small"
              variant="contained"
              disableElevation
              onClick={expandAllSubTemplates}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              Expand all
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            px: 1.5,
            py: 1,
            bgcolor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={1.25}>
            <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
              <Typography variant="caption" color="text.secondary">
                Graph
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={graphBatchSize}
                onChange={(_, v: number | null) => {
                  if (v != null) setGraphBatchSize(v);
                }}
              >
                {GRAPH_BATCH_OPTIONS.map((n) => (
                  <ToggleButton key={n} value={n}>
                    {n}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary">
                max in graph
              </Typography>
              <FormControlLabel
                sx={{ ml: 0.5 }}
                control={
                  <Switch
                    size="small"
                    checked={showEdgeLabels}
                    onChange={(e) => setShowEdgeLabels(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="caption" component="span">
                    Predicate on edges
                  </Typography>
                }
              />
            </Stack>
          </Stack>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            width: panelW,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'auto',
            maxHeight: '100%',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <Stack spacing={1.25} sx={{ p: 1.25 }}>
            <Box>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'text.secondary',
                  mb: 0.75,
                }}
              >
                Graph overview
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.25, bgcolor: 'grey.50' }}>
                <Stack spacing={0.75}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 0.5,
                      rowGap: 0.75,
                      alignItems: 'baseline',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      In bundle
                    </Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {statements.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Visible (graph scope)
                    </Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {visibleStatements.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Drawn in graph
                    </Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {graphStatements.length}
                      {graphShowsSubset ? ` / ${visibleStatements.length}` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hubs collapsed
                    </Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {collapsedKeys.size}
                    </Typography>
                  </Box>
                  {graphShowsSubset && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        pt: 0.5,
                        borderTop: '1px dashed',
                        borderColor: 'divider',
                        lineHeight: 1.45,
                      }}
                    >
                      Not every visible triple is drawn: use{' '}
                      <strong>Window</strong> or <strong>Choose rows</strong>{' '}
                      below to change which up to {graphBatchSize} rows appear,
                      or expand collapsed hubs to change the visible set.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'text.secondary',
                  mb: 0.75,
                }}
              >
                Which rows are in the graph
              </Typography>
              <Tabs
                value={graphSelectionTab}
                onChange={(_, v) => {
                  setGraphSelectionTab(v);
                  if (v === 1) {
                    setPickedStatementIndices((prev) => {
                      if (prev.size > 0) return prev;
                      const s = new Set<number>();
                      const n = visibleStatements.length;
                      for (let i = 0; i < Math.min(graphBatchSize, n); i++) {
                        s.add(i);
                      }
                      return s;
                    });
                  }
                }}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ minHeight: 40, mb: 1 }}
              >
                <Tab label="Sliding window" sx={{ minHeight: 40, py: 0 }} />
                <Tab label="Choose rows" sx={{ minHeight: 40, py: 0 }} />
              </Tabs>

              {graphSelectionTab === 0 ? (
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary">
                    Rows <strong>{windowRowFrom}</strong>–
                    <strong>{windowRowTo}</strong> of{' '}
                    <strong>{visibleStatements.length}</strong> visible (up to{' '}
                    {graphBatchSize} at a time).
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap">
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={graphWindowStart <= 0}
                      onClick={() =>
                        setGraphWindowStart((s) =>
                          Math.max(0, s - graphBatchSize)
                        )
                      }
                      sx={{ textTransform: 'none' }}
                    >
                      Previous block
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={graphWindowStart >= maxWindowStart}
                      onClick={() =>
                        setGraphWindowStart((s) =>
                          Math.min(maxWindowStart, s + graphBatchSize)
                        )
                      }
                      sx={{ textTransform: 'none' }}
                    >
                      Next block
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={1}>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap">
                    <Button
                      size="small"
                      variant="text"
                      onClick={resetPickToFirstBlock}
                      sx={{ textTransform: 'none' }}
                    >
                      Reset to first{' '}
                      {Math.min(graphBatchSize, visibleStatements.length)}
                    </Button>
                  </Stack>
                  {pickTruncated && (
                    <Typography variant="caption" color="warning.main">
                      Showing the first {graphBatchSize} selected rows (by
                      index). Uncheck some to prioritize others.
                    </Typography>
                  )}
                  <Box
                    sx={{
                      maxHeight: 220,
                      overflow: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'grey.50',
                      p: 0.5,
                    }}
                  >
                    <FormGroup>
                      {visibleStatements.map((s, i) => (
                        <FormControlLabel
                          key={`${nodeKey(s.subject)}-${s.predicate.id}-${nodeKey(s.object)}-${i}`}
                          sx={{
                            alignItems: 'flex-start',
                            mx: 0.5,
                            my: 0.25,
                          }}
                          control={
                            <Checkbox
                              size="small"
                              checked={pickedStatementIndices.has(i)}
                              onChange={() => togglePickStatement(i)}
                            />
                          }
                          label={
                            <Typography
                              variant="caption"
                              sx={{
                                lineHeight: 1.4,
                                display: 'block',
                                pt: 0.25,
                              }}
                            >
                              <strong>#{i + 1}</strong> {statementRowSummary(s)}
                            </Typography>
                          }
                        />
                      ))}
                    </FormGroup>
                  </Box>
                </Stack>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'text.secondary',
                  mb: 0.75,
                }}
              >
                Collapsed branches
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1, lineHeight: 1.45 }}
              >
                Sorted by depth from the paper. Expand a hub to show its
                sub-template in the visible set (graph still shows at most{' '}
                {graphBatchSize} triples — adjust above).
              </Typography>

              {collapsedPanelItems.length === 0 ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.25,
                    bgcolor: 'action.hover',
                    borderStyle: 'dashed',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    No branches collapsed. Use the fold control on a resource
                    node in the graph to hide its descendants.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={1}>
                  {collapsedPanelItems.map(({ key, label, count, depth }) => (
                    <Paper
                      key={key}
                      component="button"
                      type="button"
                      variant="outlined"
                      onClick={() => toggleCollapse(key)}
                      sx={{
                        p: 1.1,
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        borderColor: 'divider',
                        ml: `${Math.min(depth, 6) * 10}px`,
                        borderLeftWidth:
                          depth > 0 || key === paperNodeKey ? 3 : 1,
                        borderLeftColor:
                          depth > 0 || key === paperNodeKey
                            ? 'primary.light'
                            : 'divider',
                        transition: (t) =>
                          t.transitions.create(
                            ['background-color', 'border-color', 'box-shadow'],
                            { duration: t.transitions.duration.shortest }
                          ),
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.light',
                          boxShadow: 1,
                        },
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        <Chip
                          size="small"
                          label={
                            key === paperNodeKey
                              ? 'Paper'
                              : depth === 0
                                ? 'Off-tree'
                                : `Depth ${depth}`
                          }
                          color={
                            key === paperNodeKey || depth === 0
                              ? 'default'
                              : 'primary'
                          }
                          variant={
                            key === paperNodeKey || depth === 0
                              ? 'outlined'
                              : 'filled'
                          }
                          sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{
                              lineHeight: 1.35,
                              wordBreak: 'break-word',
                            }}
                          >
                            {label}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.35, lineHeight: 1.4 }}
                          >
                            <strong>{count}</strong> nodes hidden in this branch
                            · click to expand
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'grey.100',
            '& .react-flow__renderer': {
              backgroundColor: (t) => t.palette.grey[100],
            },
            '& .react-flow__edge-path': {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            },
            '& .react-flow__edge-text': {
              fontSize: '10px',
            },
            '& .react-flow__node': {
              fontFamily: 'inherit',
            },
          }}
        >
          <Box
            sx={{
              display: { xs: 'block', sm: 'none' },
              flexShrink: 0,
              px: 1.25,
              py: 0.75,
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1.5 }}
            >
              <strong>{graphStatements.length}</strong> of{' '}
              <strong>{visibleStatements.length}</strong> triples in graph
              {graphShowsSubset && <> (≤{graphBatchSize} shown)</>}
              {' · '}
              <strong>{statements.length}</strong> total in bundle ·{' '}
              <strong>{collapsedKeys.size}</strong> collapsed hub
              {collapsedKeys.size === 1 ? '' : 's'}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              minHeight: 200,
              position: 'relative',
            }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              onInit={onInit}
              fitView
              nodesDraggable
              nodesConnectable={false}
              elementsSelectable
              minZoom={0.04}
              maxZoom={1.35}
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{
                type: 'smoothstep',
              }}
            >
              <Background
                id="orkg-spo-dots"
                gap={20}
                size={1}
                color="#cfd8dc"
              />
              <Controls
                showInteractive={false}
                style={{
                  boxShadow: '0 1px 3px rgba(15,23,42,0.1)',
                  borderRadius: 8,
                }}
              />
              <MiniMap
                nodeStrokeWidth={2}
                nodeColor={minimapNodeColor}
                nodeStrokeColor={(n) =>
                  (n.data as { isResource?: boolean })?.isResource
                    ? '#0d47a1'
                    : '#90a4ae'
                }
                zoomable
                pannable
                maskColor="rgba(255,255,255,0.75)"
                style={{
                  height: 92,
                  width: 128,
                  borderRadius: 8,
                  border: '1px solid #cfd8dc',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                }}
              />
            </ReactFlow>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const PaperStatementsGraph: React.FC<PaperStatementsGraphProps> = (props) => (
  <ReactFlowProvider>
    <PaperStatementsGraphInner {...props} />
  </ReactFlowProvider>
);

export default PaperStatementsGraph;
