import React from 'react';

/**
 * Authentic Mega Mendung Indonesian Batik SVG Corner Ornament
 * Exact design matching the Digitech Login Card and Sidebar
 */
function MegaMendungCorner({ position = 'top-left', size = 72, className = '' }) {
  const isBottomRight = position === 'bottom-right';

  return (
    <svg
      viewBox="-5 -5 160 160"
      width={size}
      height={size}
      className={`absolute pointer-events-none z-0 ${
        isBottomRight ? 'bottom-0 right-0 rotate-180 opacity-75 group-hover:opacity-90' : 'top-0 left-0 opacity-90 group-hover:opacity-100'
      } transition-opacity duration-300 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cardMmCrimson" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7F1D1D" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#991B1B" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="cardMmRedMid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B91C1C" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#DC2626" stopOpacity="0.88" />
        </linearGradient>
        <linearGradient id="cardMmRedVibrant" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DC2626" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id="cardMmRoseLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0.82" />
        </linearGradient>
      </defs>

      <g>
        {/* Layer 1: Deep Crimson Base Cloud */}
        <path
          d="M-5,-5 L155,-5 C146,18 150,38 128,48 C108,56 112,74 84,84 C62,92 66,116 36,128 C16,136 -4,142 -5,142 Z"
          fill="url(#cardMmCrimson)"
        />
        {/* Layer 2: Mid Red */}
        <path
          d="M-5,-5 L124,-5 C116,14 120,30 102,38 C84,44 88,60 64,68 C45,75 50,96 24,106 C8,112 -4,116 -5,116 Z"
          fill="url(#cardMmRedMid)"
        />
        {/* Layer 3: Vibrant Crimson Red */}
        <path
          d="M-5,-5 L92,-5 C85,10 90,22 74,28 C60,33 64,46 45,52 C30,58 34,74 14,82 C1,87 -4,90 -5,90 Z"
          fill="url(#cardMmRedVibrant)"
        />
        {/* Layer 4: Light Rose Accent */}
        <path
          d="M-5,-5 L60,-5 C54,6 58,15 46,20 C36,24 38,34 26,38 C16,42 18,54 4,60 C-3,64 -5,66 -5,66 Z"
          fill="url(#cardMmRoseLight)"
        />
        {/* Layer 5: White Tip */}
        <path
          d="M-5,-5 L30,-5 C26,2 28,8 20,11 C14,14 16,21 9,24 C4,27 -2,32 -5,35 Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />

        {/* Traditional Batik Linework Overlays */}
        <path
          d="M-5,-5 L155,-5 C146,18 150,38 128,48 C108,56 112,74 84,84 C62,92 66,116 36,128 C16,136 -4,142 -5,142"
          fill="none"
          stroke="#991B1B"
          strokeWidth="1.2"
          opacity="0.8"
        />
        <path
          d="M-5,-5 L124,-5 C116,14 120,30 102,38 C84,44 88,60 64,68 C45,75 50,96 24,106 C8,112 -4,116 -5,116"
          fill="none"
          stroke="#DC2626"
          strokeWidth="1.2"
          opacity="0.85"
        />
        <path
          d="M-5,-5 L92,-5 C85,10 90,22 74,28 C60,33 64,46 45,52 C30,58 34,74 14,82 C1,87 -4,90 -5,90"
          fill="none"
          stroke="#F87171"
          strokeWidth="1"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}

// Slant angle configuration: Sisi kanan lebih tinggi (sesuai spesifikasi pengguna)
const SLANT = '12px';
const CLIP_PARALLELOGRAM = `polygon(0 ${SLANT}, 100% 0, 100% calc(100% - ${SLANT}), 0 100%)`;

/**
 * ParallelogramCard (Kartu Jajaran Genjang)
 * - Bentuk Jajaran Genjang: Sisi kanan lebih tinggi (polygon 0 12px, 100% 0, 100% calc(100% - 12px), 0 100%)
 * - Aksen Batik Mega Mendung Merah di Pojok Kiri Atas & Kanan Bawah (Khas Card Login Digitech)
 * - Tepi kiri beraksen merah tebal (Crimson Red #C0111B)
 * - Layer bayangan 3D beraksen merah halus di belakang kartu
 * - Teks dan metrik tegak lurus, bersih, dan kontras tinggi
 */
export default function ParallelogramCard({
  title,
  value,
  unit,
  subtitle,
  subtitleIcon: SubtitleIcon,
  subtitleColor = 'text-slate-500',
  icon: Icon,
  iconColor = 'text-slate-400',
  accentColor = 'border-red-700',
  valueColor = 'text-slate-900',
  badgeText,
  badgeDotColor,
  padding = 'p-4 sm:p-5',
  onClick,
  className = ''
}) {
  return (
    <div
      onClick={onClick}
      style={{
        filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.06)) drop-shadow(0 2px 6px rgba(192,17,27,0.10))',
      }}
      className={`group relative transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      } ${className}`}
    >
      {/* ── Layer 2: 3D Accent Shadow Parallelogram ────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: CLIP_PARALLELOGRAM,
          transform: 'translate(4px, 4px)',
          background: 'linear-gradient(135deg, rgba(185,28,28,0.45), rgba(220,38,38,0.25))',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 1: Main Parallelogram Body (Clean White + Red Accents) ── */}
      <div
        style={{
          clipPath: CLIP_PARALLELOGRAM,
          background: '#FFFFFF',
          borderLeft: '5px solid #C0111B',
          borderRight: '1px solid #CBD5E1',
        }}
        className={`relative z-10 w-full h-full min-h-[120px] sm:min-h-[130px] ${padding} pt-5 pb-5 flex flex-col justify-between overflow-hidden`}
      >
        {/* ── Top Slanted Edge Border (Diagonal from 0,12 to 100%,0) ──── */}
        <svg
          aria-hidden="true"
          className="absolute top-0 left-0 w-full pointer-events-none overflow-visible"
          style={{ height: '12px', zIndex: 30 }}
        >
          <line
            x1="0"
            y1="12"
            x2="100%"
            y2="0"
            stroke="#CBD5E1"
            strokeWidth="2.5"
          />
        </svg>

        {/* ── Bottom Slanted Edge Border (Diagonal from 0,12 to 100%,0 of bottom 12px slice) ──── */}
        <svg
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full pointer-events-none overflow-visible"
          style={{ height: '12px', zIndex: 30 }}
        >
          <line
            x1="0"
            y1="12"
            x2="100%"
            y2="0"
            stroke="#CBD5E1"
            strokeWidth="2.5"
          />
        </svg>

        {/* ── Corner 1: Top-Left Mega Mendung Batik Wave ──────────────── */}
        <MegaMendungCorner position="top-left" size={56} />

        {/* ── Corner 2: Bottom-Right Mega Mendung Batik Wave ──────────── */}
        <MegaMendungCorner position="bottom-right" size={48} />

        {/* ── Inner Content (Strictly upright, shifted away from red accents) ───── */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          
          {/* Top Row: Title & Top-Right Icon / Badge (pl-16 ensures clearance from 56px corner) */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] sm:text-[11px] font-black text-slate-700 uppercase tracking-wider font-mono truncate pl-16 sm:pl-18">
              {title}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              {badgeText && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  {badgeText}
                </span>
              )}
              {badgeDotColor && (
                <span className={`w-2.5 h-2.5 rounded-full ${badgeDotColor}`} />
              )}
              {Icon && (
                <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
              )}
            </div>
          </div>

          {/* Middle Row: Value & Unit (pl-6 ensures clearance from 5px red border) */}
          <div className="flex items-baseline gap-1.5 my-1 pl-6 sm:pl-7">
            <span className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${valueColor}`}>
              {value}
            </span>
            {unit && (
              <span className="text-xs sm:text-sm font-bold text-slate-500 font-mono uppercase">
                {unit}
              </span>
            )}
          </div>

          {/* Bottom Row: Subtitle with Icon (pl-6 aligned with value) */}
          {subtitle && (
            <div className={`flex items-center gap-1.5 text-[11px] font-semibold mt-2 pt-1.5 border-t border-slate-100/90 pl-6 sm:pl-7 ${subtitleColor}`}>
              {SubtitleIcon && <SubtitleIcon className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{subtitle}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
