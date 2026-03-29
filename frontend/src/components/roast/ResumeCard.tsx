import { Flame, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "../ui/Skeleton";

interface ResumeCardProps {
  key?: string;
  id: string;
  name: string;
  role: string;
  date: string;
  fires: string;
  comments: string;
  avatar: string;
  quote?: string;
  variant?: "blue" | "red" | "green" | "yellow";
  isHot?: boolean;
  isChampion?: boolean;
}

export const ResumeCard = ({
  id,
  name,
  role,
  fires,
  comments,
  avatar,
  quote,
  variant = "blue",
  isHot,
  isChampion,
}: ResumeCardProps) => {
  const isHighlighted = isHot || isChampion;

  const bgVariants = {
    blue: "bg-[#dbeafe]", // A softer light blue for better visibility
    red: "bg-secondary-container",
    green: "bg-[#d1e7dd]", // A soft light green fallback
    yellow: "bg-primary-container",
  };

  const getButtonClass = () => {
    if (!isHighlighted) {
      return "bg-secondary text-white shadow-[2px_2px_0px_#383835] active:translate-y-0.5 active:shadow-none";
    }
    const colorClass = 
      variant === "yellow" ? "text-primary-container" :
      variant === "blue" ? "text-[#dbeafe]" :
      variant === "red" ? "text-secondary-container" :
      "text-white";
    
    return `bg-on-background ${colorClass} hover:bg-secondary hover:text-white`;
  };

  const currentBg = isHighlighted ? (bgVariants[variant] || bgVariants.blue) : "bg-white";

  const defaultQuote = `"Senior Developer in unemployment."`;

  return (
    <div className={`relative ${currentBg} border-4 border-on-background p-6 shadow-[6px_6px_0px_#383835] hover:shadow-[2px_2px_0px_#383835] hover:translate-x-1 hover:translate-y-1 transition-all group rounded-lg rounded-tl-none rounded-br-none overflow-hidden flex flex-col h-full`}>
      
      {isChampion ? (
        <div className="absolute top-0 right-0 bg-secondary text-white font-headline px-4 py-1 border-b-4 border-l-4 border-on-background -rotate-2 z-10 uppercase">
          CHAMPION
        </div>
      ) : isHot ? (
        <div className="absolute top-0 right-0 bg-secondary text-white font-headline px-4 py-1 border-b-4 border-l-4 border-on-background rotate-2 z-10 uppercase">
          HOT!
        </div>
      ) : null}

      <div className="flex items-center gap-4 mb-4">
        <img 
          className="w-20 h-20 rounded-full border-4 border-on-background object-cover shadow-[4px_4px_0px_#383835] shrink-0" 
          src={avatar} 
          alt={name} 
          referrerPolicy="no-referrer"
        />
        <div className="flex flex-col justify-center">
          <h3 className="text-2xl font-headline font-black uppercase leading-none text-on-background mb-1">{name}</h3>
          <span className="text-xs font-bold uppercase tracking-widest opacity-70 text-on-background">{role}</span>
        </div>
      </div>

      <p className="text-lg font-extrabold leading-tight mb-6 text-on-background uppercase line-clamp-2">
        {quote || defaultQuote}
      </p>

      <div className="flex justify-between items-center mt-auto">
        <div className="flex gap-4">
          <div className="flex items-center gap-1 font-black text-on-background">
            <Flame size={20} className={`${variant !== 'green' ? 'text-secondary fill-secondary' : ''}`} />
            {fires}
          </div>
          <div className="flex items-center gap-1 font-black text-on-background">
            <MessageSquare size={20} />
            {comments}
          </div>
        </div>
        <Link to={`/roast/${id}`} className="block">
          <button className={`px-4 py-2 font-headline uppercase tracking-tighter italic border-2 border-on-background cursor-pointer hover:-translate-y-1 hover:scale-105 hover:-rotate-3 active:scale-95 active:rotate-0 transition-all duration-200 ${getButtonClass()}`}>
            ROAST ME
          </button>
        </Link>
      </div>
    </div>
  );
};

export const ResumeCardSkeleton = () => (
  <div className="relative bg-surface border-4 border-on-background/20 p-6 shadow-[6px_6px_0px_rgba(56,56,53,0.2)] rounded-lg rounded-tl-none rounded-br-none flex flex-col h-full animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-24 h-3" />
      </div>
    </div>
    <div className="space-y-2 mb-6">
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-3/4 h-4" />
    </div>
    <div className="flex justify-between items-center mt-auto">
      <div className="flex gap-4">
        <Skeleton className="w-12 h-6" />
        <Skeleton className="w-12 h-6" />
      </div>
      <Skeleton className="w-28 h-10" />
    </div>
  </div>
);
