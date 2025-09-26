import React from 'react';
import { Handle, Position } from 'reactflow';
import { createPortal } from 'react-dom';
import { TemplateProperty } from './types';
import { formatCardinality } from './utils';

interface PropertyRowProps {
  nodeId: string;
  property: TemplateProperty;
}

export const PropertyRow: React.FC<PropertyRowProps> = ({
  nodeId,
  property,
}) => {
  const [isHover, setIsHover] = React.useState(false);
  const [tooltipPos, setTooltipPos] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const liRef = React.useRef<HTMLLIElement | null>(null);

  const handleId = `${nodeId}::prop::${property.id}`;
  const label = (property.class?.label ?? property.path?.label)?.trim();
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
