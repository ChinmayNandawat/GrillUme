import { STORAGE_KEYS } from "../constants";
import { AuthUser, BattleScroll, Resume, Roast, UserStats } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:3001";
  }
})();

type ApiErrorResponse = {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type BackendResume = {
  id: string;
  userId: string;
  title: string;
  field: string;
  details: string;
  isClassified: boolean;
  fileUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackendRoast = {
  id: string;
  resumeId: string;
  userId: string;
  text: string;
  createdAt: string;
};

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "UNKNOWN";
  return date
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .toUpperCase();
};

const pickVariant = (seed: string): Resume["variant"] => {
  const variants: Resume["variant"][] = ["blue", "red", "green", "yellow"];
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
};

const pickRoastVariant = (seed: string): Roast["variant"] => {
  const variants: Roast["variant"][] = ["yellow", "red", "blue"];
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
};

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

const createHeaders = (includeAuth = false, contentType = true): HeadersInit => {
  const headers: HeadersInit = {};

  if (contentType) {
    headers["Content-Type"] = "application/json";
  }

  if (includeAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Please login to continue");
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

const parseError = async (response: Response): Promise<Error> => {
  let payload: ApiErrorResponse | null = null;
  try {
    payload = (await response.json()) as ApiErrorResponse;
  } catch (_error) {
    payload = null;
  }

  const message =
    payload?.error?.message || payload?.message || `Request failed with status ${response.status}`;

  if (response.status === 401) {
    return new Error("Please login to continue");
  }

  return new Error(message);
};

const requestJson = async <T>(
  path: string,
  options: RequestInit = {},
  includeAuth = false
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...createHeaders(includeAuth, true),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
};

const mapResume = (resume: BackendResume, roastsCount = 0, likesCount = 0): Resume => ({
  id: resume.id,
  userId: resume.userId,
  name: resume.title,
  role: resume.field,
  date: formatDate(resume.createdAt),
  fires: String(likesCount),
  comments: String(roastsCount),
  avatar: `https://picsum.photos/seed/${resume.id}/300`,
  quote: resume.details,
  variant: pickVariant(resume.id),
  pdfUrl: normalizeFileUrl(resume.fileUrl),
});

const mapRoast = (roast: BackendRoast, likes = 0, index = 0): Roast => ({
  id: roast.id,
  userId: roast.userId,
  resumeId: roast.resumeId,
  user: `@${roast.userId.slice(0, 8)}`,
  text: roast.text,
  likes,
  variant: pickRoastVariant(roast.id),
  align: index % 2 === 0 ? "end" : undefined,
});

const normalizeFileUrl = (rawUrl?: string | null): string | undefined => {
  if (!rawUrl) return undefined;

  if (rawUrl.startsWith("/")) {
    return `${API_ORIGIN}${rawUrl}`;
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return `${API_ORIGIN}${parsed.pathname}${parsed.search}`;
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
};

export const registerUser = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  return requestJson<AuthResponse>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    },
    false
  );
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  return requestJson<AuthResponse>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    false
  );
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await requestJson<{ user: AuthUser }>("/api/auth/me", { method: "GET" }, true);
  return response.user;
};

export const getResumes = async (
  page = 1,
  limit = 6,
  query = ""
): Promise<{ data: Resume[]; total: number }> => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (query) params.set("query", query);

  const response = await requestJson<{ data: BackendResume[]; total: number }>(
    `/api/resumes?${params.toString()}`,
    { method: "GET" },
    false
  );

  return {
    data: response.data.map((resume) => mapResume(resume)),
    total: response.total,
  };
};

export const getResumeById = async (id: string): Promise<{ resume: Resume; roasts: Roast[] } | null> => {
  try {
    const response = await requestJson<{ resume: BackendResume; roasts: BackendRoast[] }>(
      `/api/resumes/${id}`,
      { method: "GET" },
      false
    );

    const roastsWithLikes = await Promise.all(
      response.roasts.map(async (roast, index) => {
        try {
          const votes = await requestJson<{ upvotes: number; downvotes: number }>(
            `/api/votes/roast/${roast.id}`,
            { method: "GET" },
            false
          );
          return mapRoast(roast, votes.upvotes - votes.downvotes, index);
        } catch (_error) {
          return mapRoast(roast, 0, index);
        }
      })
    );

    const likesTotal = roastsWithLikes.reduce((sum, roast) => sum + roast.likes, 0);

    return {
      resume: mapResume(response.resume, roastsWithLikes.length, likesTotal),
      roasts: roastsWithLikes,
    };
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("not found")) {
      return null;
    }
    throw error;
  }
};

export const addRoast = async (resumeId: string, text: string): Promise<Roast> => {
  const response = await requestJson<{ roast: BackendRoast }>(
    "/api/roasts",
    {
      method: "POST",
      body: JSON.stringify({ resumeId, text }),
    },
    true
  );

  return mapRoast(response.roast, 0);
};

export const voteRoast = async (roastId: string, type: "up" | "down"): Promise<{ likes: number }> => {
  const response = await requestJson<{ upvotes: number; downvotes: number }>(
    "/api/votes",
    {
      method: "POST",
      body: JSON.stringify({ roastId, type }),
    },
    true
  );

  return { likes: response.upvotes - response.downvotes };
};

export const getUserStats = async (): Promise<UserStats> => {
  const response = await requestJson<{ user: AuthUser & { _count?: { resumes?: number; roasts?: number } } }>(
    "/api/auth/me",
    { method: "GET" },
    true
  );

  const resumesCount = response.user._count?.resumes || 0;
  const roastsCount = response.user._count?.roasts || 0;

  return {
    resumesOffered: String(resumesCount),
    totalRoastsReceived: String(roastsCount),
    globalRank: `#${Math.max(1, 999 - roastsCount)}`,
    level: Math.max(1, 1 + Math.floor(roastsCount / 5)),
    rankTitle: roastsCount > 20 ? "ROAST COMMANDER" : "ROAST CADET",
    name: response.user.username,
    role: "ROAST OPERATIVE",
    avatar: `https://picsum.photos/seed/${response.user.id}/300`,
  };
};

export const getBattleScrolls = async (): Promise<BattleScroll[]> => {
  const me = await requestJson<{ user: AuthUser }>("/api/auth/me", { method: "GET" }, true);
  const list = await requestJson<{ data: BackendResume[]; total: number }>(
    "/api/resumes?page=1&limit=50",
    { method: "GET" },
    false
  );

  return list.data
    .filter((resume) => resume.userId === me.user.id)
    .map((resume) => ({
      id: resume.id,
      name: `${resume.title}.pdf`,
      date: formatDate(resume.createdAt),
      roasts: "0",
      colors: ["bg-primary-container", "bg-tertiary-container"],
    }));
};

export const uploadResume = async (resumeData: {
  title: string;
  field: string;
  details: string;
  isClassified: boolean;
  file?: File | null;
}): Promise<Resume> => {
  let fileUrl: string | null = null;

  if (resumeData.file) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Please login to continue");
    }

    const formData = new FormData();
    formData.append("file", resumeData.file);

    const uploadResponse = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw await parseError(uploadResponse);
    }

    const uploadPayload = (await uploadResponse.json()) as {
      file: { url: string; absoluteUrl?: string };
    };

    fileUrl = uploadPayload.file.absoluteUrl || normalizeFileUrl(uploadPayload.file.url) || null;
  }

  const createResponse = await requestJson<{ resume: BackendResume }>(
    "/api/resumes",
    {
      method: "POST",
      body: JSON.stringify({
        title: resumeData.title,
        field: resumeData.field,
        details: resumeData.details,
        isClassified: resumeData.isClassified,
        fileUrl,
      }),
    },
    true
  );

  return mapResume(createResponse.resume);
};

export const updateResumeById = async (
  resumeId: string,
  payload: Partial<{ title: string; field: string; details: string; isClassified: boolean; fileUrl: string | null }>
): Promise<Resume> => {
  const response = await requestJson<{ resume: BackendResume }>(
    `/api/resumes/${resumeId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );

  return mapResume(response.resume);
};

export const deleteResumeById = async (resumeId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}`, {
    method: "DELETE",
    headers: createHeaders(true, false),
  });

  if (!response.ok) {
    throw await parseError(response);
  }
};
