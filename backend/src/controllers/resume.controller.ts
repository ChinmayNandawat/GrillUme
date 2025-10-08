import { Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const getResumes = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parsePositiveInt(req.query.page as string | undefined, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit as string | undefined, 10), 50);
    const query = ((req.query.query as string | undefined) || '').trim();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let supabaseQuery = supabase
      .from('Resume')
      .select('id,title,field,details,isClassified,fileUrl,createdAt,updatedAt,userId', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (query) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,field.ilike.%${query}%`);
    }

    const { data, error, count } = await supabaseQuery;

    if (error) throw error;

    res.status(200).json({
      data: data || [],
      page,
      limit,
      total: count || 0,
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

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

export const updateResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, field, details, isClassified, fileUrl } = req.body;

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

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (title !== undefined) updates.title = String(title).trim();
    if (field !== undefined) updates.field = String(field).trim();
    if (details !== undefined) updates.details = String(details).trim();
    if (isClassified !== undefined) updates.isClassified = Boolean(isClassified);
    if (fileUrl !== undefined) updates.fileUrl = fileUrl ? String(fileUrl) : null;

    const { data, error } = await supabase
      .from('Resume')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ resume: data });
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getResumeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: resume, error: resumeError } = await supabase
      .from('Resume')
      .select('id,title,field,details,isClassified,fileUrl,createdAt,updatedAt,userId')
      .eq('id', id)
      .maybeSingle();

    if (resumeError) throw resumeError;
    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    const { data: roasts, error: roastError } = await supabase
      .from('Roast')
      .select('id,text,createdAt,resumeId,userId')
      .eq('resumeId', id)
      .order('createdAt', { ascending: false });

    if (roastError) throw roastError;

    res.status(200).json({
      resume,
      roasts: roasts || [],
    });
  } catch (error) {
    console.error('Get resume by id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
