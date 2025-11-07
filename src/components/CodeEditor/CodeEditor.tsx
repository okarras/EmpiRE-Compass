import React, { useRef, useEffect } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import {
  ContentCopy,
  FormatAlignLeft,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import { editor } from 'monaco-editor';

export type CodeLanguage =
  | 'sparql'
  | 'html'
  | 'javascript'
  | 'typescript'
  | 'json'
  | 'sql'
  | 'markdown'
  | 'plaintext';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: CodeLanguage;
  height?: string | number;
  minHeight?: string | number;
  readOnly?: boolean;
  theme?: 'vs' | 'vs-dark' | 'hc-black';
  showMinimap?: boolean;
  showLineNumbers?: boolean;
  placeholder?: string;
  label?: string;
  copyable?: boolean;
  formattable?: boolean;
  fullscreenable?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'plaintext',
  height = '400px',
  minHeight,
  readOnly = false,
  theme = 'vs',
  showMinimap = false,
  showLineNumbers = true,
  placeholder = '',
  label,
  copyable = true,
  formattable = true,
  fullscreenable = false,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register SPARQL language if not already registered
    if (!monaco.languages.getLanguages().some((lang) => lang.id === 'sparql')) {
      registerSPARQLLanguage(monaco);
    }

    // Set placeholder if empty
    if (!value && placeholder) {
      editor.setValue(placeholder);
      editor.setSelection(new monaco.Selection(1, 1, 1, 1));
    }
  };

  const handleCopy = async () => {
    if (editorRef.current) {
      const text = editorRef.current.getValue();
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.trigger('editor', 'editor.action.formatDocument', {});
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    // Auto-resize editor when fullscreen changes
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [isFullscreen]);

  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    readOnly,
    minimap: { enabled: showMinimap },
    lineNumbers: showLineNumbers ? 'on' : 'off',
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, "Courier New", monospace',
    wordWrap: 'on',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    tabSize: 2,
    insertSpaces: true,
    formatOnPaste: true,
    formatOnType: true,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
  };

  const containerStyles = isFullscreen
    ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'white',
      }
    : {
        position: 'relative' as const,
        minHeight: minHeight || height,
      };

  return (
    <Box sx={containerStyles}>
      {(label || copyable || formattable || fullscreenable) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          }}
        >
          {label && (
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              {label}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
            {copyable && (
              <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                <IconButton size="small" onClick={handleCopy}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {formattable && !readOnly && (
              <Tooltip title="Format code">
                <IconButton size="small" onClick={handleFormat}>
                  <FormatAlignLeft fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {fullscreenable && (
              <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                <IconButton size="small" onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <FullscreenExit fontSize="small" />
                  ) : (
                    <Fullscreen fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}
      <Paper
        elevation={0}
        sx={{
          height: isFullscreen ? 'calc(100vh - 48px)' : height,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: isFullscreen ? 0 : 1,
          overflow: 'hidden',
        }}
      >
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={value}
          onChange={(val) => onChange?.(val || '')}
          onMount={handleEditorDidMount}
          theme={theme}
          options={editorOptions}
        />
      </Paper>
    </Box>
  );
};

// Register SPARQL language support
function registerSPARQLLanguage(monaco: Monaco) {
  monaco.languages.register({ id: 'sparql' });

  monaco.languages.setMonarchTokensProvider('sparql', {
    keywords: [
      'SELECT',
      'DISTINCT',
      'WHERE',
      'OPTIONAL',
      'FILTER',
      'UNION',
      'GRAPH',
      'PREFIX',
      'BASE',
      'FROM',
      'ORDER',
      'BY',
      'LIMIT',
      'OFFSET',
      'ASC',
      'DESC',
      'GROUP',
      'HAVING',
      'COUNT',
      'SUM',
      'MIN',
      'MAX',
      'AVG',
      'SAMPLE',
      'BIND',
      'AS',
      'SERVICE',
      'VALUES',
      'INSERT',
      'DELETE',
      'CONSTRUCT',
      'ASK',
      'DESCRIBE',
    ],
    operators: ['=', '!=', '<', '>', '<=', '>=', '&&', '||', '!'],
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    escapes:
      /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    tokenizer: {
      root: [
        [
          /[a-zA-Z_][\w]*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          },
        ],
        [/\?[a-zA-Z_][\w]*/, 'variable'],
        [/<[^>]+>/, 'string.uri'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
        [/#.*$/, 'comment'],
        [/\d+/, 'number'],
        [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],
        [/[{}()\[\]]/, '@brackets'],
        [/[;,.]/, 'delimiter'],
        [/\s+/, 'white'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration('sparql', {
    comments: {
      lineComment: '#',
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: '<', close: '>' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: '<', close: '>' },
    ],
  });
}

export default CodeEditor;
