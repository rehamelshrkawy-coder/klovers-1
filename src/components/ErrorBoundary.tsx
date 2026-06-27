import * as Sentry from "@sentry/react";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Forward to Sentry with React component stack as extra context.
    // Safe to call even when Sentry is not initialized.
    Sentry.withScope((scope) => {
      scope.setTag("errorBoundary", "app");
      scope.setExtra("componentStack", errorInfo.componentStack);
      Sentry.captureException(error);
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center p-8 text-center">
          <div className="space-y-4 max-w-md">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-80 transition-opacity"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
