import { Flame } from "lucide-react";
import { Roast } from "../../types";
import { Skeleton } from "../ui/Skeleton";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const formatRoastTimestamp = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "UNKNOWN DATE";
  return date
    .toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
};

interface RoastBubbleProps {
  key?: string | number;
  roast: Roast;
  onReact: (id: string, reactedByMe: boolean) => void;
  align?: "start" | "end";
}

export const RoastBubble = ({ 
  roast, 
  onReact,
  align = "start" 
}: RoastBubbleProps) => {
  const auth = useContext(AuthContext);
  const isAuthenticated = !!auth?.user;

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
      <div className={`flex items-start gap-4 mt-4 ${align === "end" ? "mr-2" : "ml-2"}`}>
        {align === "end" && (
          <ReactionButton
            reactionCount={roast.reactionCount}
            reactedByMe={roast.reactedByMe}
            onToggle={() => onReact(roast.id, roast.reactedByMe)}
            disabled={!isAuthenticated}
          />
        )}
        <div className="flex flex-col gap-1">
          <span className="font-headline text-xs font-black uppercase tracking-tighter">
            {roast.user}
          </span>
          <span className="font-body text-[10px] font-bold uppercase tracking-wide opacity-70">
            {formatRoastTimestamp(roast.createdAt)}
          </span>
        </div>
        {align !== "end" && (
          <ReactionButton
            reactionCount={roast.reactionCount}
            reactedByMe={roast.reactedByMe}
            onToggle={() => onReact(roast.id, roast.reactedByMe)}
            disabled={!isAuthenticated}
          />
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

const ReactionButton = ({
  reactionCount,
  reactedByMe,
  onToggle,
  disabled = false,
}: {
  reactionCount: number;
  reactedByMe: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) => (
  <div className={`flex border-2 border-on-background rounded-full bg-white overflow-hidden ${disabled ? "opacity-50 grayscale cursor-not-allowed" : ""}`}>
    <button 
      onClick={onToggle}
      disabled={disabled}
      className={`px-2 py-1 transition-colors ${reactedByMe ? "bg-secondary text-white" : !disabled ? "hover:bg-secondary hover:text-white" : ""}`}
    >
      <Flame size={14} className={reactedByMe ? "fill-white" : ""} />
    </button>
    <span className="px-2 py-1 font-black text-xs border-l-2 border-on-background">{reactionCount}</span>
  </div>
);
