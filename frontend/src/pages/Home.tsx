import { motion } from "motion/react";
import { Search, Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { SectionHeader } from "../components/ui/SectionHeader";
import { Hero } from "../components/ui/Hero";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Pagination } from "../components/ui/Pagination";
import { ResumeCard, ResumeCardSkeleton } from "../components/roast/ResumeCard";
import { Link } from "react-router-dom";
import { useEffect, useState, ChangeEvent, useCallback, useMemo } from "react";
import { getResumes } from "../services/api.ts";
import { Resume } from "../types";
import { ITEMS_PER_PAGE } from "../constants";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../context/AuthContext";

export const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const showHero = Boolean(isAuthenticated && user);
  // Single source of truth for the current view's resumes
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalBurns, setTotalBurns] = useState(0);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const heroLevel = useMemo(() => Math.max(1, 1 + Math.floor(Math.max(0, totalBurns) / 25)), [totalBurns]);

  // Derive computed lists using memoization
  const hottestResumes = useMemo(() => {
    // Only show hottest resumes on the first page when not searching
    if (currentPage !== 1 || debouncedSearchQuery) return [];

    const score = (resume: Resume): number => {
      const fires = Number.parseInt(String(resume.fires).replace(/[^0-9-]/g, ""), 10) || 0;
      const comments = Number.parseInt(String(resume.comments).replace(/[^0-9-]/g, ""), 10) || 0;
      const championBoost = resume.isChampion ? 1000 : 0;
      const hotBoost = resume.isHot ? 500 : 0;
      return championBoost + hotBoost + fires * 3 + comments;
    };

    return resumes
      .slice()
      .sort((a, b) => score(b) - score(a))
      .slice(0, 3);
  }, [resumes, currentPage, debouncedSearchQuery]);

  const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);

  const fetchResumes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, total, metrics } = await getResumes(currentPage, ITEMS_PER_PAGE, debouncedSearchQuery);
      setResumes(data);
      setTotalItems(total);
      setTotalBurns(metrics.totalBurns);
    } catch (err) {
      console.error("Failed to fetch resumes:", err);
      setError("The battle servers are currently under heavy fire. We couldn't retrieve the targets.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchQuery]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); 
  };

  return (
    <div className="max-w-screen-2xl mx-auto">
      {isAuthenticated && user && (
        <Hero 
          avatar={user.avatarUrl}
          level={`LVL ${heroLevel}`}
          title={`WELCOME BACK, ${user.googleDisplayName.toUpperCase()}!`}
          subtitle="READY TO INCINERATE SOME DREAMS TODAY?"
          stats={[
            { label: "BURNS", value: `${Math.max(0, totalBurns)}` },
            { label: "TARGETS", value: `${totalItems}`, color: "text-tertiary" }
          ]}
        />
      )}

      {/* Search Section */}
      <section className={`mb-16 px-2 ${showHero ? "" : "mt-8"}`}>
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute -top-6 -left-2 bg-tertiary text-white px-4 py-1 comic-border font-headline text-lg uppercase italic z-10 -rotate-2">
            FIND A VICTIM...
          </div>
          <div className="flex comic-border bg-white kinetic-shadow overflow-hidden">
            <input 
              className="w-full bg-transparent border-none p-4 font-body font-bold placeholder:text-outline focus:ring-0 text-base uppercase" 
              placeholder="SEARCH BY USERNAME, TITLE, OR DESCRIPTION..." 
              type="text"
              value={searchQuery}
              onChange={handleSearch}
            />
            <div className="bg-primary-container px-6 border-l-4 border-on-background flex items-center">
              <Search className="font-black" />
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <ErrorState onRetry={fetchResumes} message={error} className="mb-20" />
      ) : (
        <>
          {/* Hottest Resumes */}
          {hottestResumes.length > 0 && (
            <section className="mb-20">
              <SectionHeader title="HOTTEST RESUMES" variant="secondary" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {hottestResumes.map(resume => (
                  <ResumeCard key={resume.id} {...resume} />
                ))}
              </div>
            </section>
          )}

          {/* The Arena */}
          <section className="mb-20">
            <SectionHeader 
              title={debouncedSearchQuery ? "SEARCH RESULTS" : "THE ARENA"} 
              extra={<div className="bg-primary-container px-4 py-1 comic-border font-headline uppercase font-black text-sm italic rotate-2">{debouncedSearchQuery ? "FILTERED" : "LIVE FEED"}</div>} 
            />
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => <ResumeCardSkeleton key={i} />)}
              </div>
            ) : resumes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {resumes.map(resume => (
                  <ResumeCard key={resume.id} {...resume} />
                ))}
              </div>
            ) : (
              <EmptyState 
                title="NO VICTIMS FOUND!" 
                description={debouncedSearchQuery ? `We couldn't find any resumes matching "${debouncedSearchQuery}". Maybe they're hiding?` : "The arena is currently empty. No one is brave enough to be roasted yet."}
                action={debouncedSearchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>CLEAR SEARCH</Button>
                ) : (
                  <Link to="/upload">
                    <Button variant="primary">BE THE FIRST VICTIM</Button>
                  </Link>
                )}
              />
            )}

            {/* Pagination */}
            {!isLoading && (
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            )}
          </section>
        </>
      )}

      {/* FAB */}
      <Link to="/upload" aria-label="Upload a new resume for roasting">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Upload a new resume"
          className="fixed bottom-10 right-10 w-16 h-16 bg-secondary text-white rounded-full comic-border shadow-[4px_4px_0px_0px_#383835] flex items-center justify-center z-40"
        >
          <Plus size={32} strokeWidth={4} />
        </motion.button>
      </Link>
    </div>
  );
};