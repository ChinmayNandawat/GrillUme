import { FileText, Flame, Globe, LogOut, Award, User as UserIcon, Trophy, MessageSquareOff } from "lucide-react";
import { StatCard, StatCardSkeleton } from "../components/profile/StatCard";
import { useEffect, useState, useCallback } from "react";
import { getUserStats, getBattleScrolls } from "../services/api";
import { UserStats, BattleScroll } from "../types";
import { Link } from "react-router-dom";
import { BattleScrollCard, BattleScrollCardSkeleton } from "../components/profile/BattleScrollCard";
import { ErrorState } from "../components/ui/ErrorState";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";

export const Profile = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [battleScrolls, setBattleScrolls] = useState<BattleScroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, scrollsData] = await Promise.all([
        getUserStats(),
        getBattleScrolls()
      ]);
      setStats(statsData);
      setBattleScrolls(scrollsData);
    } catch (err) {
      console.error("Failed to fetch profile data:", err);
      setError("Failed to retrieve your battle records. The archives are currently inaccessible.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        {/* Header Skeleton */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-primary-container/20 comic-border p-8 rounded-xl animate-pulse">
            <div className="w-40 h-40 rounded-full bg-on-background/10 border-4 border-on-background/20"></div>
            <div className="flex-1 space-y-4">
              <div className="h-12 w-64 bg-on-background/10 rounded"></div>
              <div className="h-6 w-48 bg-on-background/5 rounded"></div>
              <div className="h-10 w-40 bg-on-background/10 rounded-lg"></div>
            </div>
          </div>
        </section>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>

        {/* Scrolls Skeleton */}
        <section>
          <div className="h-10 w-64 bg-on-background/10 rounded mb-8 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Array.from({ length: 2 }).map((_, i) => <BattleScrollCardSkeleton key={i} />)}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-20">
        <ErrorState
          title="ARCHIVE ERROR!"
          message={error}
          onRetry={fetchProfile}
        />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Resumes Offered", value: stats.resumesOffered, icon: <FileText size={40} />, color: "bg-surface-container-highest" },
    { label: "Total Roasts Received", value: stats.totalRoastsReceived, icon: <Flame size={40} />, color: "bg-secondary-container" },
    { label: "Global Rank", value: stats.globalRank, icon: <Globe size={40} />, color: "bg-tertiary-container" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <section className="relative mb-12">
        <div className="absolute inset-0 halftone-bg -z-10 rounded-xl"></div>
        <div className="flex flex-col md:flex-row items-center gap-8 bg-primary-container comic-border kinetic-shadow p-8 rounded-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full border-[10px] border-primary opacity-10"></div>
          
          <div className="relative">
            <div className="w-40 h-40 rounded-full border-4 border-on-background bg-white overflow-hidden shadow-[4px_4px_0px_#383835]">
              <img 
                src={stats.avatar} 
                alt="Profile" 
                className="w-full h-full object-cover grayscale contrast-125"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-secondary text-white font-headline font-black px-4 py-1 comic-border rotate-3 shadow-[3px_3px_0px_#383835] text-sm uppercase">
              Level {stats.level}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="font-headline font-black text-5xl uppercase tracking-tighter text-on-background mb-2">{stats.name}</h1>
            <p className="font-headline font-bold text-tertiary uppercase text-lg tracking-widest">{stats.role}</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-on-background text-primary-container px-4 py-2 font-black uppercase text-sm rounded-lg">
              <Award size={20} fill="currentColor" />
              Roast Rank: {stats.rankTitle}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {statCards.map((stat, i) => (
          <StatCard key={i} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} />
        ))}
      </div>

      {/* Battle Scrolls */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-headline font-black text-4xl uppercase italic text-on-background">My Battle Scrolls</h2>
            <div className="h-2 w-32 bg-secondary mt-1"></div>
          </div>
          <Link to="/upload">
            <Button variant="primary" className="px-6 py-3">
              Upload New
            </Button>
          </Link>
        </div>

        {battleScrolls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {battleScrolls.map((scroll) => (
              <BattleScrollCard key={scroll.id} scroll={scroll} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="NO SCROLLS DEPLOYED!" 
            description="Your arsenal is empty. Upload your first resume to start the battle!"
            icon={<MessageSquareOff size={64} className="text-outline opacity-20" />}
            action={<Link to="/upload"><Button variant="secondary">Upload Now</Button></Link>}
          />
        )}
      </section>

      {/* Danger Zone */}
      <section className="mt-20 border-t-4 border-on-background pt-12 text-center">
        <Button variant="secondary" className="px-10 py-5 text-2xl italic" icon={<LogOut size={28} />}>
          Retire from Heroics
        </Button>
        <p className="mt-4 font-body text-on-surface-variant uppercase tracking-widest text-xs font-bold">
          Warning: All your roasted glory will be saved, but the battle field awaits.
        </p>
      </section>
    </div>
  );
};
