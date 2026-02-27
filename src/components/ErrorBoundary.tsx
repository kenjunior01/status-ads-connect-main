import React from "react";

type ErrorBoundaryState = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("UI ErrorBoundary caught:", error, info);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <div className="text-xl font-semibold text-foreground">Algo deu errado</div>
            <div className="text-sm text-muted-foreground">Tente recarregar a página ou voltar para o início</div>
            <a href="/" className="text-primary underline">Voltar ao início</a>
            {this.state.error && (
              <div className="mt-4 p-4 text-left border rounded-md bg-muted">
                <div className="text-sm font-semibold">Detalhes (dev):</div>
                <div className="text-xs text-muted-foreground break-words">
                  {this.state.error.message}
                </div>
                <button
                  className="mt-2 text-xs underline text-primary"
                  onClick={async () => {
                    const details = `Erro: ${this.state.error?.name}\nMensagem: ${this.state.error?.message}\nStack:\n${this.state.error?.stack ?? ""}`;
                    try {
                      await navigator.clipboard.writeText(details);
                    } catch {
                      window.prompt("Copie os detalhes do erro:", details);
                    }
                  }}
                >
                  Copiar detalhes
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
