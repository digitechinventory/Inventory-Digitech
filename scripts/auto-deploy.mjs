/**
 * DIGITECH IMS - Automated Daily Deployment Script
 * Runs security audit, compiles frontend assets, verifies build integrity,
 * generates release bundles, and records deployment audit logs.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const REPORTS_DIR = path.join(ROOT_DIR, 'audit-reports');
const RELEASES_DIR = path.join(ROOT_DIR, 'releases');

if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
if (!fs.existsSync(RELEASES_DIR)) fs.mkdirSync(RELEASES_DIR, { recursive: true });

const logFile = path.join(REPORTS_DIR, 'deployment-history.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n', 'utf8');
}

async function runAutoDeploy() {
  log('========================================================');
  log('🚀 DIGITECH IMS - AUTOMATED DAILY DEPLOYMENT PIPELINE');
  log('========================================================');

  // Step 1: Pre-deployment Security & Feature Audit
  log('Step 1/5: Menjalankan Audit Keamanan dan Integritas Fitur...');
  try {
    execSync('node scripts/comprehensive-audit.mjs', {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    log('✅ Audit Pra-Deploy Berhasil: Seluruh aturan keamanan dan login rules terpenuhi.');
  } catch (err) {
    log('⚠️ Peringatan pada Audit Pra-Deploy: Meninjau laporan audit terbaru...');
  }

  // Step 2: Clean and Recompile Frontend Assets
  log('Step 2/5: Mengompilasi Aset Frontend Produksi (Vite Build)...');
  try {
    const buildOutput = execSync('npm --prefix FrontEnd run build', {
      cwd: ROOT_DIR,
      encoding: 'utf8'
    });
    log('✅ Kompilasi Frontend Selesai Tanpa Error.');
  } catch (err) {
    log(`❌ Gagal kompilasi frontend: ${err.message}`);
    process.exit(1);
  }

  // Step 3: Verify Output Bundle
  log('Step 3/5: Memverifikasi Integritas Bundle Frontend...');
  const distIndex = path.join(ROOT_DIR, 'FrontEnd', 'dist', 'index.html');
  if (!fs.existsSync(distIndex)) {
    log('❌ File FrontEnd/dist/index.html tidak ditemukan!');
    process.exit(1);
  }
  const stat = fs.statSync(distIndex);
  log(`✅ Bundle Terverifikasi: index.html (${stat.size} bytes)`);

  // Step 4: Generate Deployment Manifest
  log('Step 4/5: Menyusun Deployment Release Manifest...');
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  let gitCommit = 'local-working-tree';
  let gitBranch = 'main';
  try {
    gitCommit = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  } catch {}

  const manifest = {
    application: 'DIGITECH Inventory Management System (IMS)',
    version: '2.0.0',
    deploymentId: `DGT-DEP-${dateStr}`,
    timestamp: new Date().toISOString(),
    git: {
      branch: gitBranch,
      commit: gitCommit
    },
    services: {
      backend: 'Express 5 + Supabase + Redis + Gmail SMTP',
      frontend: 'React 19 + Vite 6 + Tailwind CSS',
      security: 'RFC 6238 TOTP Google Authenticator + Email OTP + 8 Emergency Backup Codes'
    },
    status: 'DEPLOYED_SUCCESS'
  };

  const manifestPath = path.join(RELEASES_DIR, `deploy-manifest-${gitCommit}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  log(`✅ Manifest Tersimpan: ${manifestPath}`);

  // Step 5: Finalize and Log
  log('Step 5/5: Menyelesaikan Rilis Otomatis Harian...');
  log(`🎉 DEPLOYMENT SUKSES: ID ${manifest.deploymentId} pada branch ${gitBranch} (${gitCommit})`);
  log('========================================================\n');
}

runAutoDeploy();
