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

    res.status(201).json({ roast: data });
  } catch (error) {
    console.error('Create roast error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};