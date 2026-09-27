import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, ArrowRight, ArrowLeft } from 'lucide-react';

/**
 * Hyper-Responsive SwipeButton
 * Built with Pointer Events & Pointer Capture for 100% reliable tracking on both mouse and touchscreens.
 * Supports both swift click/tap and physical drag-to-swipe with real-time visual progress.
 */
export default function SwipeButton({
  onSwipe,
  label = "Swipe untuk Daftar",
  direction = "right",
  disabled = false,
  className = ""
}) {
  const trackRef = useRef(null);
  const knobRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [trackWidth, setTrackWidth] = useState(300);

  const startXRef = useRef(0);
  const activePointerIdRef = useRef(null);
  const isRight = direction === 'right';

  // Measure track width
  const updateTrackWidth = useCallback(() => {
    if (trackRef.current) {
      setTrackWidth(trackRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    updateTrackWidth();
    window.addEventListener('resize', updateTrackWidth);
    return () => window.removeEventListener('resize', updateTrackWidth);
  }, [updateTrackWidth]);

  const KNOB_SIZE = 34; // 34px compact knob
  const PADDING = 3;    // 3px padding
  const maxDrag = Math.max(0, trackWidth - KNOB_SIZE - (PADDING * 2));

  // Pointer Down handler
  const handlePointerDown = (e) => {
    if (disabled) return;
    // Capture pointer so movement is tracked even outside the button bounds
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    activePointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  // Pointer Move handler
  const handlePointerMove = (e) => {
    if (!isDragging || disabled || activePointerIdRef.current !== e.pointerId) return;
    const delta = e.clientX - startXRef.current;

    if (isRight) {
      const clamped = Math.max(0, Math.min(maxDrag, delta));
      setDragX(clamped);
    } else {
      const clamped = Math.min(0, Math.max(-maxDrag, delta));
      setDragX(clamped);
    }
  };

  // Trigger successful swipe
  const completeSwipe = useCallback(() => {
    setDragX(isRight ? maxDrag : -maxDrag);
    setIsDragging(false);
    setTimeout(() => {
      onSwipe?.();
      setDragX(0);
    }, 120);
  }, [isRight, maxDrag, onSwipe]);

  // Pointer Up handler
  const handlePointerUp = (e) => {
    if (!isDragging || activePointerIdRef.current !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    activePointerIdRef.current = null;
    const movedDistance = Math.abs(dragX);

    // If it was just a tap/click (moved less than 6px) -> instant smooth auto-swipe
    if (movedDistance < 6) {
      completeSwipe();
      return;
    }

    // If dragged more than 25% of track or > 35px -> complete swipe
    const threshold = Math.min(38, maxDrag * 0.25);
    if (movedDistance >= threshold) {
      completeSwipe();
    } else {
      // Spring back smoothly
      setIsDragging(false);
      setDragX(0);
    }
  };

  const handlePointerCancel = () => {
    activePointerIdRef.current = null;
    setIsDragging(false);
    setDragX(0);
  };

  // Progress ratio from 0 to 1
  const progress = maxDrag > 0 ? Math.abs(dragX) / maxDrag : 0;

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{ touchAction: 'none' }}
      className={`relative w-full h-10 shrink-0 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/90 hover:border-slate-300 rounded-full p-0.5 flex items-center select-none cursor-pointer overflow-hidden transition-colors shadow-inner group active:scale-[0.99] ${className}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          completeSwipe();
        }
      }}
    >
      {/* Dynamic Colored Fill Bar that follows the knob */}
      <div
        style={{
          width: `${Math.max(KNOB_SIZE, Math.abs(dragX) + KNOB_SIZE)}px`,
          [isRight ? 'left' : 'right']: '3px',
          transition: isDragging ? 'none' : 'width 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)'
        }}
        className="absolute top-0.5 bottom-0.5 bg-gradient-to-r from-red-600/15 via-red-500/25 to-red-600/20 rounded-full pointer-events-none"
      />

      {/* Track Instruction Label with Pulsing Chevrons */}
      <div
        style={{
          opacity: 1 - progress * 0.75,
          transition: isDragging ? 'none' : 'opacity 0.2s ease-out'
        }}
        className="w-full flex items-center justify-center gap-1.5 px-9 text-[10px] sm:text-[10.5px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors pointer-events-none"
      >
        {!isRight && (
          <div className="flex items-center text-red-600 animate-pulse">
            <ChevronLeft className="w-3.5 h-3.5 -mr-1.5" />
            <ChevronLeft className="w-3.5 h-3.5" />
          </div>
        )}
        <span className="tracking-wider uppercase font-extrabold">{label}</span>
        {isRight && (
          <div className="flex items-center text-red-600 animate-pulse">
            <ChevronRight className="w-3.5 h-3.5 -mr-1.5" />
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Sliding Knob */}
      <div
        ref={knobRef}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)',
          touchAction: 'none'
        }}
        className={`absolute ${isRight ? 'left-[3px]' : 'right-[3px]'} top-[3px] w-[34px] h-[34px] rounded-full bg-gradient-to-r from-red-600 via-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white flex items-center justify-center shadow-md shadow-red-600/35 transition-all z-10 pointer-events-none group-hover:scale-105 active:scale-95`}
      >
        {isRight ? (
          <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
        ) : (
          <ArrowLeft className="w-3.5 h-3.5 text-white group-hover:-translate-x-0.5 transition-transform" />
        )}
      </div>
    </div>
  );
}
