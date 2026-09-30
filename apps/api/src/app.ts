// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Express Application
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { apiRateLimiter } from './middleware/rate-limit.middleware.js';

const app: express.Express = express();

// ── Security ─────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow requests with no origin (curl/mobile/local) or from localhost/127.0.0.1 on any port
      if (!origin || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

// ── Parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate Limiting ────────────────────────────────────────────
app.use('/api', apiRateLimiter);

// ── Routes ───────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
    timestamp: new Date().toISOString(),
  });
});

// ── Error Handler ────────────────────────────────────────────
app.use(errorMiddleware);

export { app };
