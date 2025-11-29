import type { Resume, Roast, UserStats, BattleScroll } from "../types";
import { dummyResumes, dummyRoasts, currentUserStats, dummyBattleScrolls } from "./dummyData";
import { STORAGE_KEYS } from "../constants";

type RepositoryEvent = "resumes-changed" | "roasts-changed" | "stats-changed" | "scrolls-changed";
type RepositoryListener = () => void;

class Repository {
  private resumes: Resume[] = [];
  private roasts: Roast[] = [];
  private userStats: UserStats | null = null;
  private battleScrolls: BattleScroll[] = [];
  private listeners: Map<RepositoryEvent, Set<RepositoryListener>> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    this.resumes = this.load(STORAGE_KEYS.RESUMES, dummyResumes);
    this.roasts = this.load(STORAGE_KEYS.ROASTS, dummyRoasts);
    this.userStats = this.load(STORAGE_KEYS.USER_STATS, currentUserStats);
    this.battleScrolls = this.load(STORAGE_KEYS.BATTLE_SCROLLS, dummyBattleScrolls);
  }

  // --- Event Handling ---
  addListener(event: RepositoryEvent, listener: RepositoryListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(listener);
  }

  removeListener(event: RepositoryEvent, listener: RepositoryListener) {
    this.listeners.get(event)?.delete(listener);
  }

  private notify(event: RepositoryEvent) {
    this.listeners.get(event)?.forEach(l => l());
  }
  // ----------------------

  private load<T>(key: string, defaultValue: T): T {
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(`[Repository] Failed to parse ${key} from storage`, e);
      return defaultValue;
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(this.resumes));
      localStorage.setItem(STORAGE_KEYS.ROASTS, JSON.stringify(this.roasts));
      localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(this.userStats));
      localStorage.setItem(STORAGE_KEYS.BATTLE_SCROLLS, JSON.stringify(this.battleScrolls));
    } catch (e) {
      console.error('[Repository] Persistence failed', e);
    }
  }

  getAllResumes(): Resume[] {
    return [...this.resumes];
  }

  getResumeById(id: string): Resume | null {
    return this.resumes.find(r => r.id === id) || null;
  }

  getRoastsByResumeId(resumeId: string): Roast[] {
    return this.roasts.filter(r => r.resumeId === resumeId);
  }

  getUserStats(): UserStats {
    return this.userStats ? { ...this.userStats } : currentUserStats;
  }

  getBattleScrolls(): BattleScroll[] {
    return [...this.battleScrolls];
  }

  getRoastById(id: string): Roast | null {
    return this.roasts.find(r => r.id === id) || null;
  }

  addResume(resume: Resume, scroll: BattleScroll) {
    this.resumes = [resume, ...this.resumes];
    this.battleScrolls = [scroll, ...this.battleScrolls];
    this.persist();
    this.notify("resumes-changed");
    this.notify("scrolls-changed");
  }

  addRoast(roast: Roast) {
    // 1. Add the roast
    this.roasts = [...this.roasts, roast];
    
    // 2. Update the resume's comment count
    this.resumes = this.resumes.map(r => {
      if (r.id === roast.resumeId) {
        const currentComments = parseInt(r.comments.replace(/[^0-9]/g, '')) || 0;
        return { ...r, comments: (currentComments + 1).toString() };
      }
      return r;
    });

    // 3. Persist both changes
    this.persist();
    this.notify("roasts-changed");
    this.notify("resumes-changed");
  }

  updateRoastLikes(roastId: string, type: 'up' | 'down'): number {
    let newLikes = 0;
    this.roasts = this.roasts.map(r => {
      if (r.id === roastId) {
        newLikes = type === 'up' ? r.likes + 1 : r.likes - 1;
        return { ...r, likes: newLikes };
      }
      return r;
    });
    this.persist();
    this.notify("roasts-changed");
    return newLikes;
  }
}

export const repository = new Repository();
