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
  const handleTemplateLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://orkg.org/templates/${data.templateId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
          <PropertyRow key={prop.id} nodeId={data.nodeId} property={prop} />
        ))}
      </ul>
    </div>
  );
};
