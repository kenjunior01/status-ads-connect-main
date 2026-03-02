import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-2">404</h1>
        <p className="text-xl font-semibold text-foreground mb-2">Página não encontrada</p>
        <p className="text-muted-foreground mb-8">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-8 text-sm text-muted-foreground">
          <span className="break-all">{location.pathname}</span>
        </div>
        <Button 
          onClick={() => navigate("/")} 
          className="gap-2"
          size="lg"
        >
          <Home className="h-4 w-4" />
          Voltar para o Início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
