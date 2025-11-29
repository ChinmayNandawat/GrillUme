import { Resume, Roast, UserStats, BattleScroll } from "../types";

export const dummyResumes: Resume[] = [
  {
    id: "1",
    name: "CHAD_CODER_99",
    role: "Junior Web Dev",
    date: "OCT 24, 2026",
    fires: "852",
    comments: "124",
    avatar: "https://picsum.photos/seed/chad/200",
    variant: "blue",
    isHot: true,
  },
  {
    id: "2",
    name: "PIXEL_PUNISHER",
    role: "Lead Product Designer",
    date: "OCT 24, 2026",
    fires: "2.4k",
    comments: "412",
    avatar: "https://picsum.photos/seed/pixel/200",
    variant: "red",
    isChampion: true,
  },
  {
    id: "3",
    name: "STAT_SAMURAI",
    role: "Data Analyst",
    date: "OCT 24, 2026",
    fires: "542",
    comments: "88",
    avatar: "https://picsum.photos/seed/stat/200",
    variant: "green",
    isHot: true,
  },
  { id: "4", name: "CREATIVE_CHAOS", role: "Creative Director", date: "OCT 24, 2026", fires: "243", comments: "56", avatar: "https://picsum.photos/seed/chaos/200", variant: "yellow" },
  { id: "5", name: "JUNIOR_JUNKIE", role: "Data Scientist", date: "OCT 24, 2026", fires: "189", comments: "22", avatar: "https://picsum.photos/seed/junkie/200", variant: "blue" },
  { id: "6", name: "WORDY_WIZARD", role: "Content Writer", date: "OCT 24, 2026", fires: "112", comments: "14", avatar: "https://picsum.photos/seed/wizard/200", variant: "red" },
  { id: "7", name: "DEV_DESTROYER", role: "Fullstack Engineer", date: "OCT 24, 2026", fires: "98", comments: "12", avatar: "https://picsum.photos/seed/destroyer/200", variant: "green" },
  { id: "8", name: "ECO_WARRIOR", role: "Sustainability Expert", date: "OCT 24, 2026", fires: "74", comments: "8", avatar: "https://picsum.photos/seed/eco/200", variant: "green" },
  { id: "9", name: "FIRE_STARTER", role: "UX Researcher", date: "OCT 24, 2026", fires: "156", comments: "31", avatar: "https://picsum.photos/seed/fire/200", variant: "red" },
];

export const dummyRoasts: Roast[] = [
  {
    id: "1",
    resumeId: "1",
    user: "@Junior_Dev_Slayer",
    text: "Is this a font or a cry for help? Comic Sans would have been more professional than this spacing nightmare!",
    likes: 12,
    variant: "yellow",
  },
  {
    id: "2",
    resumeId: "1",
    user: "@CEO_Vibe_Check",
    text: '"Passionate about synergy." My eyes are bleeding. Did a LinkedIn bot write this bio?',
    likes: 84,
    variant: "red",
    align: "end",
  },
  {
    id: "3",
    resumeId: "1",
    user: "@Recruiter_Exposed",
    text: 'Skills section: "Fast learner." Translation: I spent 5 minutes on a YouTube tutorial before putting this on my resume.',
    likes: 25,
    variant: "blue",
  },
];

export const currentUserStats: UserStats = {
  resumesOffered: "12",
  totalRoastsReceived: "482",
  globalRank: "#42",
  level: 99,
  rankTitle: "Legendary Survivor",
  name: "The Roastmaster",
  role: "Senior Infrastructure Sorcerer",
  avatar: "https://picsum.photos/seed/master/400",
};

export const dummyBattleScrolls: BattleScroll[] = [
  { id: "1", name: "Software_Engineer_V3.pdf", date: "OCT 12, 1994 (Comic Era)", roasts: "24", colors: ["bg-primary-container", "bg-secondary-container", "bg-tertiary-container"] },
  { id: "2", name: "Product_Lead_Final_V2.pdf", date: "SEP 05, 1994", roasts: "8", colors: ["bg-punchy-red", "bg-surface-variant"] },
];
