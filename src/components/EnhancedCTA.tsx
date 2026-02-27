import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, DollarSign, TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedCTAProps {
  variant?: 'creator' | 'advertiser' | 'hero';
  onClick?: () => void;
  className?: string;
}

export const EnhancedCTA = ({ variant = 'hero', onClick, className }: EnhancedCTAProps) => {
  const configs = {
    creator: {
      primary: {
        text: "Ganhe R$ 500+ por mês",
        subtitle: "Comece a monetizar agora",
        icon: DollarSign,
        gradient: "bg-gradient-success"
      },
      secondary: {
        text: "Ver Como Funciona",
        subtitle: "2 min de leitura",
        icon: ArrowRight,
        gradient: "bg-gradient-primary"
      }
    },
    advertiser: {
      primary: {
        text: "Encontre Influenciadores",
        subtitle: "Resultados em 24h",
        icon: TrendingUp,
        gradient: "bg-gradient-primary"
      },
      secondary: {
        text: "Ver Exemplos de Sucesso",
        subtitle: "Cases reais",
        icon: Star,
        gradient: "bg-gradient-success"
      }
    },
    hero: {
      primary: {
        text: "Começar a Ganhar Agora",
        subtitle: "Grátis para sempre",
        icon: Zap,
        gradient: "bg-gradient-hero"
      },
      secondary: {
        text: "Explorar Criadores",
        subtitle: "Sem compromisso",
        icon: ArrowRight,
        gradient: "bg-gradient-primary"
      }
    }
  };

  const config = configs[variant];

  return (
    <div className={cn("flex flex-col sm:flex-row gap-4 justify-center items-center", className)}>
      {/* Primary CTA */}
      <div className="relative group">
        <Button
          size="lg"
          onClick={onClick}
          className={cn(
            "relative overflow-hidden text-white border-0 shadow-strong",
            "hover:shadow-glow hover:scale-105 transition-all duration-300",
            config.primary.gradient
          )}
        >
          <div className="flex items-center gap-2">
            <config.primary.icon className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">{config.primary.text}</div>
              <div className="text-xs opacity-90">{config.primary.subtitle}</div>
            </div>
          </div>
          
          {/* Animated background */}
          <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </Button>
        
        {/* Popular badge */}
        {variant === 'creator' && (
          <Badge className="absolute -top-2 -right-2 bg-warning text-warning-foreground animate-pulse">
            🔥 Popular
          </Badge>
        )}
      </div>

      {/* Secondary CTA */}
      <Button
        variant="outline"
        size="lg"
        onClick={onClick}
        className="group hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
      >
        <div className="flex items-center gap-2">
          <config.secondary.icon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          <div className="text-left">
            <div className="font-medium">{config.secondary.text}</div>
            <div className="text-xs opacity-70">{config.secondary.subtitle}</div>
          </div>
        </div>
      </Button>
    </div>
  );
};

interface FloatingCTAProps {
  show: boolean;
  variant?: 'creator' | 'advertiser';
  onClick?: () => void;
}

export const FloatingCTA = ({ show, variant = 'creator', onClick }: FloatingCTAProps) => {
  if (!show) return null;

  const text = variant === 'creator' 
    ? "💰 Ganhe R$ 500+ por mês" 
    : "🎯 Encontre Criadores Agora";

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <Button
        onClick={onClick}
        className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-strong hover:shadow-glow animate-pulse-glow"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          {text}
        </div>
      </Button>
    </div>
  );
};

interface ProgressCTAProps {
  currentStep: number;
  totalSteps: number;
  nextAction: string;
  onClick?: () => void;
}

export const ProgressCTA = ({ currentStep, totalSteps, nextAction, onClick }: ProgressCTAProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">Seu Progresso</span>
        <span className="text-xs text-muted-foreground">{currentStep}/{totalSteps}</span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <Button
        onClick={onClick}
        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
      >
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4" />
          {nextAction}
        </div>
      </Button>
    </div>
  );
};