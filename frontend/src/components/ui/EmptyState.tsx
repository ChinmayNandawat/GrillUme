import { ReactNode } from "react";
import { Ghost } from "lucide-react";
import { Card } from "./Card";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ 
  title, 
  description, 
  icon = <Ghost size={64} className="text-outline opacity-20" />, 
  action,
  className = "" 
}: EmptyStateProps) => {
  return (
    <Card className={`flex flex-col items-center justify-center py-20 px-8 text-center bg-white border-dashed border-4 border-on-background/20 shadow-none ${className}`}>
      <div className="mb-6 p-6 bg-surface-container-high rounded-full comic-border -rotate-3">
        {icon}
      </div>
      <h3 className="font-headline text-3xl font-black uppercase tracking-tighter mb-2 italic">
        {title}
      </h3>
      <p className="font-body font-bold text-on-surface-variant max-w-md mb-8">
        {description}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
};
