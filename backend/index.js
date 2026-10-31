// Digitech IMS Server Entrypoint
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend directory and fallback to root
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import mosRoutes from './routes/mos.js';
import usersRoutes from './routes/users.js';
import sitesRoutes from './routes/sites.js';
import geoRoutes from './routes/geo.js';
import toolsRoutes from './routes/tools.js';
import opnameRoutes from './routes/opname.js';
import agendasRoutes from './routes/agendas.js';
import notificationsRoutes from './routes/notifications.js';
import projectInventoryRoutes from './routes/projectInventory.js';
import printerRoutes from './routes/printer.js';

import { errorHandler } from './middleware/errorHandler.js';
import { sendSuccess } from './middleware/responseHandler.js';
import {
  globalRateLimit,
  strictRateLimit,
  xssInjectionGuard,
  additionalSecurityHeaders
} from './middleware/security.js';

const app = express();
const PORT = process.env.PORT || 3001;
// Listen on 127.0.0.1 (localhost only) agar tidak mengekspos web server ke Tailscale / LAN
const HOST = process.env.HOST || '127.0.0.1';

// â”€â”€â”€ Security Layer 1: Helmet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false, // Diperlukan agar iframe Spline bisa akses resource
  hsts: false, // Jangan paksa HTTPS pada port lokal / Tailscale tanpa SSL
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // 'wasm-unsafe-eval' diperlukan untuk Spline WebAssembly runtime
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'", 'blob:', 'https://prod.spline.design', 'https://cdn.spline.design', 'https://unpkg.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https:', 'wss:', 'http:', 'blob:'],
      // blob: diperlukan untuk Spline Web Workers
      workerSrc: ["'self'", 'blob:'],
      frameSrc: ["'self'"],
      mediaSrc: ["'self'", 'blob:', 'data:'],
      upgradeInsecureRequests: null, // PENTING: Mencegah browser memaksa https:// pada port 3001
    }
  }
}));

// â”€â”€â”€ Security Layer 2: Custom Headers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(additionalSecurityHeaders);

// â”€â”€â”€ Security Layer 3: Global Rate Limit (200 req/menit per IP) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(globalRateLimit);

// â”€â”€â”€ CORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    if (
      origin === process.env.CLIENT_URL ||
      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|100\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)
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

// â”€â”€â”€ Security Layer 4: XSS & SQL Injection Guard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/api', xssInjectionGuard);

// â”€â”€â”€ Routes (Dual-mounted for /api/* and /* for Vercel serverless compatibility) â”€
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/inventory', inventoryRoutes);
app.use('/inventory', inventoryRoutes);

app.use('/api/mos', strictRateLimit, mosRoutes);
app.use('/mos', strictRateLimit, mosRoutes);

app.use('/api/users', strictRateLimit, usersRoutes);
app.use('/users', strictRateLimit, usersRoutes);

app.use('/api/sites', sitesRoutes);
app.use('/sites', sitesRoutes);

app.use('/api/geo', geoRoutes);
app.use('/geo', geoRoutes);

app.use('/api/tools', toolsRoutes);
app.use('/tools', toolsRoutes);

app.use('/api/opname', opnameRoutes);
app.use('/opname', opnameRoutes);

app.use('/api/agendas', agendasRoutes);
app.use('/agendas', agendasRoutes);

app.use('/api/notifications', notificationsRoutes);
app.use('/notifications', notificationsRoutes);

// â”€â”€â”€ Static Files for Uploaded Documents (PDF & Images) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
try {
  const isServerless = Boolean(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const uploadsDir = isServerless ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const documentsUploadDir = path.join(uploadsDir, 'documents');
  if (!fs.existsSync(documentsUploadDir)) {
    fs.mkdirSync(documentsUploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));
} catch (e) {
  console.warn('[Storage] Upload directory init skipped (read-only environment):', e.message);
}

app.use('/api/project-inventory', projectInventoryRoutes);
app.use('/project-inventory', projectInventoryRoutes);

app.use('/api/printer', printerRoutes);
app.use('/printer', printerRoutes);

// â”€â”€â”€ Health Check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const healthHandler = (req, res) => {
  return sendSuccess(res, {
    status: 'ok',
    service: 'Digitech IMS API',
    version: '1.0.0 (Production Architecture)',
    environment: process.env.NODE_ENV || 'development',
    supabase: !!process.env.SUPABASE_URL,
    redis: !!(process.env.REDIS_URL || (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)),
    mailer: !!process.env.SMTP_USER,
    security: { rateLimit: true, bruteForce: true, xssGuard: true, helmetHeaders: true }
  }, 'API Server Digitech IMS berjalan normal.');
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// â”€â”€â”€ Frontend Static Files Disabled (Pure REST API Server) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Server port 3001 hanya melayani endpoint REST API (/api/*).
// Frontend web diakses secara terpisah via port development (5175) atau domain terdaftar.

// â”€â”€â”€ 404 Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use((req, res, next) => {
  const err = new Error(`Route ${req.method} ${req.originalUrl} tidak ditemukan pada server API`);
  err.statusCode = 404;
  err.code = 'RESOURCE_NOT_FOUND';
  next(err);
});

// â”€â”€â”€ Global Error Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(errorHandler);

// â”€â”€â”€ Server Start â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
if (process.env.NODE_ENV !== 'test' && !isVercel) {
  const HOST = process.env.HOST || '127.0.0.1';
  app.listen(PORT, HOST, () => {
    console.log(`

      Digitech IMS API Server v1.0 (SECURE - PURE REST API)          

  URL     : http://${HOST}:${PORT}
  Supabase: ${process.env.SUPABASE_URL ? 'Connected' : 'Not configured'}
  Redis   : ${process.env.REDIS_URL ? 'Local Redis' : process.env.UPSTASH_REDIS_REST_URL ? 'Upstash' : 'In-memory'}
  Mailer  : ${process.env.SMTP_USER ? 'Gmail SMTP Active' : 'Not configured'}
    `);
  });
}

export default app;
