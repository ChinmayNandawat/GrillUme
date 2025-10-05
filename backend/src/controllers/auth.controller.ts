import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import crypto from 'crypto';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server is misconfigured: JWT_SECRET is missing');
  }
  return secret;
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
