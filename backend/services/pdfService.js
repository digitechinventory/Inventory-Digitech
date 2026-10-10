import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonScriptPath = path.resolve(__dirname, 'pdfConverter.py');

/**
 * Converts a PDF file or base64 PDF string into an array of rendered image pages.
 * @param {string} pdfPathOrBase64 - File path or Base64 data of PDF
 * @param {number} maxPages - Maximum pages to convert (default 10)
 * @returns {Promise<{success: boolean, total_pages: number, orientation: 'portrait'|'landscape', pages: Array}>}
 */
export async function convertPdfToImages(pdfPathOrBase64, maxPages = 10) {
  return new Promise((resolve, reject) => {
    let tempFilePath = null;
    let targetArg = pdfPathOrBase64;

    try {
      // If it's a base64 string or doesn't exist as a local path, write to temp file
      if (!fs.existsSync(pdfPathOrBase64)) {
        const cleanB64 = pdfPathOrBase64.includes(',') ? pdfPathOrBase64.split(',')[1] : pdfPathOrBase64;
        const buffer = Buffer.from(cleanB64, 'base64');
        tempFilePath = path.join(os.tmpdir(), `doc_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
        fs.writeFileSync(tempFilePath, buffer);
        targetArg = tempFilePath;
      }
    } catch (e) {
      return reject(new Error('Gagal menyiapkan data PDF: ' + e.message));
    }

    const pythonCmd = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
    const pyProcess = spawn(pythonCmd, [pythonScriptPath, targetArg]);

    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    pyProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    pyProcess.on('close', (code) => {
      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch {}
      }

      if (code !== 0) {
        return reject(new Error(`Konversi PDF gagal (exit code ${code}): ${stderrData || stdoutData}`));
      }

      try {
        const result = JSON.parse(stdoutData.trim());
        if (!result.success) {
          return reject(new Error(result.error || 'Konversi PDF gagal'));
        }
        resolve(result);
      } catch (err) {
        reject(new Error('Gagal memproses hasil konversi PDF: ' + err.message));
      }
    });

    pyProcess.on('error', (err) => {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch {}
      }
      reject(new Error('Tidak dapat menjalankan script python konversi PDF: ' + err.message));
    });
  });
}
