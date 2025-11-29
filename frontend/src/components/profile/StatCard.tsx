import { ReactNode } from "react";
import { Skeleton } from "../ui/Skeleton";

interface StatCardProps {
  key?: string | number;
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}

export const StatCard = ({ label, value, icon, color }: StatCardProps) => {
  return (
    <div className={`${color} comic-border kinetic-shadow p-6 rounded-lg relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-125 transition-transform">
        {icon}
      </div>
      <p className="font-body font-black uppercase tracking-widest text-xs opacity-70">{label}</p>
      <h3 className="font-headline font-black text-6xl mt-2">{value}</h3>
    </div>
  );
};

export const StatCardSkeleton = () => {
  return (
    <div className="bg-surface-container-highest comic-border p-6 rounded-lg relative overflow-hidden">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-12 w-20" />
    </div>
  );
};
