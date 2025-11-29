export interface Resume {
  id: string;
  name: string;
  role: string;
  date: string;
  fires: string;
  comments: string;
  avatar: string;
  quote?: string;
  variant: "blue" | "red" | "green" | "yellow";
  isHot?: boolean;
  isChampion?: boolean;
  pdfUrl?: string;
}

export interface Roast {
  id: string;
  resumeId: string;
  user: string;
  text: string;
  likes: number;
  variant: "yellow" | "red" | "blue";
  align?: "end";
}

export interface UserStats {
  resumesOffered: string;
  totalRoastsReceived: string;
  globalRank: string;
  level: number;
  rankTitle: string;
  name: string;
  role: string;
  avatar: string;
}

export interface BattleScroll {
  id: string;
  name: string;
  date: string;
  roasts: string;
  colors: string[];
}
