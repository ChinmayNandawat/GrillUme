import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { supabase, supabaseAdmin, supabaseAuth } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { env } from '../config/env';

type UserStatsPayload = {
  resumes: number;
  roastsReceived: number;
  burnsReceived: number;
  globalRank: number;
};

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;

const normalizeUsername = (value: string): string => value.trim().toLowerCase();

const extractGoogleProfile = (authUser: { id: string; user_metadata?: Record<string, unknown> }) => {
  const metadata = authUser.user_metadata || {};
  const rawDisplayName =
    metadata.full_name || metadata.name || metadata.user_name || metadata.preferred_username || 'Google User';
  const rawAvatar = metadata.avatar_url || metadata.picture || metadata.photo_url || '';

  return {
    googleUid: authUser.id,
    googleDisplayName: String(rawDisplayName).trim() || 'Google User',
    avatarUrl: String(rawAvatar).trim(),
  };
};

const getCallbackRedirectTo = (): string => {
  const firstOrigin = env.allowedOrigins[0] || env.FRONTEND_URL;
  return `${firstOrigin.replace(/\/$/, '')}/auth/callback`;
};

const getLeaderboardStats = async (currentUserId: string): Promise<UserStatsPayload> => {
  const [
    { data: users, error: usersError },
    { data: resumes, error: resumesError },
    { data: roasts, error: roastsError },
    { data: votes, error: votesError },
  ] = await Promise.all([
    supabase.from('User').select('id'),
    supabase.from('Resume').select('id,userId'),
    supabase.from('Roast').select('id,resumeId'),
    supabase.from('Vote').select('roastId,type'),
  ]);

  if (usersError) throw usersError;
  if (resumesError) throw resumesError;
  if (roastsError) throw roastsError;
  if (votesError) throw votesError;

  const resumeList = resumes || [];
  const roastList = roasts || [];
  const voteList = votes || [];

  const resumeCountByUserId = new Map<string, number>();
  const resumeOwnerByResumeId = new Map<string, string>();
  resumeList.forEach((resume) => {
    resumeOwnerByResumeId.set(resume.id, resume.userId);
    resumeCountByUserId.set(resume.userId, (resumeCountByUserId.get(resume.userId) || 0) + 1);
  });

  const resumeOwnerByRoastId = new Map<string, string>();
  const roastsReceivedByUserId = new Map<string, number>();
  roastList.forEach((roast) => {
    const ownerId = resumeOwnerByResumeId.get(roast.resumeId);
    if (!ownerId) return;

    resumeOwnerByRoastId.set(roast.id, ownerId);
    roastsReceivedByUserId.set(ownerId, (roastsReceivedByUserId.get(ownerId) || 0) + 1);
  });

  const burnsReceivedByUserId = new Map<string, number>();
  voteList.forEach((vote) => {
    const ownerId = resumeOwnerByRoastId.get(vote.roastId);
    if (!ownerId) return;

    const delta = vote.type === 'up' ? 1 : vote.type === 'down' ? -1 : 0;
    if (delta === 0) return;

    burnsReceivedByUserId.set(ownerId, (burnsReceivedByUserId.get(ownerId) || 0) + delta);
  });

  const leaderboard = (users || []).map((user) => {
    const burnsReceived = burnsReceivedByUserId.get(user.id) || 0;
    const roastsReceived = roastsReceivedByUserId.get(user.id) || 0;
    return {
      userId: user.id,
      burnsReceived,
      roastsReceived,
    };
  });

  leaderboard.sort((a, b) => {
    if (b.burnsReceived !== a.burnsReceived) return b.burnsReceived - a.burnsReceived;
    if (b.roastsReceived !== a.roastsReceived) return b.roastsReceived - a.roastsReceived;
    return a.userId.localeCompare(b.userId);
  });

  const currentIndex = leaderboard.findIndex((entry) => entry.userId === currentUserId);
  const currentEntry = leaderboard[currentIndex] || { burnsReceived: 0, roastsReceived: 0 };

  return {
    resumes: resumeCountByUserId.get(currentUserId) || 0,
    roastsReceived: currentEntry.roastsReceived,
    burnsReceived: currentEntry.burnsReceived,
    globalRank: currentIndex >= 0 ? currentIndex + 1 : leaderboard.length + 1,
  };
};

export const beginGoogleAuth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabaseAuth.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getCallbackRedirectTo(),
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    });

    if (error || !data.url) {
      throw new AppError(500, 'Failed to initialize Google sign in', 'GOOGLE_AUTH_INIT_FAILED');
    }

    res.status(200).json({
      url: data.url,
      provider: 'google',
      prompt: 'select_account',
    });
  } catch (error) {
    next(error);
  }
};

export const completeGoogleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, accessToken, refreshToken, expiresAt } = req.body as {
      code?: string;
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    };

    let resolvedAccessToken = accessToken || '';
    let resolvedRefreshToken = refreshToken;
    let resolvedExpiresAt = expiresAt;
    let authUser: { id: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null = null;

    if (code) {
      const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(code);
      if (error || !data?.session?.access_token || !data.user) {
        throw new AppError(401, 'Google auth callback failed', 'GOOGLE_AUTH_CALLBACK_FAILED');
      }

      resolvedAccessToken = data.session.access_token;
      resolvedRefreshToken = data.session.refresh_token || undefined;
      resolvedExpiresAt = data.session.expires_at || undefined;
      authUser = {
        id: data.user.id,
        app_metadata: data.user.app_metadata as Record<string, unknown> | undefined,
        user_metadata: data.user.user_metadata as Record<string, unknown> | undefined,
      };
    } else if (resolvedAccessToken) {
      const { data, error } = await supabaseAdmin.auth.getUser(resolvedAccessToken);
      if (error || !data.user) {
        throw new AppError(401, 'Google auth token is invalid', 'GOOGLE_AUTH_CALLBACK_FAILED');
      }
      authUser = {
        id: data.user.id,
        app_metadata: data.user.app_metadata as Record<string, unknown> | undefined,
        user_metadata: data.user.user_metadata as Record<string, unknown> | undefined,
      };
    } else {
      throw new AppError(400, 'Missing callback payload', 'GOOGLE_AUTH_CALLBACK_FAILED');
    }

    const provider = String(authUser.app_metadata?.provider || '');
    if (provider !== 'google') {
      throw new AppError(403, 'Only Google sign in is allowed', 'GOOGLE_ONLY_AUTH');
    }

    const profile = extractGoogleProfile({
      id: authUser.id,
      user_metadata: authUser.user_metadata,
    });
    const { data: existingUser, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('googleUid', profile.googleUid)
      .maybeSingle();

    if (userError) throw userError;

    if (!existingUser) {
      res.status(200).json({
        accessToken: resolvedAccessToken,
        refreshToken: resolvedRefreshToken,
        expiresAt: resolvedExpiresAt,
        onboardingRequired: true,
        pendingProfile: {
          googleUid: profile.googleUid,
          googleDisplayName: profile.googleDisplayName,
          avatarUrl: profile.avatarUrl,
        },
      });
      return;
    }

    res.status(200).json({
      accessToken: resolvedAccessToken,
      refreshToken: resolvedRefreshToken,
      expiresAt: resolvedExpiresAt,
      onboardingRequired: !existingUser.onboardingComplete,
      user: existingUser,
    });
  } catch (error) {
    next(error);
  }
};

export const checkUsernameAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawUsername = String(req.query.username || '');
    const username = normalizeUsername(rawUsername);

    if (!USERNAME_REGEX.test(username)) {
      res.status(200).json({
        available: false,
        username,
        reason: 'Username must be 3-24 chars: lowercase letters, numbers, underscore',
      });
      return;
    }

    const { data, error } = await supabase.from('User').select('id').eq('username', username).maybeSingle();

    if (error) throw error;

    res.status(200).json({
      available: !data,
      username,
    });
  } catch (error) {
    next(error);
  }
};

export const completeOnboarding = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.authUid) {
      throw new AppError(401, 'Unauthorized', 'AUTH_REQUIRED');
    }

    const username = normalizeUsername(String(req.body.username || ''));
    if (!USERNAME_REGEX.test(username)) {
      throw new AppError(
        400,
        'Username must be 3-24 chars: lowercase letters, numbers, underscore',
        'INVALID_USERNAME'
      );
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(req.authUid);
    if (authError || !authData?.user) {
      throw new AppError(401, 'Invalid auth session', 'INVALID_AUTH_SESSION');
    }

    const provider = String(authData.user.app_metadata?.provider || '');
    if (provider !== 'google') {
      throw new AppError(403, 'Only Google sign in is allowed', 'GOOGLE_ONLY_AUTH');
    }

    const profile = extractGoogleProfile({
      id: authData.user.id,
      user_metadata: authData.user.user_metadata as Record<string, unknown> | undefined,
    });

    const now = new Date().toISOString();

    const { data: existingByUid, error: existingByUidError } = await supabase
      .from('User')
      .select('*')
      .eq('googleUid', profile.googleUid)
      .maybeSingle();

    if (existingByUidError) throw existingByUidError;

    if (existingByUid?.onboardingComplete) {
      res.status(200).json({ user: existingByUid, onboardingRequired: false });
      return;
    }

    const { data: existingByUsername, error: existingByUsernameError } = await supabase
      .from('User')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingByUsernameError) throw existingByUsernameError;
    if (existingByUsername && existingByUsername.id !== existingByUid?.id) {
      throw new AppError(409, 'Username already taken', 'USERNAME_TAKEN');
    }

    if (existingByUid) {
      const { data: updated, error: updateError } = await supabase
        .from('User')
        .update({
          username,
          googleDisplayName: profile.googleDisplayName,
          avatarUrl: profile.avatarUrl,
          onboardingComplete: true,
          updatedAt: now,
        })
        .eq('id', existingByUid.id)
        .select('*')
        .single();

      if (updateError) throw updateError;
      res.status(200).json({ user: updated, onboardingRequired: false });
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from('User')
      .insert([
        {
          id: crypto.randomUUID(),
          googleUid: profile.googleUid,
          googleDisplayName: profile.googleDisplayName,
          username,
          avatarUrl: profile.avatarUrl,
          onboardingComplete: true,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .select('*')
      .single();

    if (insertError) {
      const duplicate = String((insertError as { code?: string }).code || '') === '23505';
      if (duplicate) {
        throw new AppError(409, 'Username already taken', 'USERNAME_TAKEN');
      }
      throw insertError;
    }

    res.status(200).json({ user: inserted, onboardingRequired: false });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ success: true });
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      next(new AppError(401, 'Unauthorized', 'AUTH_REQUIRED'));
      return;
    }

    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!user) {
      next(new AppError(401, 'User not found or invalid token', 'INVALID_TOKEN'));
      return;
    }

    const computedStats = await getLeaderboardStats(userId);

    res.status(200).json({
      user: {
        ...user,
        _count: {
          resumes: computedStats.resumes,
          roasts: computedStats.roastsReceived,
        },
      },
      stats: {
        resumes: computedStats.resumes,
        roastsReceived: computedStats.roastsReceived,
        burnsReceived: computedStats.burnsReceived,
        globalRank: computedStats.globalRank,
      },
    });
  } catch (error) {
    next(error);
  }
};
