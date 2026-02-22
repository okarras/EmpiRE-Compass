import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasChunkError: boolean;
}

/**
 * Catches "Failed to fetch dynamically imported module" errors that occur
 * when a user has a cached version of the app and a new deployment has
 * changed chunk filenames. Prompts the user to refresh.
 */
export class ChunkLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasChunkError: false };
  }

  static getDerivedStateFromError(error: unknown): State | null {
    const message = error instanceof Error ? error.message : String(error);
    const isChunkLoadError =
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Loading chunk') ||
      message.includes('ChunkLoadError');
    return isChunkLoadError ? { hasChunkError: true } : null;
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasChunkError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Update available
          </h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            A new version of the app is available. Please refresh to get the
            latest version.
          </p>
          <button
            onClick={this.handleRefresh}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
