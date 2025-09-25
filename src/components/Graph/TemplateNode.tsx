import React from 'react';
import { Handle, Position } from 'reactflow';
import { TemplateProperty } from './types';
import { PropertyRow } from './PropertyRow';

interface TemplateNodeProps {
  data: {
    title: string;
    properties: TemplateProperty[];
    nodeId: string;
  };
}

export const TemplateNode: React.FC<TemplateNodeProps> = ({ data }) => {
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
