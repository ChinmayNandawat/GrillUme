export const STORAGE_KEYS = {
  RESUMES: 'roastume_resumes',
  ROASTS: 'roastume_roasts',
  USER_STATS: 'roastume_user_stats',
  BATTLE_SCROLLS: 'roastume_battle_scrolls',
  AUTH_TOKEN: 'roastume_auth_token',
  FIRE_COUNTS: 'roastume_fire_counts',
};

export const ITEMS_PER_PAGE = 6;

export const MAX_ROAST_LENGTH = 500;

export const MAX_FIRE_PER_USER_PER_RESUME = 5;

export const APP_NAME = "ROASTUME";

export const SPLASH_CONFIG = {
  HEALTH_ENDPOINT: import.meta.env.VITE_SPLASH_HEALTH_ENDPOINT || "/api/health",
  MAX_WAIT_MS: 90000,
  PING_INTERVAL_MS: 1400,
  REQUEST_TIMEOUT_MS: 2500,
};

export const SPLASH_LOADING_MESSAGES = [
  "Waking up our server... it went to sleep, it does that.",
  "Render's free tier is having a moment. Please don't judge.",
];
