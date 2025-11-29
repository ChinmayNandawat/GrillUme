import { Resume, Roast, UserStats, BattleScroll } from "../types";
import { repository } from "./repository";

/**
 * API Service Layer (Refactored)
 * 
 * These functions act as a thin wrapper around the Repository, 
 * simulating network delays and providing a clean interface for the UI.
 * This layer is ready to be swapped with actual fetch/axios calls.
 */

/**
 * Fetches resumes from the arena with pagination and search.
 */
export const getResumes = async (page: number = 1, limit: number = 6, query: string = ""): Promise<{ data: Resume[], total: number }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let resumes = repository.getAllResumes();
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    resumes = resumes.filter(r => 
      r.name.toLowerCase().includes(lowerQuery) || 
      r.role.toLowerCase().includes(lowerQuery)
    );
  }
  
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    data: resumes.slice(start, end),
    total: resumes.length
  };
};

/**
 * Fetches a single resume by its ID.
 */
export const getResumeById = async (id: string): Promise<{ resume: Resume, roasts: Roast[] } | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const resume = repository.getResumeById(id);
  if (!resume) return null;
  
  const roasts = repository.getRoastsByResumeId(id);
  
  return { resume, roasts };
};

/**
 * Adds a new roast to a resume.
 */
export const addRoast = async (resumeId: string, text: string): Promise<Roast> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newRoast: Roast = {
    id: crypto.randomUUID(),
    resumeId,
    user: "@Current_User", // Mocking current user
    text,
    likes: 0,
    variant: (["yellow", "red", "blue"] as const)[Math.floor(Math.random() * 3)],
    align: Math.random() > 0.5 ? "end" : undefined,
  };
  
  repository.addRoast(newRoast);
  
  return newRoast;
};

/**
 * Votes on a roast.
 */
export const voteRoast = async (roastId: string, type: 'up' | 'down'): Promise<{ likes: number }> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const newLikes = repository.updateRoastLikes(roastId, type);
  return { likes: newLikes };
};

/**
 * Fetches the current user's profile stats.
 */
export const getUserStats = async (): Promise<UserStats> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return repository.getUserStats();
};

/**
 * Fetches the current user's battle scrolls (uploaded resumes).
 */
export const getBattleScrolls = async (): Promise<BattleScroll[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return repository.getBattleScrolls();
};

/**
 * Uploads a new resume for roasting.
 */
export const uploadResume = async (resumeData: { title: string, field: string, details: string, isClassified: boolean }): Promise<Resume> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const id = crypto.randomUUID();
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();

  const newResume: Resume = {
    id,
    name: resumeData.title,
    role: resumeData.field,
    date: dateStr,
    fires: "0",
    comments: "0",
    avatar: `https://picsum.photos/seed/${resumeData.title}/200`,
    variant: (["blue", "red", "green", "yellow"] as const)[Math.floor(Math.random() * 4)],
  };
  
  const newScroll: BattleScroll = {
    id,
    name: `${newResume.name}.pdf`,
    date: dateStr,
    roasts: "0",
    colors: ["bg-primary-container"]
  };
  
  repository.addResume(newResume, newScroll);
  
  return newResume;
};
