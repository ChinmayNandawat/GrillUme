import { Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

type RoastRow = {
  id: string;
  text: string;
  createdAt: string;
  resumeId: string;
  userId: string;
};

const REACTION_TYPE = 'fire';

const getReactionCountMap = async (roastIds: string[]): Promise<Map<string, number>> => {
  const map = new Map<string, number>();
  if (roastIds.length === 0) return map;

  const countResults = await Promise.all(
    roastIds.map(async (roastId) => {
      const { count, error } = await supabase
        .from('Vote')
        .select('*', { count: 'exact', head: true })
        .eq('roastId', roastId);

      if (error) throw error;

      return { roastId, count: count || 0 };
    })
  );

  countResults.forEach(({ roastId, count }) => {
    map.set(roastId, count);
  });

  return map;
};

const getReactedByMeSet = async (roastIds: string[], userId?: string): Promise<Set<string>> => {
  const set = new Set<string>();
  if (!userId || roastIds.length === 0) return set;

  const { data, error } = await supabase
    .from('Vote')
    .select('roastId')
    .eq('userId', userId)
    .in('roastId', roastIds);

  if (error) throw error;

  (data || []).forEach((reaction) => {
    set.add(reaction.roastId);
  });

  return set;
};

const getReactionStateForRoast = async (
  roastId: string,
  userId?: string
): Promise<{ reactionCount: number; reactedByMe: boolean }> => {
  const [{ count: reactionCount, error: countError }, reactedByMeSet] = await Promise.all([
    supabase.from('Vote').select('*', { count: 'exact', head: true }).eq('roastId', roastId),
    getReactedByMeSet([roastId], userId),
  ]);

  if (countError) throw countError;

  return {
    reactionCount: reactionCount || 0,
    reactedByMe: reactedByMeSet.has(roastId),
  };
};

const mapRoastResponse = (
  roast: RoastRow,
  usernameById: Map<string, string>,
  reactionCountMap: Map<string, number>,
  reactedByMeSet: Set<string>
) => ({
  id: roast.id,
  text: roast.text,
  createdAt: roast.createdAt,
  resumeId: roast.resumeId,
  username: usernameById.get(roast.userId) || 'unknown_user',
  reactionCount: reactionCountMap.get(roast.id) || 0,
  reactedByMe: reactedByMeSet.has(roast.id),
});

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
        reactionCount: 0,
        reactedByMe: false,
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


export const getRoastsByResumeId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    const { data: roasts, error } = await supabase
      .from('Roast')
      .select('id,text,createdAt,resumeId,userId')
      .eq('resumeId', resumeId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const roastList = roasts || [];
    if (roastList.length === 0) {
      res.status(200).json({ roasts: [] });
      return;
    }

    const userIds = Array.from(new Set(roastList.map((roast) => roast.userId)));
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id,username')
      .in('id', userIds);

    if (usersError) throw usersError;

    const usernameById = new Map<string, string>();
    (users || []).forEach((user) => usernameById.set(user.id, user.username));

    const roastIds = roastList.map((roast) => roast.id);
    const [reactionCountMap, reactedByMeSet] = await Promise.all([
      getReactionCountMap(roastIds),
      getReactedByMeSet(roastIds, userId),
    ]);

    res.status(200).json({
      roasts: roastList.map((roast) => mapRoastResponse(roast, usernameById, reactionCountMap, reactedByMeSet)),
    });
  } catch (error) {
    console.error('Get roasts by resume id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addReaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const roastId = String(req.params.id);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
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

    const { data: existingReaction, error: existingError } = await supabase
      .from('Vote')
      .select('id')
      .eq('roastId', roastId)
      .eq('userId', userId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (!existingReaction) {
      const payload = {
        id: crypto.randomUUID(),
        roastId,
        userId,
        type: REACTION_TYPE,
        createdAt: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from('Vote').insert([payload]);
      if (insertError) throw insertError;
    }

    const state = await getReactionStateForRoast(roastId, userId);
    res.status(200).json(state);
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeReaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const roastId = String(req.params.id);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { error } = await supabase.from('Vote').delete().eq('roastId', roastId).eq('userId', userId);
    if (error) throw error;

    const state = await getReactionStateForRoast(roastId, userId);
    res.status(200).json(state);
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};