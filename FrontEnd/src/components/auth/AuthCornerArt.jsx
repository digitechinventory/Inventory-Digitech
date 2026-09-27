import React from 'react';

/**
 * AuthCornerArt
 * Faithfully reproduces the artistic organic fluid batik / swirl motif
 * found in the top-left corner of the reference design.
 */
export default function AuthCornerArt({ className = "w-32 h-32 sm:w-40 sm:h-40" }) {
  return (
    <svg
      viewBox="0 0 160 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* ─── TOP FLOWING RIBBONS ─── */}
      {/* Top Rose / Crimson Organic Ribbon */}
      <path
        d="M 28 8 C 38 6 52 18 68 16 C 84 14 96 6 114 8 C 106 18 90 24 74 26 C 52 30 36 22 28 8 Z"
        fill="#D4546B"
      />

      {/* 3 Golden Accent Dots */}
      <circle cx="82" cy="14" r="2.2" fill="#F4C758" />
      <circle cx="90" cy="13" r="1.8" fill="#F4C758" />
      <circle cx="98" cy="10" r="1.5" fill="#F4C758" />

      {/* Top Sky-Blue Fluid Wave */}
      <path
        d="M 38 6 C 50 6 58 14 70 14 C 82 14 90 6 102 8 C 110 10 120 6 132 8 C 120 14 108 16 96 14 C 80 12 70 18 58 18 C 50 18 44 12 38 6 Z"
        fill="#7CA3BC"
      />

      {/* ─── CENTRAL SPIRALS ─── */}
      {/* Deep Ocean Blue Nautilus Spiral (Top-Left) */}
      <path
        d="M 10 20 C 22 10 40 12 46 25 C 52 38 38 52 26 49 C 14 46 11 35 17 28 C 21 21 32 21 36 29 C 38 35 32 40 26 37"
        stroke="#4D7692"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Warm Peach / Apricot Spiral (Lower-Left Center) */}
      <path
        d="M 44 38 C 56 28 72 32 74 46 C 76 60 62 72 50 68 C 40 64 38 52 44 44 C 49 37 60 39 62 47 C 63 52 58 56 54 52"
        stroke="#F5A376"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* ─── CREAM / IVORY ORGANIC DROPLETS ─── */}
      <path
        d="M 28 50 C 26 42 36 38 42 46 C 46 52 40 62 32 58 C 28 56 29 52 28 50 Z"
        fill="#F0EDE6"
      />
      <path
        d="M 20 62 C 26 56 36 60 34 68 C 32 76 22 80 18 74 C 16 68 18 65 20 62 Z"
        fill="#F0EDE6"
      />

      {/* ─── LEFT CASCADING FLUID TRAILS ─── */}
      {/* 1. Upper Crimson Tendril */}
      <path
        d="M 2 32 C 6 32 12 44 8 56 C 4 68 1 76 5 92 C 2 88 -1 72 2 56 C 3 44 2 36 2 32 Z"
        fill="#D4546B"
      />
      {/* 2. Middle Ocean Blue Tendril */}
      <path
        d="M 1 66 C 6 66 10 78 6 90 C 2 102 -1 110 4 126 C 1 118 -2 106 -1 94 C 0 82 -1 72 1 66 Z"
        fill="#4D7692"
      />
      {/* 3. Peach Tendril */}
      <path
        d="M 1 82 C 4 82 6 88 4 95 C 2 102 0 108 2 118 C 0 114 -1 107 0 102 C 1 96 0 90 1 82 Z"
        fill="#F5A376"
      />
      {/* 4. Lower Crimson Tendril */}
      <path
        d="M 2 102 C 6 102 8 112 5 122 C 2 132 0 140 4 154 C 1 146 -2 136 -1 126 C 0 116 -1 108 2 102 Z"
        fill="#D4546B"
      />
    </svg>
  );
}
