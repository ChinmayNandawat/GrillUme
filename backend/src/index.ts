import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import resumeRoutes from './routes/resume.routes';
import roastRoutes from './routes/roast.routes';
import voteRoutes from './routes/vote.routes';
import { errorHandler, notFoundHandler } from './middleware/error';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required. Add it to server/.env before starting the server.');
}

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/roasts', roastRoutes);
app.use('/api/votes', voteRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
