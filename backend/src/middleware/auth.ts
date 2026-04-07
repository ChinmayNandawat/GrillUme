import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';

export interface AuthRequest extends Request {
  authUid?: string;
  userId?: string;
}

const readBearerToken = (req: Request): string | null => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  return token || null;
};

export const authenticateSupabaseToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = readBearerToken(req);

  if (!token) {
    res.status(401).json({ message: 'Access denied: No token provided' });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ message: 'Access denied: Invalid or expired token' });
      return;
    }

    req.authUid = data.user.id;
    next();
  } catch (_error) {
    res.status(401).json({ message: 'Access denied: Invalid or expired token' });
  }
};

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = readBearerToken(req);
  if (!token) {
    res.status(401).json({ message: 'Access denied: No token provided' });
    return;
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      res.status(401).json({ message: 'Access denied: Invalid or expired token' });
      return;
    }

    req.authUid = authData.user.id;

    const { data: appUser, error: appUserError } = await supabase
      .from('User')
      .select('id,onboardingComplete')
      .eq('googleUid', authData.user.id)
      .maybeSingle();

    if (appUserError) {
      res.status(500).json({ message: 'Failed to resolve application user' });
      return;
    }

    if (!appUser || !appUser.onboardingComplete) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ONBOARDING_REQUIRED',
          message: 'Complete onboarding to continue',
        },
      });
      return;
    }

    req.userId = appUser.id;
    next();
  } catch (_error) {
    res.status(401).json({ message: 'Access denied: Invalid or expired token' });
  }
};