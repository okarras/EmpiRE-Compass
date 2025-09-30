import React from 'react';
import { Handle, Position } from 'reactflow';
import { TemplateProperty } from './types';
import { PropertyRow } from './PropertyRow';
import { ExternalLinkIcon } from './ExternalLinkIcon';

interface TemplateNodeProps {
  data: {
    title: string;
    properties: TemplateProperty[];
    nodeId: string;
    templateId: string;
  };
}

export const TemplateNode: React.FC<TemplateNodeProps> = ({ data }) => {
  // Centralized tooltip state management
  const [activeTooltip, setActiveTooltip] = React.useState<{
    propertyId: string;
    position: { x: number; y: number };
  } | null>(null);
  const tooltipHideTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleTemplateLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://orkg.org/templates/${data.templateId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const showTooltip = (
    propertyId: string,
    position: { x: number; y: number }
  ) => {
    // Clear any pending hide timer
    if (tooltipHideTimerRef.current) {
      clearTimeout(tooltipHideTimerRef.current);
      tooltipHideTimerRef.current = null;
    }

    // Set the active tooltip
    setActiveTooltip({ propertyId, position });
  };

  const hideTooltip = () => {
    // Set a delay before hiding the tooltip
    tooltipHideTimerRef.current = setTimeout(() => {
      setActiveTooltip(null);
      tooltipHideTimerRef.current = null;
    }, 150); // 150ms delay
  };

  const handleTooltipMouseEnter = () => {
    // Clear any pending hide timeout when mouse enters tooltip
    if (tooltipHideTimerRef.current) {
      clearTimeout(tooltipHideTimerRef.current);
      tooltipHideTimerRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    // Hide tooltip immediately when mouse leaves tooltip
    setActiveTooltip(null);
  };

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (tooltipHideTimerRef.current) {
        clearTimeout(tooltipHideTimerRef.current);
      }
    };
  }, []);

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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{data.title}</span>
        <button
          onClick={handleTemplateLinkClick}
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
          title={`View template on ORKG: ${data.templateId}`}
        >
          <ExternalLinkIcon size={14} />
        </button>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 8 }}>
        {data.properties.map((prop) => (
          <PropertyRow
            key={prop.id}
            nodeId={data.nodeId}
            property={prop}
            isTooltipActive={activeTooltip?.propertyId === prop.id}
            tooltipPosition={activeTooltip?.position}
            onShowTooltip={showTooltip}
            onHideTooltip={hideTooltip}
            onTooltipMouseEnter={handleTooltipMouseEnter}
            onTooltipMouseLeave={handleTooltipMouseLeave}
          />
        ))}
      </ul>
    </div>
  );
};
