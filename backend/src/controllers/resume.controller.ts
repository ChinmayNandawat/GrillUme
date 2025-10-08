import { Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const createResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { title, field, details, isClassified, fileUrl } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!title || !field || !details) {
      res.status(400).json({ message: 'title, field, and details are required' });
      return;
    }

    const now = new Date().toISOString();
    const payload = {
      id: crypto.randomUUID(),
      title: String(title).trim(),
      field: String(field).trim(),
      details: String(details).trim(),
      isClassified: Boolean(isClassified),
      fileUrl: fileUrl ? String(fileUrl) : null,
      createdAt: now,
      updatedAt: now,
      userId,
    };

    const { data, error } = await supabase.from('Resume').insert([payload]).select().single();

    if (error) throw error;

    res.status(201).json({ resume: data });
  } catch (error) {
    console.error('Create resume error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from('Resume')
      .select('id,userId')
      .eq('id', id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }
    if (existing.userId !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const { error } = await supabase.from('Resume').delete().eq('id', id);
    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};