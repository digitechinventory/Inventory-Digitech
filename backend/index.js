import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import mosRoutes from './routes/mos.js';
import usersRoutes from './routes/users.js';
import sitesRoutes from './routes/sites.js';
import geoRoutes from './routes/geo.js';
import toolsRoutes from './routes/tools.js';
import opnameRoutes from './routes/opname.js';

import { errorHandler } from './middlewares/errorHandler.js';
import { sendSuccess } from './middlewares/responseHandler.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;


// ─── Security & Parsing ────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or same-origin
    if (!origin) return callback(null, true);
    // In development mode, allow any origin (e.g. mobile IP, localhost, custom ports)
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (
      origin === process.env.CLIENT_URL ||
      /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/mos', mosRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/opname', opnameRoutes);

// ─── Health Check (SDD Unified Response) ──────────────────────────────────
app.get('/api/health', (req, res) => {
  return sendSuccess(res, {
    status: 'ok',
    service: 'Digitech IMS API',
    version: '1.0.0 (Production Architecture)',
    environment: process.env.NODE_ENV || 'development',
    supabase: !!process.env.SUPABASE_URL,
    redis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    mailer: !!process.env.SMTP_USER,
    telegram: false
  }, 'API Server Digitech IMS berjalan normal.');
});

// ─── Frontend Static Files & SPA Routing ─────────────────────────────────
const possibleDistPaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, 'public'),
  path.join(__dirname, '../FrontEnd/dist'),
  path.join(__dirname, '../frontend/dist')
];

let distDir = null;
for (const p of possibleDistPaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    distDir = p;
    break;
  }
}

if (distDir) {
  console.log(`[Static] Serving frontend SPA from: ${distDir}`);
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// ─── 404 Route Handler for unmatched API routes ──────────────────────────
app.use((req, res, next) => {
  const err = new Error(`Route ${req.method} ${req.originalUrl} tidak ditemukan pada server`);
  err.statusCode = 404;
  err.code = 'RESOURCE_NOT_FOUND';
  next(err);
});

// ─── Global Error Handler (SDD RFC 7807 / JSend) ───────────────────────────
app.use(errorHandler);

// ─── Server Start ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`
              Digitech IMS — API Server v1.0           
            Inventory Management System                
  Port: http://localhost:${PORT}                      
  Supabase: ${process.env.SUPABASE_URL ? ' Connected' : ' Not configured'}                    
  Redis: ${process.env.UPSTASH_REDIS_REST_URL ? ' Upstash' : ' In-memory fallback'}                  
  Mailer: ${process.env.SMTP_USER ? ' Gmail SMTP Active' : ' Simulated Logger'}             
  Telegram:  Takedown (Roadmap)                   
    `);
  });
}

export default app;
