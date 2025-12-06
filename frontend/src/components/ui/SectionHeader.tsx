import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  variant?: "default" | "secondary";
  extra?: ReactNode;
  className?: string;
}

export const SectionHeader = ({ 
  title, 
  subtitle, 
  variant = "default", 
  extra,
  className = "" 
}: SectionHeaderProps) => {
  return (
    <div className={`flex items-center gap-4 mb-8 ${className}`}>
      <h2 className={`
        font-headline text-4xl font-black uppercase italic tracking-tighter
        ${variant === "secondary" ? "text-secondary" : "text-on-background"}
      `}>
        {title}
      </h2>
      <div className={`flex-1 h-1 bg-on-background ${variant === "default" ? "opacity-100" : "opacity-20"}`}></div>
      {subtitle && (
        <p className="font-body text-sm uppercase tracking-widest font-bold opacity-70">{subtitle}</p>
      )}
      {extra && <div className="ml-2">{extra}</div>}
    </div>
  );
};
