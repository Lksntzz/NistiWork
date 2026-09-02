import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-8">
          <AlertTriangle className="text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h1>
          <p className="text-neutral-400 mb-6 text-center max-w-md">
            Ocorreu um erro inesperado na interface. Nossa equipe foi notificada (ou quase isso).
          </p>
          <pre className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 text-red-400 text-sm overflow-auto max-w-2xl w-full whitespace-pre-wrap">
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-8 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
