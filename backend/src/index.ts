import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import resumeRoutes from './routes/resume.routes';
import roastRoutes from './routes/roast.routes';
import voteRoutes from './routes/vote.routes';
import { errorHandler, notFoundHandler } from './middleware/error';
import { globalLimiter } from './middleware/rateLimiter';

const app = express();
const PORT = env.PORT;

// Trust reverse proxy for accurate IP rate limiting
app.set('trust proxy', env.TRUST_PROXY);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// Apply global rate limiting to all API requests
app.use('/api', globalLimiter);

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
