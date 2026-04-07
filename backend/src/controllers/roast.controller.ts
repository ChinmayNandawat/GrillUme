import { Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const createRoast = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { resumeId, text } = req.body;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!resumeId || !text) {
      res.status(400).json({ message: 'resumeId and text are required' });
      return;
    }

    const { data: resume, error: resumeError } = await supabase
      .from('Resume')
      .select('id')
      .eq('id', resumeId)
      .maybeSingle();

    if (resumeError) throw resumeError;
    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    const payload = {
      id: crypto.randomUUID(),
      text: String(text).trim(),
      createdAt: new Date().toISOString(),
      resumeId: String(resumeId),
      userId,
    };

    const { data, error } = await supabase.from('Roast').insert([payload]).select().single();
    if (error) throw error;

    const { data: roastAuthor, error: roastAuthorError } = await supabase
      .from('User')
      .select('username')
      .eq('id', userId)
      .maybeSingle();

    if (roastAuthorError) throw roastAuthorError;

    res.status(201).json({
      roast: {
        id: data.id,
        text: data.text,
        createdAt: data.createdAt,
        resumeId: data.resumeId,
        username: roastAuthor?.username || 'unknown_user',
      },
    });
  } catch (error) {
    console.error('Create roast error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteRoast = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from('Roast')
      .select('id,userId')
      .eq('id', id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) {
      res.status(404).json({ message: 'Roast not found' });
      return;
    }
    if (existing.userId !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const { error } = await supabase.from('Roast').delete().eq('id', id);
    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Delete roast error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getRoastsByResumeId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resumeId } = req.params;

    const { data: roasts, error } = await supabase
      .from('Roast')
      .select('id,text,createdAt,resumeId,userId')
      .eq('resumeId', resumeId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const roastList = roasts || [];
    const userIds = Array.from(new Set(roastList.map((roast) => roast.userId)));
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id,username')
      .in('id', userIds);

    if (usersError) throw usersError;

    const usernameById = new Map<string, string>();
    (users || []).forEach((user) => usernameById.set(user.id, user.username));

    res.status(200).json({
      roasts: roastList.map((roast) => ({
        id: roast.id,
        text: roast.text,
        createdAt: roast.createdAt,
        resumeId: roast.resumeId,
        username: usernameById.get(roast.userId) || 'unknown_user',
      })),
    });
  } catch (error) {
    console.error('Get roasts by resume id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};