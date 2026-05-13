import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          The app hit an unexpected error. Try reloading — your data is safe.
        </p>
        <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 max-w-md overflow-auto mb-6">
          {this.state.error.message}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
        >
          Reload app
        </button>
      </div>
    );
  }
}