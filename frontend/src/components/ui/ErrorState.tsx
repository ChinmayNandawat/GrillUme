import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Card } from "./Card";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  autoRetry?: boolean;
  autoRetryIntervalMs?: number;
}

export const ErrorState = ({ 
  title = "BATTLE FAILED!", 
  message = "Something went wrong during the roast. The target escaped!", 
  onRetry,
  className = "",
  autoRetry = true,
  autoRetryIntervalMs = 2000
}: ErrorStateProps) => {
  useEffect(() => {
    if (autoRetry && onRetry) {
      const interval = setInterval(() => {
        onRetry();
      }, autoRetryIntervalMs);
      return () => clearInterval(interval);
    }
  }, [autoRetry, onRetry, autoRetryIntervalMs]);

  return (
    <Card className={`flex flex-col items-center justify-center py-20 px-8 text-center bg-secondary-container border-4 border-on-background kinetic-shadow ${className}`}>
      <div className="mb-6 p-6 bg-secondary text-white rounded-full comic-border rotate-6 shadow-[4px_4px_0px_0px_#383835]">
        <AlertTriangle size={64} strokeWidth={3} />
      </div>
      <h3 className="font-headline text-4xl font-black uppercase tracking-tighter mb-4 italic text-secondary">
        {title}
      </h3>
      <p className="font-body font-bold text-on-surface-variant max-w-md mb-10">
        {message}
      </p>
      {onRetry && (
        <Button 
          variant="secondary" 
          className="px-12 py-4 text-xl italic group"
          onClick={onRetry}
          icon={<RefreshCw className={`group-hover:rotate-180 transition-transform duration-500 ${autoRetry ? 'animate-spin' : ''}`} size={24} />}
        >
          {autoRetry ? "RETRYING..." : "RETRY MISSION"}
        </Button>
      )}
    </Card>
  );
};
