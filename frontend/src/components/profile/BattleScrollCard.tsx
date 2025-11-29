import { FileText, Edit, Trash2 } from "lucide-react";
import { BattleScroll } from "../../types";
import { Skeleton } from "../ui/Skeleton";

interface BattleScrollCardProps {
  key?: string | number;
  scroll: BattleScroll;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const BattleScrollCard = ({ 
  scroll, 
  onEdit, 
  onDelete 
}: BattleScrollCardProps) => {
  return (
    <div className="bg-white border-4 border-on-background rounded-xl p-6 relative kinetic-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-primary-container comic-border flex items-center justify-center -mt-10 -ml-10 rotate-[-12deg] shadow-[3px_3px_0px_0px_#383835]">
          <FileText size={24} strokeWidth={3} />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit?.(scroll.id)}
            className="w-10 h-10 bg-white border-2 border-on-background flex items-center justify-center hover:bg-tertiary-container transition-colors"
          >
            <Edit size={20} />
          </button>
          <button 
            onClick={() => onDelete?.(scroll.id)}
            className="w-10 h-10 bg-white border-2 border-on-background flex items-center justify-center hover:bg-secondary-container transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      <h4 className="font-headline font-black text-2xl mb-1">{scroll.name}</h4>
      <p className="text-on-surface-variant font-bold text-sm mb-4">Uploaded: {scroll.date}</p>
      <div className="flex items-center gap-4">
        <div className="flex -space-x-2">
          {scroll.colors.map((c, i) => (
            <div key={i} className={`w-8 h-8 rounded-full border-2 border-on-background ${c}`}></div>
          ))}
        </div>
        <span className="text-xs font-black uppercase tracking-widest opacity-60">{scroll.roasts} Recent Roasts</span>
      </div>
    </div>
  );
};

export const BattleScrollCardSkeleton = () => {
  return (
    <div className="bg-white border-4 border-on-background rounded-xl p-6 relative">
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="w-12 h-12 -mt-10 -ml-10 rotate-[-12deg]" />
        <div className="flex gap-2">
          <Skeleton className="w-10 h-10" />
          <Skeleton className="w-10 h-10" />
        </div>
      </div>
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="flex items-center gap-4">
        <div className="flex -space-x-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
};
