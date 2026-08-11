"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-6 space-y-4 rounded-xl border border-red-200">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="text-red-500 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Rendering Engine Error</h2>
          <p className="text-sm text-gray-500 max-w-md text-center">
            The spatial engine encountered an unexpected error while rendering this view.
          </p>
          <div className="bg-gray-100 p-4 rounded-md text-xs font-mono text-red-600 w-full max-w-xl overflow-x-auto shadow-inner">
            {this.state.error?.message}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-md"
            aria-label="Reload Component"
          >
            <RotateCcw size={16} /> Reload Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
