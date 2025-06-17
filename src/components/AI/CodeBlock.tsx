import React, { useState } from 'react';

interface CodeBlockProps {
  content: string;
  isUser: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ content, isUser }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text.trim());
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const CopyButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button
      className="code-block-button"
      title={isCopied ? 'Copied!' : 'Copy code'}
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: isUser ? 'white' : 'inherit',
        opacity: 0.7,
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.opacity = '0.7';
      }}
    >
      {isCopied ? (
        <svg
          viewBox="0 0 24 24"
          style={{ width: 20, height: 20, fill: 'currentColor' }}
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          style={{ width: 20, height: 20, fill: 'currentColor' }}
        >
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
        </svg>
      )}
    </button>
  );

  return (
    <div
      className="code-block-wrapper"
      style={{
        position: 'relative',
        marginBottom: '1rem',
      }}
    >
      <div
        className="code-block-controls"
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '8px',
          zIndex: 1,
          backgroundColor: isUser
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)',
          padding: '4px',
          borderRadius: '4px',
        }}
      >
        <CopyButton
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          onClick={(e: {
            preventDefault: () => void;
            stopPropagation: () => void;
          }) => {
            e.preventDefault();
            e.stopPropagation();
            handleCopy(content);
          }}
        />
      </div>
      <pre
        style={{
          margin: 0,
          maxHeight: '400px',
          overflow: 'auto',
          paddingTop: '40px',
          backgroundColor: isUser
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)',
          padding: '1rem',
          borderRadius: '4px',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <code>{content}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
