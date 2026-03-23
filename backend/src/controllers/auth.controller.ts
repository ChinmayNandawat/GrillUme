import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import { AppError } from '../middleware/error';
import { env } from '../config/env';

const getJwtSecret = (): string => {
  return env.JWT_SECRET;
};


type UserStatsPayload = {
  resumes: number;
  roastsReceived: number;
  burnsReceived: number;
  globalRank: number;
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



export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const { data: existingUsers, error: checkError } = await supabase
      .from('User')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .limit(1);

    if (checkError) throw checkError;

    if (existingUsers && existingUsers.length > 0) {
      res.status(409).json({ message: 'Email or username already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data: newUser, error: createError } = await supabase
      .from('User')
      .insert([
        {
          id: newId,
          username,
          email,
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .select()
      .single();

    if (createError) throw createError;

    const token = jwt.sign({ userId: newUser.id }, getJwtSecret(), {
      expiresIn: '7d',
    });

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error FULL:', JSON.stringify(error, Object.getOwnPropertyNames(error as Error)));
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      res.status(500).json({ message: 'Server configuration error: JWT secret is missing' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Database error finding user:', error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, getJwtSecret(), {
      expiresIn: '7d',
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      res.status(500).json({ message: 'Server configuration error: JWT secret is missing' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
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
      console.error('Database error finding user:', userError);
      throw userError;
    }

    if (!user) {
      next(new AppError(401, 'User not found or invalid token', 'INVALID_TOKEN'));
      return;
    }

    const computedStats = await getLeaderboardStats(userId);

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      user: {
        ...userWithoutPassword,
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
    console.error('GetMe error:', error);
    next(error);
  }
};