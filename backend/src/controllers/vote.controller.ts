import { Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';


const isValidVoteType = (value: string): boolean => value === 'up' || value === 'down';

const getVoteSummary = async (roastId: string): Promise<{ upvotes: number; downvotes: number }> => {
  const [{ count: upvotes }, { count: downvotes }] = await Promise.all([
    supabase.from('Vote').select('*', { count: 'exact', head: true }).eq('roastId', roastId).eq('type', 'up'),
    supabase.from('Vote').select('*', { count: 'exact', head: true }).eq('roastId', roastId).eq('type', 'down'),
  ]);

  return {
    upvotes: upvotes || 0,
    downvotes: downvotes || 0,
  };
};

export const upsertVote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { roastId, type } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!roastId || !type) {
      res.status(400).json({ message: 'roastId and type are required' });
      return;
    }

    const voteType = String(type).toLowerCase();
    if (!isValidVoteType(voteType)) {
      res.status(400).json({ message: "type must be 'up' or 'down'" });
      return;
    }

    const { data: roast, error: roastError } = await supabase
      .from('Roast')
      .select('id')
      .eq('id', roastId)
      .maybeSingle();

    if (roastError) throw roastError;
    if (!roast) {
      res.status(404).json({ message: 'Roast not found' });
      return;
    }

    const { data: existingVote, error: existingError } = await supabase
      .from('Vote')
      .select('id,type')
      .eq('roastId', roastId)
      .eq('userId', userId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingVote) {
      const { error: updateError } = await supabase
        .from('Vote')
        .update({ type: voteType })
        .eq('id', existingVote.id);

      if (updateError) throw updateError;
    } else {
      const payload = {
        id: crypto.randomUUID(),
        roastId: String(roastId),
        userId,
        type: voteType,
        createdAt: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from('Vote').insert([payload]);
      if (insertError) throw insertError;
    }

    const summary = await getVoteSummary(String(roastId));
    res.status(200).json(summary);
  } catch (error) {
    console.error('Upsert vote error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteVote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const roastId = String(req.params.roastId);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { error } = await supabase
      .from('Vote')
      .delete()
      .eq('roastId', roastId)
      .eq('userId', userId);

    if (error) throw error;

    const summary = await getVoteSummary(roastId);
    res.status(200).json(summary);
  } catch (error) {
    console.error('Delete vote error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getVotesByRoastId = async (req: Request, res: Response): Promise<void> => {
  try {
    const roastId = String(req.params.roastId);
    const summary = await getVoteSummary(roastId);
    res.status(200).json(summary);
  } catch (error) {
    console.error('Get votes by roast id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

