import { FileText, Flame, Globe, LogOut, MessageSquareOff, Edit3, X, AlertTriangle } from "lucide-react";
import { StatCard, StatCardSkeleton } from "../components/profile/StatCard";
import { useEffect, useState, useCallback } from "react";
import { getUserStats, getBattleScrolls, deleteResumeById, updateResumeById } from "../services/api.ts";
import { UserStats, BattleScroll } from "../types";
import { Link } from "react-router-dom";
import { BattleScrollCard, BattleScrollCardSkeleton } from "../components/profile/BattleScrollCard";
import { ErrorState } from "../components/ui/ErrorState";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../context/AuthContext";

export const Profile = () => {
  const { isAuthenticated, openAuthPanel, logout } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [battleScrolls, setBattleScrolls] = useState<BattleScroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");

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
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    fetchProfile();
  }, [fetchProfile, isAuthenticated]);

  const handleDeleteScroll = async (resumeId: string) => {
    if (isMutating) return;
    setDeleteTargetId(resumeId);
  };

  const handleDeleteConfirm = async () => {
    if (isMutating || !deleteTargetId) return;

    setIsMutating(true);
    try {
      await deleteResumeById(deleteTargetId);
      await fetchProfile();
      setDeleteTargetId(null);
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : "Delete failed";
      setError(message);
    } finally {
      setIsMutating(false);
    }
  };

  const handleEditScroll = async (resumeId: string) => {
    if (isMutating) return;
    const scroll = battleScrolls.find((item) => item.id === resumeId);
    const initialTitle = scroll ? scroll.name.replace(/\.pdf$/i, "") : "";
    const initialDescription = scroll?.description || "";

    setEditTargetId(resumeId);
    setEditTitle(initialTitle);
    setEditDetails(initialDescription);
  };

  const handleEditConfirm = async () => {
    if (isMutating || !editTargetId) return;
    if (!editTitle.trim()) {
      setError("Title cannot be empty");
      return;
    }

    setIsMutating(true);
    try {
      await updateResumeById(editTargetId, {
        title: editTitle.trim(),
        ...(editDetails.trim() ? { details: editDetails.trim() } : {}),
      });
      await fetchProfile();
      setEditTargetId(null);
      setEditTitle("");
      setEditDetails("");
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : "Update failed";
      setError(message);
    } finally {
      setIsMutating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <EmptyState
          title="AUTHORIZATION REQUIRED"
          description="Your roast profile is secured. Sign in from the top bar to view your stats and battle scrolls."
          action={<Button variant="secondary" onClick={openAuthPanel}>SIGN IN TO CONTINUE</Button>}
        />
      </div>
    );
  }

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
                className="w-full h-full object-cover"
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
              <BattleScrollCard
                key={scroll.id}
                scroll={scroll}
                onEdit={handleEditScroll}
                onDelete={handleDeleteScroll}
              />
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
        <Button variant="secondary" className="px-10 py-5 text-2xl italic" icon={<LogOut size={28} />} onClick={logout}>
          Retire from Heroics
        </Button>
        <p className="mt-4 font-body text-on-surface-variant uppercase tracking-widest text-xs font-bold">
          Warning: All your roasted glory will be saved, but the battle field awaits.
        </p>
      </section>

      {editTargetId && (
        <div className="fixed inset-0 z-[70] bg-on-background/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border-4 border-on-background rounded-xl shadow-[8px_8px_0px_#383835] overflow-hidden">
            <div className="bg-tertiary-container border-b-4 border-on-background px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 size={20} />
                <h3 className="font-headline font-black text-2xl uppercase tracking-tighter">Edit Resume</h3>
              </div>
              <button
                className="text-on-background"
                aria-label="Close edit modal"
                onClick={() => {
                  setEditTargetId(null);
                  setEditTitle("");
                  setEditDetails("");
                }}
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Resume Title</label>
                <input
                  type="text"
                  className="w-full border-4 border-on-background p-3 font-bold"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Description</label>
                <textarea
                  rows={4}
                  className="w-full border-4 border-on-background p-3 font-bold"
                  value={editDetails}
                  onChange={(event) => setEditDetails(event.target.value)}
                  placeholder="Update your resume description or focus area..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditTargetId(null);
                    setEditTitle("");
                    setEditDetails("");
                  }}
                >
                  Cancel
                </Button>
                <Button variant="tertiary" onClick={handleEditConfirm} disabled={isMutating || !editTitle.trim()}>
                  {isMutating ? "SAVING..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTargetId && (
        <div className="fixed inset-0 z-[70] bg-on-background/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border-4 border-on-background rounded-xl shadow-[8px_8px_0px_#383835] overflow-hidden">
            <div className="bg-secondary-container border-b-4 border-on-background px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} />
                <h3 className="font-headline font-black text-2xl uppercase tracking-tighter">Delete Resume?</h3>
              </div>
              <button
                className="text-on-background"
                aria-label="Close delete modal"
                onClick={() => setDeleteTargetId(null)}
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <p className="font-bold text-on-background">
                This will permanently remove the selected resume and all associated roasts and votes.
              </p>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteTargetId(null)}>
                  Keep It
                </Button>
                <Button variant="secondary" onClick={handleDeleteConfirm} disabled={isMutating}>
                  {isMutating ? "DELETING..." : "Delete Forever"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
