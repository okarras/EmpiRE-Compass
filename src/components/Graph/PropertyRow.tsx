import React from 'react';
import { Handle, Position } from 'reactflow';
import { createPortal } from 'react-dom';
import { TemplateProperty } from './types';
import { formatCardinality } from './utils';
import { ExternalLinkIcon } from './ExternalLinkIcon';

interface PropertyRowProps {
  nodeId: string;
  property: TemplateProperty;
  isTooltipActive: boolean;
  tooltipPosition?: { x: number; y: number };
  onShowTooltip: (
    propertyId: string,
    position: { x: number; y: number }
  ) => void;
  onHideTooltip: () => void;
  onTooltipMouseEnter: () => void;
  onTooltipMouseLeave: () => void;
}

export const PropertyRow: React.FC<PropertyRowProps> = ({
  nodeId,
  property,
  isTooltipActive,
  tooltipPosition,
  onShowTooltip,
  onHideTooltip,
  onTooltipMouseEnter,
  onTooltipMouseLeave,
}) => {
  const liRef = React.useRef<HTMLLIElement | null>(null);

  const handleId = `${nodeId}::prop::${property.id}`;
  const label = (property.class?.label ?? property.path?.label)?.trim();
  const propertyId = property.path?.id ?? '—';
  const descriptionText = property.description ?? '—';

  const handlePropertyLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://orkg.org/properties/${propertyId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const showTooltip = () => {
    const rect = liRef.current?.getBoundingClientRect();
    if (!rect) return;
    const desiredWidth = 260;
    const horizontalPadding = 12;
    const left = Math.max(horizontalPadding, rect.left - desiredWidth - 20);
    const top = Math.max(8, rect.top - 8);
    onShowTooltip(property.id, { x: left, y: top });
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
      onMouseLeave={onHideTooltip}
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
      {isTooltipActive &&
        tooltipPosition &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: tooltipPosition.y,
              left: tooltipPosition.x,
              width: 260,
              zIndex: 9999,
              background: '#2b2f36',
              color: '#e5e7eb',
              border: '1px solid #3c414b',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              padding: '8px 10px',
              pointerEvents: 'auto',
            }}
            onMouseEnter={onTooltipMouseEnter}
            onMouseLeave={onTooltipMouseLeave}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 6,
                alignItems: 'center',
              }}
            >
              <div style={{ minWidth: 92, color: '#9ca3af' }}>Property id</div>
              <div
                style={{
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {propertyId}
                {propertyId !== '—' && (
                  <button
                    onClick={handlePropertyLinkClick}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af';
                    }}
                    title={`View property on ORKG: ${propertyId}`}
                  >
                    <ExternalLinkIcon size={12} />
                  </button>
                )}
              </div>
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
