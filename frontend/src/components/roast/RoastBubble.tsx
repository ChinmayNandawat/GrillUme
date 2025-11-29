import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Roast } from "../../types";
import { Skeleton } from "../ui/Skeleton";

interface RoastBubbleProps {
  key?: string | number;
  roast: Roast;
  onVote: (id: string, type: 'up' | 'down') => void;
  align?: "start" | "end";
}

export const RoastBubble = ({ 
  roast, 
  onVote, 
  align = "start" 
}: RoastBubbleProps) => {
  const variantClasses = {
    yellow: "bg-primary-container",
    red: "bg-secondary-container",
    blue: "bg-tertiary-container",
  };

  return (
    <div className={`flex flex-col ${align === "end" ? "items-end" : "items-start"}`}>
      <div className={`
        ${variantClasses[roast.variant]}
        border-4 border-on-background p-6 rounded-[2rem] relative shadow-[3px_3px_0px_0px_#383835]
        ${align === "end" ? "rounded-br-none w-full md:w-5/6" : "rounded-bl-none"}
      `}>
        <p className="font-bold text-on-surface leading-tight">{roast.text}</p>
        <div className={`
          absolute -bottom-4 ${align === "end" ? "right-0 border-r-4" : "left-0 border-l-4"} 
          w-6 h-6 border-b-4 border-on-background
          ${variantClasses[roast.variant]}
        `} style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}></div>
      </div>
      <div className={`flex items-center gap-4 mt-4 ${align === "end" ? "mr-2" : "ml-2"}`}>
        {align === "end" && (
          <VoteButtons likes={roast.likes} onVote={(type) => onVote(roast.id, type)} />
        )}
        <span className="font-headline text-xs font-black uppercase tracking-tighter">
          {roast.user}
        </span>
        {align !== "end" && (
          <VoteButtons likes={roast.likes} onVote={(type) => onVote(roast.id, type)} />
        )}
      </div>
    </div>
  );
};

export const RoastBubbleSkeleton = ({ align = "start" }: { key?: string | number; align?: "start" | "end" }) => (
  <div className={`flex flex-col ${align === "end" ? "items-end" : "items-start"}`}>
    <div className={`
      bg-on-background/5 border-4 border-on-background/10 p-6 rounded-[2rem] relative
      ${align === "end" ? "rounded-br-none w-full md:w-5/6" : "rounded-bl-none w-full md:w-5/6"}
    `}>
      <Skeleton className="w-full h-4 mb-2" />
      <Skeleton className="w-3/4 h-4" />
    </div>
    <div className={`flex items-center gap-4 mt-4 ${align === "end" ? "mr-2" : "ml-2"}`}>
      <Skeleton className="w-20 h-4" />
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
  </div>
);

const VoteButtons = ({ likes, onVote }: { likes: number; onVote: (type: 'up' | 'down') => void }) => (
  <div className="flex border-2 border-on-background rounded-full bg-white overflow-hidden">
    <button 
      onClick={() => onVote('up')}
      className="px-2 py-1 hover:bg-secondary hover:text-white transition-colors"
    >
      <ThumbsUp size={14} />
    </button>
    <span className="px-2 py-1 font-black text-xs border-x-2 border-on-background">{likes}</span>
    <button 
      onClick={() => onVote('down')}
      className="px-2 py-1 hover:bg-tertiary hover:text-white transition-colors"
    >
      <ThumbsDown size={14} />
    </button>
  </div>
);
