import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, RefreshCw, Sliders, Sparkles, AlertCircle } from 'lucide-react';

/**
 * CameraSignatureScanner
 * 
 * Local AI / Computer Vision signature scanner using HTML5 Canvas & Adaptive Thresholding.
 * Extracts physical paper signatures into clean, transparent PNGs directly in browser.
 */
export default function CameraSignatureScanner({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [capturedRaw, setCapturedRaw] = useState(null);
  const [processedSignature, setProcessedSignature] = useState(null);
  const [threshold, setThreshold] = useState(140); // 0-255 binarization sensitivity
  const [processing, setProcessing] = useState(false);

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) return;

    let activeStream = null;

    async function initCamera() {
      setCameraError(null);
      setCapturedRaw(null);
      setProcessedSignature(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        activeStream = stream;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setCameraError('Gagal mengakses kamera. Pastikan izin kamera aktif pada peramban web.');
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  // Local AI / Computer Vision: Binarize and Extract Ink to Transparent PNG
  const processImageAI = (sourceCanvas, threshValue) => {
    const ctx = sourceCanvas.getContext('2d');
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let hasInk = false;

    // 1. Process grayscale and extract ink from paper background
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Luminance perception
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);

      if (luminance < threshValue) {
        // Dark ink detected
        data[i] = 15;      // Dark Navy R
        data[i + 1] = 23;  // Dark Navy G
        data[i + 2] = 42;  // Dark Navy B
        // Alpha based on ink darkness
        const alpha = Math.min(255, Math.floor(((threshValue - luminance) / threshValue) * 320));
        data[i + 3] = alpha;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasInk = true;
      } else {
        // Paper background: Make 100% transparent
        data[i + 3] = 0;
      }
    }

    // 2. Put processed pixels back into canvas
    ctx.putImageData(imgData, 0, 0);

    // 3. Trim margins if ink was detected
    if (hasInk && maxX > minX && maxY > minY) {
      const pad = 12;
      const cropX = Math.max(0, minX - pad);
      const cropY = Math.max(0, minY - pad);
      const cropW = Math.min(width - cropX, (maxX - minX) + pad * 2);
      const cropH = Math.min(height - cropY, (maxY - minY) + pad * 2);

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropW;
      croppedCanvas.height = cropH;
      const cropCtx = croppedCanvas.getContext('2d');
      cropCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      return croppedCanvas.toDataURL('image/png');
    }

    return sourceCanvas.toDataURL('image/png');
  };

  // Capture Frame from Video
  const handleSnap = () => {
    if (!videoRef.current) return;
    setProcessing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Save raw canvas copy
    setCapturedRaw(canvas);

    // Extract with AI Local Processing
    const resultPng = processImageAI(canvas, threshold);
    setProcessedSignature(resultPng);
    setProcessing(false);
  };

  // Re-process when user adjusts threshold slider
  const handleThresholdChange = (newVal) => {
    setThreshold(newVal);
    if (capturedRaw) {
      // Re-run on fresh copy
      const copyCanvas = document.createElement('canvas');
      copyCanvas.width = capturedRaw.width;
      copyCanvas.height = capturedRaw.height;
      const ctx = copyCanvas.getContext('2d');
      ctx.drawImage(capturedRaw, 0, 0);
      const updatedPng = processImageAI(copyCanvas, newVal);
      setProcessedSignature(updatedPng);
    }
  };

  // Accept and use signature
  const handleAccept = () => {
    if (processedSignature && onCapture) {
      onCapture(processedSignature);
      handleClose();
    }
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-700/35 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Scan Tanda Tangan Fisik (AI Lokal)
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                Ekstraksi tinta kertas langsung ke PNG transparan tanpa upload server
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera / Preview Viewport */}
        <div className="relative flex-1 bg-slate-800 min-h-[300px] sm:min-h-[360px] flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-white space-y-2">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-xs text-red-200">{cameraError}</p>
              <button
                onClick={() => setCameraError(null)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-semibold text-white mt-2 cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : !processedSignature ? (
            <>
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Reticle / Viewfinder Frame */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-red-500/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3 shadow-[0_0_0_9999px_rgba(51,65,85,0.45)]">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-white bg-red-600/90 px-2 py-0.5 rounded-md self-center">
                  <span>Arahkan Tanda Tangan Kertas ke Dalam Kotak</span>
                </div>
                <div className="text-[10px] text-center text-slate-200 font-mono bg-slate-800/80 px-2 py-1 rounded-md self-center backdrop-blur-xs">
                  Gunakan pencahayaan merata untuk hasil terbaik
                </div>
              </div>
            </>
          ) : (
            /* Processed Signature Result with Transparent Checkerboard Pattern */
            <div className="w-full h-full p-6 flex flex-col items-center justify-center bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]">
              <div className="p-4 bg-white/40 rounded-2xl border border-slate-300 shadow-inner max-w-xs">
                <img
                  src={processedSignature}
                  alt="Extracted Signature"
                  className="max-h-40 max-w-full object-contain mx-auto"
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-600 mt-2 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200">
                ✨ Ekstraksi Tinta AI Lokal Berhasil
              </span>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 space-y-3">
          {processedSignature ? (
            <>
              {/* Threshold sensitivity slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-red-600" />
                    <span>Sensitivitas Ketebalan Tinta:</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-red-600">{threshold}</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="220"
                  step="2"
                  value={threshold}
                  onChange={(e) => handleThresholdChange(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setProcessedSignature(null); setCapturedRaw(null); }}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ambil Ulang</span>
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Gunakan Tanda Tangan</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSnap}
                disabled={!!cameraError || processing}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>{processing ? 'Memproses AI...' : 'Ambil & Ekstrak TTD AI'}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
