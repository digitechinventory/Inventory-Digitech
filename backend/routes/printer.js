import express from 'express';
import net from 'net';
import { sendSuccess, sendError } from '../middlewares/responseHandler.js';

const router = express.Router();

/**
 * Test TCP ping to network thermal printer
 * Standard port for thermal label printers is 9100 (RAW) or custom HTTP port
 */
router.post('/ping', async (req, res) => {
  const { ip, port = 9100, timeout = 2500 } = req.body;

  if (!ip) {
    return sendError(res, 'IP Address printer wajib diisi', 400);
  }

  const startTime = Date.now();
  const socket = new net.Socket();

  let isResolved = false;

  const cleanup = () => {
    socket.removeAllListeners();
    socket.destroy();
  };

  socket.setTimeout(timeout);

  socket.on('connect', () => {
    if (isResolved) return;
    isResolved = true;
    const latencyMs = Date.now() - startTime;
    cleanup();
    return sendSuccess(res, {
      online: true,
      ip,
      port: Number(port),
      latencyMs,
      timestamp: new Date().toISOString()
    }, `Printer pada ${ip}:${port} berhasil terhubung (${latencyMs}ms).`);
  });

  socket.on('timeout', () => {
    if (isResolved) return;
    isResolved = true;
    cleanup();
    return sendSuccess(res, {
      online: false,
      ip,
      port: Number(port),
      timeout: true,
      timestamp: new Date().toISOString()
    }, `Koneksi ke ${ip}:${port} timeout (${timeout}ms). Pastikan printer menyala dan terhubung ke jaringan yang sama.`);
  });

  socket.on('error', (err) => {
    if (isResolved) return;
    isResolved = true;
    cleanup();
    return sendSuccess(res, {
      online: false,
      ip,
      port: Number(port),
      error: err.message,
      timestamp: new Date().toISOString()
    }, `Printer pada ${ip}:${port} tidak dapat dijangkau: ${err.message}`);
  });

  try {
    socket.connect(Number(port), ip);
  } catch (err) {
    if (!isResolved) {
      isResolved = true;
      cleanup();
      return sendSuccess(res, {
        online: false,
        ip,
        port: Number(port),
        error: err.message
      }, `Gagal memulai koneksi socket: ${err.message}`);
    }
  }
});

/**
 * Send RAW TSPL / ZPL / ESC-POS bytes to network thermal printer
 */
router.post('/raw-print', async (req, res) => {
  const { ip, port = 9100, rawData, labelCount = 1, timeout = 5000 } = req.body;

  if (!ip) {
    return sendError(res, 'IP Address printer wajib diisi', 400);
  }

  if (!rawData) {
    return sendError(res, 'Data perintah cetak (RAW payload) tidak boleh kosong', 400);
  }

  const socket = new net.Socket();
  let isResolved = false;

  const cleanup = () => {
    socket.removeAllListeners();
    socket.destroy();
  };

  socket.setTimeout(timeout);

  socket.on('connect', () => {
    try {
      // Repeat print job if labelCount > 1 and not already in command
      socket.write(rawData, 'utf-8', (err) => {
        if (err) {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            return sendError(res, `Gagal menulis data ke printer: ${err.message}`, 500);
          }
        } else {
          // Graceful close after write
          socket.end();
          if (!isResolved) {
            isResolved = true;
            cleanup();
            return sendSuccess(res, {
              success: true,
              ip,
              port,
              labelCount,
              printedAt: new Date().toISOString()
            }, `Berhasil mengirim ${labelCount} lembar perintah cetak ke ${ip}:${port}`);
          }
        }
      });
    } catch (err) {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        return sendError(res, `Gagal memproses socket write: ${err.message}`, 500);
      }
    }
  });

  socket.on('timeout', () => {
    if (isResolved) return;
    isResolved = true;
    cleanup();
    return sendError(res, `Waktu cetak habis (timeout ${timeout}ms) saat menghubungi ${ip}:${port}`, 504);
  });

  socket.on('error', (err) => {
    if (isResolved) return;
    isResolved = true;
    cleanup();
    return sendError(res, `Koneksi printer terputus: ${err.message}`, 500);
  });

  try {
    socket.connect(Number(port), ip);
  } catch (err) {
    if (!isResolved) {
      isResolved = true;
      cleanup();
      return sendError(res, `Gagal membuka koneksi socket: ${err.message}`, 500);
    }
  }
});

export default router;
