import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Hook for logging to monitoring services if connected (e.g., Sentry)
    // console.error can help during development
    console.error("Unhandled UI error:", error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Bir hata oluştu</h1>
          <p className="opacity-80 mb-4">Sayfa yüklenirken bir sorun yaşandı. Lütfen tekrar deneyin.</p>
          <button onClick={this.handleReload} className="px-4 py-2 rounded bg-violet-600 hover:bg-violet-700 transition">Yenile</button>
          {process.env.NODE_ENV !== "production" && this.state.error ? (
            <pre className="mt-6 max-w-2xl w-full text-left text-xs bg-neutral-900 p-4 rounded overflow-auto">
              {this.state.error?.stack || this.state.error?.message}
            </pre>
          ) : null}
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
