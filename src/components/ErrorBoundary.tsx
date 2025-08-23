"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
          <Card className="bg-red-900/20 border-red-500/30 max-w-2xl">
            <CardHeader>
              <CardTitle className="text-red-400">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-300">
                An error occurred while loading the course. This might be due to:
              </p>
              <ul className="list-disc list-inside text-red-300 space-y-2 ml-4">
                <li>Missing environment variables</li>
                <li>Database connection issues</li>
                <li>Wallet connection problems</li>
                <li>Course data corruption</li>
              </ul>
              
              {this.state.error && (
                <details className="bg-red-900/30 p-3 rounded border border-red-500/30">
                  <summary className="text-red-300 cursor-pointer">Error Details</summary>
                  <pre className="text-red-200 text-xs mt-2 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Refresh Page
                </Button>
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
