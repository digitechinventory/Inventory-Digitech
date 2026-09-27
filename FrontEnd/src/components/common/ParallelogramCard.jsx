import React from 'react';

/**
 * ParallelogramCard (Kartu Jajaran Genjang)
 * Inspired by the user reference design:
 * - Parallelogram outer shell skewed at -10deg
 * - Distinctive crimson/red slanted accent bar on the left edge
 * - Inner content counter-skewed (+10deg) so text and icons remain 100% upright and crisp
 * - Clean white card background with subtle border and crisp shadow
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
  padding = 'p-3.5 sm:p-5',
  onClick,
  className = ''
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 ${padding} rounded-xl border-l-[4px] ${accentColor} [transform:skewX(-10deg)] ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {/* Counter-skew wrapper to keep all text, numbers, and icons upright */}
      <div className="[transform:skewX(10deg)] flex flex-col justify-between h-full">
        
        {/* ── Top Row: Title & Top-Right Icon / Badge ── */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono truncate">
            {title}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {badgeText && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {badgeText}
              </span>
            )}
            {badgeDotColor && (
              <span className={`w-2.5 h-2.5 rounded-full ${badgeDotColor}`} />
            )}
            {Icon && (
              <Icon className={`w-4 h-4 ${iconColor}`} />
            )}
          </div>
        </div>

        {/* ── Middle Row: Value & Unit ── */}
        <div className="flex items-baseline gap-1.5 my-1">
          <span className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${valueColor}`}>
            {value}
          </span>
          {unit && (
            <span className="text-xs sm:text-sm font-bold text-slate-500 font-mono uppercase">
              {unit}
            </span>
          )}
        </div>

        {/* ── Bottom Row: Subtitle with Icon ── */}
        {subtitle && (
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold mt-2 pt-1 border-t border-slate-100 ${subtitleColor}`}>
            {SubtitleIcon && <SubtitleIcon className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{subtitle}</span>
          </div>
        )}

      </div>
    </div>
  );
}
