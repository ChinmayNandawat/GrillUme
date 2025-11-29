import { useEffect, useState } from "react";
import { ResumeCard } from "../components/roast/ResumeCard";
import { repository } from "../services/repository";
import type { Resume } from "../types";

export default function Home() {
  const [resumes, setResumes] = useState<Resume[]>([]);

  useEffect(() => {
    const fetchResumes = () => {
      setResumes(repository.getAllResumes());
    };

    fetchResumes();
    repository.addListener("resumes-changed", fetchResumes);

    return () => {
      repository.removeListener("resumes-changed", fetchResumes);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resumes.map((resume) => (
        <ResumeCard 
          key={resume.id}
          {...resume}
        />
      ))}
    </div>
  );
}