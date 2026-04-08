import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { env } from '../config/env';
import path from 'path';
import { cloudinary } from '../config/cloudinary';
import { sanitizeSearchQuery } from '../utils/searchSanitizer';

type ResumeRow = {
  id: string;
  title: string;
  field: string;
  details: string;
  isClassified: boolean;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

type PublicUserRow = {
  id: string;
  username: string;
  avatarUrl: string;
};


const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getStorageObjectPathFromUrl = (fileUrl?: string | null): string | null => {
  if (!fileUrl) return null;

  try {
    const parsed = new URL(fileUrl);
    const marker = `/storage/v1/object/public/${env.SUPABASE_RESUME_BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
};

const getPublicUserMap = async (userIds: string[]): Promise<Map<string, PublicUserRow>> => {
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('User')
    .select('id,username,avatarUrl')
    .in('id', Array.from(new Set(userIds)));

  if (error) throw error;

  const map = new Map<string, PublicUserRow>();
  (data || []).forEach((user) => {
    map.set(user.id, user as PublicUserRow);
  });

  return map;
};

const getMatchingUserIdsByUsername = async (query: string): Promise<string[]> => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const { data, error } = await supabase
    .from('User')
    .select('id')
    .ilike('username', `%${normalizedQuery}%`);

  if (error) throw error;

  return (data || []).map((user) => user.id);
};

const getGlobalTotalBurns = async (): Promise<number> => {
  const [{ count: upvoteCount, error: upvoteCountError }, { count: downvoteCount, error: downvoteCountError }] =
    await Promise.all([
      supabase.from('Vote').select('*', { count: 'exact', head: true }).eq('type', 'up'),
      supabase.from('Vote').select('*', { count: 'exact', head: true }).eq('type', 'down'),
    ]);

  if (upvoteCountError) throw upvoteCountError;
  if (downvoteCountError) throw downvoteCountError;

  return (upvoteCount || 0) - (downvoteCount || 0);
};


const withResumeMetrics = async (
  resumes: ResumeRow[]
): Promise<Array<ResumeRow & { roastsCount: number; burnsCount: number }>> => {
  const resumeIds = resumes.map((resume) => resume.id);
  const roastsByResumeId = new Map<string, number>();
  const burnsByResumeId = new Map<string, number>();

  if (resumeIds.length === 0) {
    return resumes.map((resume) => ({ ...resume, roastsCount: 0, burnsCount: 0 }));
  }

  const { data: roasts, error: roastsError } = await supabase
    .from('Roast')
    .select('id,resumeId')
    .in('resumeId', resumeIds);

  if (roastsError) throw roastsError;

  const roastList = roasts || [];
  roastList.forEach((roast) => {
    roastsByResumeId.set(roast.resumeId, (roastsByResumeId.get(roast.resumeId) || 0) + 1);
  });

  const roastIds = roastList.map((roast) => roast.id);
  if (roastIds.length > 0) {
    const { data: votes, error: votesError } = await supabase
      .from('Vote')
      .select('roastId,type')
      .in('roastId', roastIds);

    if (votesError) throw votesError;

    const roastIdToResumeId = new Map(roastList.map((roast) => [roast.id, roast.resumeId]));

    (votes || []).forEach((vote) => {
      const resumeId = roastIdToResumeId.get(vote.roastId);
      if (!resumeId) return;

      const delta = vote.type === 'up' ? 1 : vote.type === 'down' ? -1 : 0;
      if (delta === 0) return;

      burnsByResumeId.set(resumeId, (burnsByResumeId.get(resumeId) || 0) + delta);
    });
  }

  return resumes.map((resume) => ({
    ...resume,
    roastsCount: roastsByResumeId.get(resume.id) || 0,
    burnsCount: burnsByResumeId.get(resume.id) || 0,
  }));
};


export const getResumes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parsePositiveInt(req.query.page as string | undefined, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit as string | undefined, 10), 50);
    const rawQuery = (req.query.query as string | undefined) || '';
    const sanitizedQuery = sanitizeSearchQuery(rawQuery, 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    if (sanitizedQuery.becameEmptyAfterSanitization) {
      const totalBurns = await getGlobalTotalBurns();

      res.status(200).json({
        data: [],
        page,
        limit,
        total: 0,
        metrics: {
          totalBurns,
        },
      });
      return;
    }

    const query = sanitizedQuery.value;
    const matchingUserIds = query ? await getMatchingUserIdsByUsername(query) : [];

    let supabaseQuery = supabase
      .from('Resume')
      .select('id,title,field,details,isClassified,fileUrl,createdAt,updatedAt,userId', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (query) {
      const searchParts = [`title.ilike.%${query}%`, `details.ilike.%${query}%`];

      if (matchingUserIds.length > 0) {
        searchParts.push(`userId.in.(${matchingUserIds.join(',')})`);
      }

      supabaseQuery = supabaseQuery.or(searchParts.join(','));
    }

    const { data, error, count } = await supabaseQuery;

    if (error) throw error;

    const resumes = data || [];
    const resumeIds = resumes.map((resume) => resume.id);

    const roastsByResumeId = new Map<string, number>();
    const burnsByResumeId = new Map<string, number>();

    if (resumeIds.length > 0) {
      const { data: roasts, error: roastsError } = await supabase
        .from('Roast')
        .select('id,resumeId')
        .in('resumeId', resumeIds);

      if (roastsError) throw roastsError;

      const roastList = roasts || [];
      const roastIds = roastList.map((roast) => roast.id);

      roastList.forEach((roast) => {
        roastsByResumeId.set(roast.resumeId, (roastsByResumeId.get(roast.resumeId) || 0) + 1);
      });

      if (roastIds.length > 0) {
        const { data: votes, error: votesError } = await supabase
          .from('Vote')
          .select('roastId,type')
          .in('roastId', roastIds);

        if (votesError) throw votesError;

        const roastIdToResumeId = new Map(roastList.map((roast) => [roast.id, roast.resumeId]));

        (votes || []).forEach((vote) => {
          const resumeId = roastIdToResumeId.get(vote.roastId);
          if (!resumeId) return;

          const delta = vote.type === 'up' ? 1 : vote.type === 'down' ? -1 : 0;
          if (delta === 0) return;

          burnsByResumeId.set(resumeId, (burnsByResumeId.get(resumeId) || 0) + delta);
        });
      }
    }

    const totalBurns = await getGlobalTotalBurns();
    const publicUsers = await getPublicUserMap(resumes.map((resume) => resume.userId));

    res.status(200).json({
      data: resumes.map((resume) => ({
        id: resume.id,
        title: resume.title,
        field: resume.field,
        details: resume.details,
        isClassified: resume.isClassified,
        fileUrl: resume.fileUrl,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
        ownerUsername: publicUsers.get(resume.userId)?.username || 'unknown_user',
        ownerAvatarUrl: publicUsers.get(resume.userId)?.avatarUrl || '',
        roastsCount: roastsByResumeId.get(resume.id) || 0,
        burnsCount: burnsByResumeId.get(resume.id) || 0,
      })),
      page,
      limit,
      total: count || 0,
      metrics: {
        totalBurns,
      },
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    next(error);
  }
};


export const getMyResumes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      next(new AppError(401, 'Unauthorized', 'AUTH_REQUIRED'));
      return;
    }

    const { data, error } = await supabase
      .from('Resume')
      .select('id,title,field,details,isClassified,fileUrl,createdAt,updatedAt,userId')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const resumesWithMetrics = await withResumeMetrics((data || []) as ResumeRow[]);

    res.status(200).json({
      data: resumesWithMetrics,
      total: resumesWithMetrics.length,
    });
  } catch (error) {
    console.error('Get my resumes error:', error);
    next(error);
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

export const deleteResume = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      next(new AppError(401, 'Unauthorized', 'AUTH_REQUIRED'));
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from('Resume')
      .select('id,userId')
      .eq('id', id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) {
      next(new AppError(404, 'Resume not found', 'NOT_FOUND'));
      return;
    }
    if (existing.userId !== userId) {
      next(new AppError(403, 'Forbidden', 'FORBIDDEN'));
      return;
    }

    const { data: resumeWithFile, error: resumeFileError } = await supabase
      .from('Resume')
      .select('fileUrl')
      .eq('id', id)
      .maybeSingle();

    if (resumeFileError) throw resumeFileError;

    const { error } = await supabase.from('Resume').delete().eq('id', id);
    if (error) throw error;

    const cloudinaryAsset = getCloudinaryAssetFromUrl(resumeWithFile?.fileUrl as string | undefined);
    if (cloudinaryAsset) {
      try {
        await cloudinary.uploader.destroy(cloudinaryAsset.publicId, {
          resource_type: cloudinaryAsset.resourceType,
        });
      } catch (cloudinaryDeleteError) {
        console.error('Cloudinary delete warning:', cloudinaryDeleteError);
      }
    }

    const objectPath = getStorageObjectPathFromUrl(resumeWithFile?.fileUrl as string | undefined);
    if (objectPath) {
      const { error: storageDeleteError } = await supabase
        .storage
        .from(env.SUPABASE_RESUME_BUCKET || 'resumes')
        .remove([objectPath]);

      if (storageDeleteError) {
        console.error('Storage delete warning:', storageDeleteError.message);
      }
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete resume error:', error);
    next(error);
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

    const userMap = await getPublicUserMap([
      resume.userId,
      ...(roasts || []).map((roast) => roast.userId),
    ]);

    res.status(200).json({
      resume: {
        id: resume.id,
        title: resume.title,
        field: resume.field,
        details: resume.details,
        isClassified: resume.isClassified,
        fileUrl: resume.fileUrl,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
        ownerUsername: userMap.get(resume.userId)?.username || 'unknown_user',
        ownerAvatarUrl: userMap.get(resume.userId)?.avatarUrl || '',
      },
      roasts: (roasts || []).map((roast) => ({
        id: roast.id,
        text: roast.text,
        createdAt: roast.createdAt,
        resumeId: roast.resumeId,
        username: userMap.get(roast.userId)?.username || 'unknown_user',
      })),
    });
  } catch (error) {
    console.error('Get resume by id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const uploadResumeFile = async (
  req: AuthRequest & { file?: Express.Multer.File },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      next(new AppError(401, 'Unauthorized', 'AUTH_REQUIRED'));
      return;
    }

    if (!req.file) {
      next(new AppError(400, 'No file uploaded', 'FILE_REQUIRED'));
      return;
    }

    const uploaded = await uploadToCloudinary(req.file, req.userId);

    res.status(201).json({
      file: {
        originalName: req.file.originalname,
        fileName: uploaded.publicId,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: uploaded.secureUrl,
        absoluteUrl: uploaded.secureUrl,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      next(new AppError(500, `Cloud storage upload failed: ${error.message}`, 'CLOUD_UPLOAD_FAILED'));
      return;
    }
    next(error);
  }
};

const getCloudinaryAssetFromUrl = (
  fileUrl?: string | null
): { publicId: string; resourceType: 'image' | 'video' | 'raw' } | null => {
  if (!fileUrl) return null;

  try {
    const parsed = new URL(fileUrl);
    if (!parsed.hostname.includes('res.cloudinary.com')) {
      return null;
    }

    const match = parsed.pathname.match(/\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    if (!match?.[1] || !match?.[2]) {
      return null;
    }

    return {
      resourceType: match[1].toLowerCase() as 'image' | 'video' | 'raw',
      publicId: match[2],
    };
  } catch {
    return null;
  }
};

const uploadToCloudinary = async (
  file: Express.Multer.File,
  userId: string
): Promise<{ publicId: string; secureUrl: string }> => {
  const extension = path.extname(file.originalname).toLowerCase() || '.bin';
  const safeExtension = extension.replace(/[^a-z0-9]/gi, '') || 'bin';
  const publicId = `${env.CLOUDINARY_FOLDER}/${userId}-${Date.now()}-${crypto.randomUUID()}`;
  const isPdf = file.mimetype === 'application/pdf';
  const resourceType: 'image' | 'raw' = isPdf ? 'raw' : 'image';

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: resourceType,
        format: safeExtension,
        type: 'upload',
        access_mode: 'public',
        overwrite: false,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }

        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
        });
      }
    );

    uploadStream.end(file.buffer);
  });
};
