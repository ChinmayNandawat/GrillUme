import { ArrowRight, Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { ResumeCard } from "../components/roast/ResumeCard";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { repository } from "../services/repository";
import { Resume } from "../types";

const Home = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);

  const fetchResumes = useCallback(() => {
    setResumes(repository.getAllResumes());
  }, []);

  useEffect(() => {
    fetchResumes();
    repository.addListener("resumes-changed", fetchResumes);
    return () => {
      repository.removeListener("resumes-changed", fetchResumes);
    };
  }, [fetchResumes]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4">
      {/* Hero Section */}
      <section className="mb-20 text-center pt-10">
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic text-on-background">
          GRILL <span className="text-primary italic">U</span> ME
        </h1>
        <p className="text-xl md:text-2xl font-bold text-on-surface-variant max-w-2xl mx-auto mb-10 uppercase tracking-tight">
          THE ULTIMATE ARENA WHERE DREAMS ARE INCINERATED AND CAREERS ARE FORGED IN FIRE.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/upload">
            <Button variant="primary" className="px-10 py-6 text-2xl italic font-black">
              OFFER SACRIFICE <Plus className="ml-2 inline" size={28} strokeWidth={3} />
            </Button>
          </Link>
          <Button variant="secondary" className="px-10 py-6 text-2xl italic font-black">
            START ROASTING <ArrowRight className="ml-2 inline" size={28} strokeWidth={3} />
          </Button>
        </div>
      </section>

      {/* The Arena */}
      <section className="mb-20">
        <div className="flex items-end justify-between mb-10 border-b-8 border-on-background pb-4">
          <h2 className="text-5xl font-black uppercase italic tracking-tighter text-on-background">
            THE ARENA
          </h2>
          <div className="bg-primary-container px-4 py-1 comic-border font-headline uppercase font-black text-sm italic rotate-2">
            LIVE FEED
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resumes.map(resume => (
            <ResumeCard key={resume.id} {...resume} />
          ))}
        </div>
      </section>

      {/* FAB (Mobile only or fixed) */}
      <Link to="/upload" className="fixed bottom-10 right-10 md:hidden">
        <button className="w-16 h-16 bg-secondary text-white rounded-full comic-border shadow-[4px_4px_0px_0px_#383835] flex items-center justify-center z-40">
          <Plus size={32} strokeWidth={4} />
        </button>
      </Link>
    </div>
  );
};

export default Home;
