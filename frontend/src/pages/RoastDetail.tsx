import { Flame, ExternalLink, Edit3, MessageSquareOff } from "lucide-react";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { RoastBubble, RoastBubbleSkeleton } from "../components/roast/RoastBubble";
import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { getResumeById, addRoast, reactToRoast, unreactToRoast } from "../services/api.ts";
import { Resume, Roast } from "../types";
import { MAX_ROAST_LENGTH } from "../constants";
import { useAuth } from "../context/AuthContext.tsx";

const byCreatedAtAsc = (a: Roast, b: Roast): number => {
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();
  if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
  return aTime - bTime;
};

const mergeRoastsChronologically = (fetched: Roast[], existing: Roast[]): Roast[] => {
  const byId = new Map<string, Roast>();

  existing.forEach((roast) => {
    byId.set(roast.id, roast);
  });

  fetched.forEach((roast) => {
    byId.set(roast.id, roast);
  });

  return Array.from(byId.values()).sort(byCreatedAtAsc);
};

const appendRoast = (existing: Roast[], nextRoast: Roast): Roast[] => {
  return mergeRoastsChronologically([nextRoast], existing);
};

export const RoastDetail = () => {
  const { isAuthenticated, openAuthPanel } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [resume, setResume] = useState<Resume | null>(null);
  const [roasts, setRoasts] = useState<Roast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoastText, setNewRoastText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getResumeById(id);
      if (data) {
        setResume(data.resume);
        setRoasts((prev) => mergeRoastsChronologically(data.roasts, prev));
      } else {
        setError("TARGET NOT FOUND! This resume might have been incinerated already.");
      }
    } catch (err) {
      console.error("Failed to fetch resume detail:", err);
      setError("Failed to establish a secure connection to the target. Intelligence gathering failed.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleRoastSubmit = async () => {
    if (!id || !newRoastText.trim() || isSubmitting || newRoastText.length > MAX_ROAST_LENGTH) return;

    if (!isAuthenticated) {
      setError("Please sign in from the top bar to post roasts.");
      openAuthPanel();
      return;
    }
    
    setIsSubmitting(true);
    try {
      const newRoast = await addRoast(id, newRoastText);
      setRoasts((prev) => appendRoast(prev, newRoast));
      setNewRoastText("");
      
      // Update local resume comment count for consistency
      if (resume) {
        const currentComments = parseInt(resume.comments.replace(/[^0-9]/g, '')) || 0;
        setResume({
          ...resume,
          comments: (currentComments + 1).toString()
        });
      }
    } catch (err) {
      console.error("Failed to add roast:", err);
      setError(err instanceof Error ? err.message : "Failed to add roast");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactToggle = async (roastId: string, reactedByMe: boolean) => {
    if (!isAuthenticated) {
      setError("Please sign in from the top bar to react to roasts.");
      openAuthPanel();
      return;
    }

    try {
      const response = reactedByMe ? await unreactToRoast(roastId) : await reactToRoast(roastId);
      let fireDelta = 0;
      setRoasts((prev) =>
        prev.map((roast) => {
          if (roast.id !== roastId) return roast;
          fireDelta = response.reactionCount - roast.reactionCount;
          return {
            ...roast,
            reactionCount: response.reactionCount,
            reactedByMe: response.reactedByMe,
          };
        })
      );

      if (fireDelta !== 0) {
        setResume((prev) => {
          if (!prev) return prev;
          const currentFires = Number.parseInt(prev.fires.replace(/[^0-9]/g, ""), 10) || 0;
          return {
            ...prev,
            fires: String(Math.max(0, currentFires + fireDelta)),
          };
        });
      }
    } catch (err) {
      console.error("Failed to react:", err);
      setError(err instanceof Error ? err.message : "Failed to react");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="bg-on-background/5 p-3 rounded-lg min-h-[800px] animate-pulse"></div>
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6">
          <header className="mb-4">
            <div className="h-12 w-48 bg-on-background/10 rounded mb-2 animate-pulse"></div>
            <div className="h-4 w-32 bg-on-background/5 rounded animate-pulse"></div>
          </header>
          <div className="space-y-10">
            {Array.from({ length: 3 }).map((_, i) => <RoastBubbleSkeleton key={i} align={i % 2 === 0 ? "start" : "end"} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="max-w-4xl mx-auto py-20">
        <ErrorState 
          title={error?.includes("NOT FOUND") ? "TARGET LOST!" : "INTEL FAILURE!"}
          message={error || "We couldn't find the resume you're looking for."} 
          onRetry={fetchDetail} 
        />
      </div>
    );
  }

  const isPdfResume = Boolean(resume.pdfUrl && resume.pdfUrl.toLowerCase().endsWith(".pdf"));
  const previewImageUrl = !isPdfResume ? (resume.pdfUrl || resume.avatar || "") : "";
  const displayFires = String(resume.fires);

  return (
    <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Left Column: Resume Preview */}
      <div className="lg:col-span-7 flex flex-col gap-8">
        <div className="relative group">
          <div className="absolute -top-4 -left-4 bg-secondary text-white font-headline font-black px-6 py-2 uppercase tracking-tighter text-2xl z-10 -rotate-2 border-2 border-on-background shadow-[3px_3px_0px_0px_#383835]">
            The Target!
          </div>
          <div className="bg-on-background p-3 rounded-lg shadow-[6px_6px_0px_0px_#383835] overflow-hidden">
            <div className="bg-white border-4 border-on-background min-h-[800px] flex items-center justify-center relative">
              {isPdfResume ? (
                <iframe
                  src={resume.pdfUrl}
                  title="Resume PDF Preview"
                  className="w-full h-[800px] bg-white"
                />
              ) : previewImageUrl ? (
                <img 
                  src={previewImageUrl} 
                  alt="Resume Preview" 
                  className="w-full h-auto object-cover opacity-90 grayscale hover:grayscale-0 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-[800px] flex items-center justify-center bg-surface-container-high border-2 border-on-background text-center p-8">
                  <p className="font-headline font-black uppercase tracking-wider text-on-background">
                    No preview available for this resume.
                  </p>
                </div>
              )}
              <div className="absolute inset-0 halftone-bg pointer-events-none"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-high border-4 border-on-background p-4 shadow-[6px_6px_0px_0px_#383835] rounded-xl">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-white border-2 border-on-background px-6 py-3 font-black uppercase text-sm tracking-widest shadow-[3px_3px_0px_0px_#383835]">
              <Flame size={20} className="text-secondary fill-secondary" />
              {displayFires} Fires
            </div>
          </div>
          {resume.pdfUrl ? (
            <a href={resume.pdfUrl} target="_blank" rel="noreferrer">
              <Button variant="tertiary" className="px-6 py-3 text-sm" icon={<ExternalLink size={18} />} ariaLabel="Open PDF document">
                Open PDF
              </Button>
            </a>
          ) : (
            <Button variant="tertiary" className="px-6 py-3 text-sm" icon={<ExternalLink size={18} />} ariaLabel="Open PDF document" disabled>
              No File
            </Button>
          )}
        </div>
      </div>

      {/* Right Column: Roasts */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <header className="mb-4">
          <h2 className="font-headline font-black text-5xl uppercase tracking-tighter text-on-background drop-shadow-[2px_2px_0px_#cc0100]">
            The Roasts
          </h2>
          <p className="font-body text-sm uppercase tracking-widest font-bold opacity-70 mt-2">{roasts.length} Critical Hits Detected</p>
        </header>

        <div className="space-y-10">
          {roasts.length > 0 ? (
            roasts.map((roast) => (
              <RoastBubble 
                key={roast.id} 
                roast={roast} 
                onReact={handleReactToggle}
                align={roast.align}
              />
            ))
          ) : (
            <EmptyState 
              title="NO IMPACTS YET!" 
              description="This resume is suspiciously intact. Be the first to launch a critical hit!"
              icon={<MessageSquareOff size={64} className="text-outline opacity-20" />}
            />
          )}
        </div>

        {/* Add Comment */}
        <div className="mt-8 bg-on-background p-1 rounded-xl shadow-[6px_6px_0px_0px_#383835]">
          <div className="bg-white p-4 rounded-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-headline font-black text-xl uppercase italic tracking-tighter">Your Turn...</span>
              <Edit3 className="text-secondary" size={24} strokeWidth={3} />
            </div>
            <div className="relative">
              <textarea 
                className={`w-full bg-background border-2 border-on-background p-4 font-bold placeholder:opacity-40 focus:ring-4 focus:ring-tertiary-container outline-none transition-all h-32 ${newRoastText.length > MAX_ROAST_LENGTH ? 'border-secondary' : ''}`} 
                placeholder="Add your roast here... keep it spicy!"
                value={newRoastText}
                onChange={(e) => setNewRoastText(e.target.value)}
                disabled={isSubmitting}
                aria-label="Write your roast"
              ></textarea>
              <div className={`absolute bottom-2 right-2 text-xs font-bold ${newRoastText.length > MAX_ROAST_LENGTH ? 'text-secondary' : 'opacity-40'}`}>
                {newRoastText.length} / {MAX_ROAST_LENGTH}
              </div>
            </div>
            <Button 
              variant="secondary" 
              className="w-full py-4 shadow-[3px_3px_0px_0px_#383835]"
              onClick={handleRoastSubmit}
              disabled={!isAuthenticated || isSubmitting || !newRoastText.trim() || newRoastText.length > MAX_ROAST_LENGTH}
              ariaLabel="Submit your roast"
            >
              {!isAuthenticated ? "SIGN IN TO ROAST" : isSubmitting ? "IMPACTING..." : "SEND IMPACT!"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};