import { Upload as UploadIcon, Edit, Rocket, Flame } from "lucide-react";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { useRef, useState } from "react";
import { uploadResume } from "../services/api.ts";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/ui/EmptyState";
import { useNavigate } from "react-router-dom";
export const Upload = () => {
  const { isAuthenticated, openAuthPanel } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [field, setField] = useState("PRODUCT DESIGN");
  const [details, setDetails] = useState("");
  const [isClassified, setIsClassified] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!isAuthenticated) {
      openAuthPanel();
      return;
    }
    if (!title.trim() || isUploading) return;
    
    setIsUploading(true);
    setError(null);
    try {
      const newResume = await uploadResume({
        title,
        field,
        details,
        isClassified,
        file: selectedFile,
      });
      navigate(`/roast/${newResume.id}`);
    } catch (err) {
      console.error("Failed to upload resume:", err);
      const message = err instanceof Error ? err.message : "MISSION FAILURE! Upload failed.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-20">
        <EmptyState
          title="LOGIN REQUIRED TO UPLOAD"
          description="Browsing is open for everyone, but posting a resume requires sign in. Open the auth panel from the top bar and come back here."
          action={<Button variant="secondary" onClick={openAuthPanel}>OPEN SIGN IN PANEL</Button>}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-20">
        <ErrorState 
          title="LAUNCH FAILURE!"
          message={error}
          onRetry={() => setError(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto relative">
      <div className="absolute top-0 right-0 w-64 h-64 kirby-krackle opacity-10 pointer-events-none -mr-32 -mt-32"></div>
      
      <header className="mb-12 relative text-center md:text-left">
        <div className="inline-block bg-primary-container border-4 border-on-background p-4 mb-4 shadow-[6px_6px_0px_0px_#383835] -rotate-2 transform hover:rotate-0 transition-transform">
          <h1 className="text-4xl md:text-6xl font-black font-headline uppercase tracking-tighter leading-none">
            Offer Your Resume<br/>for Roasting!
          </h1>
        </div>
        <p className="font-bold text-lg max-w-2xl mt-4 border-l-8 border-secondary pl-4 italic">
          Our elite squad of professional critics is locked and loaded. Are you brave enough to take the heat?
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Drop Zone */}
        <div className="lg:col-span-7 bg-white border-4 border-on-background p-2 shadow-[6px_6px_0px_0px_#383835] rounded-lg">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setSelectedFile(file);
            }}
          />
          <div
            className="relative border-4 border-dashed border-on-background bg-background h-[400px] flex flex-col items-center justify-center group overflow-hidden cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute inset-0 halftone-bg pointer-events-none"></div>
            <div className="z-10 text-center p-8 group-hover:scale-105 transition-transform">
              <UploadIcon size={80} className="text-primary mx-auto mb-4" strokeWidth={3} />
              <h2 className="text-3xl font-black font-headline uppercase mb-2">WHAM! DROP IT HERE</h2>
              <p className="text-on-surface-variant font-bold uppercase tracking-widest text-sm">PDF, PNG, OR JPG ONLY • MAX 10MB</p>
              <p className="mt-3 text-sm font-bold uppercase tracking-wider bg-on-background text-background px-3 py-1 inline-block">
                {selectedFile ? `Selected: ${selectedFile.name}` : "Tap to choose a file"}
              </p>
            </div>
            <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-secondary"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-tertiary"></div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-high border-4 border-on-background p-6 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-primary p-2 flex items-center justify-center">
              <Edit className="text-white" size={20} />
            </div>
            <label className="block text-xs font-black uppercase tracking-widest text-on-surface mb-2">Mission Title</label>
            <input 
              className="w-full bg-white border-4 border-on-background p-3 font-bold text-on-background focus:ring-4 focus:ring-tertiary focus:outline-none transition-all" 
              placeholder="e.g., SOFTWARE SLAYER 2024" 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="bg-surface-container-high border-4 border-on-background p-6 rounded-lg relative overflow-hidden">
            <label className="block text-xs font-black uppercase tracking-widest text-on-surface mb-2">Target Field</label>
            <select 
              className="w-full bg-white border-4 border-on-background p-3 font-bold text-on-background focus:ring-4 focus:ring-tertiary focus:outline-none appearance-none"
              value={field}
              onChange={(e) => setField(e.target.value)}
              disabled={isUploading}
            >
              <option>PRODUCT DESIGN</option>
              <option>BACKEND WIZARDRY</option>
              <option>DATA SORCERY</option>
              <option>MARKETING MAVEN</option>
            </select>
          </div>

          <div className="bg-surface-container-highest border-4 border-on-background p-6 rounded-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black font-headline uppercase text-lg">Classified Mode</h3>
                <p className="text-xs font-bold uppercase opacity-60">Mask sensitive info automatically</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  className="sr-only peer" 
                  type="checkbox"
                  checked={isClassified}
                  onChange={(e) => setIsClassified(e.target.checked)}
                  disabled={isUploading}
                />
                <div className="w-14 h-8 bg-outline peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary border-2 border-on-background"></div>
              </label>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-30 transition-opacity transform rotate-12">
              <div className="border-8 border-secondary text-secondary font-black font-headline text-4xl p-2 rounded-xl">CLASSIFIED</div>
            </div>
          </div>
        </div>

        {/* Briefing Details */}
        <div className="lg:col-span-12 bg-white border-4 border-on-background p-8 rounded-lg shadow-[6px_6px_0px_0px_#383835] relative">
          <div className="absolute inset-0 halftone-bg pointer-events-none"></div>
          <label className="block text-xs font-black uppercase tracking-widest text-on-surface mb-4">Briefing Details (What do you want us to attack?)</label>
          <textarea 
            className="w-full relative z-10 bg-transparent border-4 border-on-background p-4 font-bold text-on-background focus:ring-4 focus:ring-primary-container focus:outline-none transition-all" 
            placeholder="Tell us your career traumas..." 
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            disabled={isUploading}
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="lg:col-span-12 flex flex-col items-center justify-center py-12 relative">
          <Button 
            variant="primary" 
            className="px-16 py-6 rounded-xl group"
            onClick={handleUpload}
            disabled={isUploading || !title.trim()}
          >
            <div className="flex items-center gap-4">
              <Flame size={32} className="text-secondary fill-secondary" />
              <span className="text-4xl font-black font-headline uppercase tracking-tighter">
                {isUploading ? "LAUNCHING..." : "Launch Roast"}
              </span>
              <Rocket size={32} className={isUploading ? "animate-bounce" : "rotate-180"} />
            </div>
          </Button>
          <p className="mt-8 font-black uppercase text-xs tracking-[0.2em] bg-on-background text-background px-4 py-1 skew-x-[-12deg]">
            Warning: Some feelings may be scorched
          </p>
        </div>
      </section>
    </div>
  );
};
