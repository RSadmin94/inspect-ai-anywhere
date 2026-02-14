import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const APP_LOCAL_STORAGE_KEYS = [
  'inspectai_terms_accepted',
  'inspectai_onboarding_complete',
  'inspectai_device_id',
];

const DB_NAMES = ['inspectai-db', 'inspect_ai_db'];

function clearAppData(): void {
  try {
    APP_LOCAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    DB_NAMES.forEach((name) => {
      try {
        indexedDB.deleteDatabase(name);
      } catch {
        // ignore per-db failures
      }
    });
  } catch (e) {
    console.error('Failed to clear app data:', e);
  }
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleResetAndReload = (): void => {
    clearAppData();
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-xl font-semibold text-destructive">Something went wrong</h1>
            <p className="text-sm text-muted-foreground break-all">
              {this.state.error.message}
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-medium"
              >
                Reload
              </button>
              <button
                onClick={this.handleResetAndReload}
                className="w-full py-3 px-4 rounded-lg border border-border text-foreground font-medium"
              >
                Reset local app data
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
