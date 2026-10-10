import React, { useState, useEffect } from 'react';

/**
 * StartupSplashScreen
 * 
 * High-Fidelity Preload Animation reproducing logo_animation.mp4 in pure code.
 * - Background: Pure Clean White (#FFFFFF)
 * - Mandatory playback: No skip button, no tap-to-skip, 100% silent (tanpa suara, tanpa video .mp4)
 * - Timeline:
 *   - Stage 1 (0.0s - 2.2s): Sequential vector outline stroke drawing (D -> I -> M -> S)
 *   - Stage 2 (2.0s - 4.4s): Concentric sonar shockwaves radiating from 'D' inner node
 *   - Stage 3 (3.2s - 4.8s): Solid glossy red fill wipe (left to right) across DIMS
 *   - Stage 4 (4.6s - 5.8s): Specular metallic sheen sweep beam across DIMS
 *   - Stage 5 (5.8s - 7.0s): DIGITECH smooth left-to-right wipe reveal
 *   - Stage 6 (7.2s - 8.2s): Two inward colliding laser beams revealing INVENTORY MANAGEMENT SYSTEM
 *   - Stage 7 (8.1s - 9.4s): Laser collision & Giant X-Cross Anamorphic Optical Flare eruption
 *   - Stage 8 (9.4s - 10.4s): Pristine completed logo lockup hold
 *   - Stage 9 (10.4s - 11.0s): Smooth dissolve fade-out into app
 */
export default function StartupSplashScreen({ onFinish }) {
  const [phase, setPhase] = useState(1);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const completedRef = React.useRef(false);
  const onFinishRef = React.useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const handleComplete = React.useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      if (onFinishRef.current) onFinishRef.current();
    }, 400); // 400ms clean dissolve
  }, []);

  useEffect(() => {
    // 1. Eagerly preload all graphical layers immediately into memory
    const assets = [
      '/dims_splash/layer_dims.png',
      '/dims_splash/layer_digitech.png',
      '/dims_splash/layer_inventory.png'
    ];
    assets.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    // 2. High-speed cinematic timeline (~3.2s total, crisp, smooth, and responsive)
    // Stage 1 (0ms): Vector outline stroke drawing begins (D -> I -> M -> S)
    // Stage 2 (450ms): Concentric sonar shockwaves radiate from 'D' inner node
    const t1 = setTimeout(() => setPhase(2), 450);

    // Stage 3 (850ms): Solid glossy red fill wipe (left to right) across DIMS
    const t2 = setTimeout(() => setPhase(3), 850);

    // Stage 4 (1250ms): Specular metallic sheen sweep beam across DIMS
    const t3 = setTimeout(() => setPhase(4), 1250);

    // Stage 5 (1650ms): DIGITECH smooth left-to-right wipe reveal
    const t4 = setTimeout(() => setPhase(5), 1650);

    // Stage 6 (2050ms): Two colliding laser beams revealing INVENTORY MANAGEMENT SYSTEM
    const t5 = setTimeout(() => setPhase(6), 2050);

    // Stage 7 (2450ms): Lasers collide in center -> Giant X-Cross Anamorphic Optical Flare eruption
    const t6 = setTimeout(() => setPhase(7), 2450);

    // Stage 8 (2850ms): Flares resolve into pristine completed logo lockup hold
    const t7 = setTimeout(() => setPhase(8), 2850);

    // Stage 9 (3200ms): Animation completes, smooth dissolve fade-out into app
    const t8 = setTimeout(() => handleComplete(), 3200);

    // Safety watchdog: ensure preload NEVER hangs if tab is throttled
    const tSafety = setTimeout(() => handleComplete(), 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
      clearTimeout(t8);
      clearTimeout(tSafety);
    };
  }, [handleComplete]);

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center select-none cursor-default overflow-hidden transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#ffffff',
        zIndex: 99999
      }}
    >
      {/* Self-contained Keyframe Animations */}
      <style>{`
        /* --- STAGE 1: SVG Path Stroke Drawing (Sequential D -> I -> M -> S) --- */
        @keyframes strokeDrawD {
          0% {
            stroke-dashoffset: 5350;
            opacity: 0.15;
          }
          10% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes strokeDrawI {
          0% {
            stroke-dashoffset: 500;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes strokeDrawM {
          0% {
            stroke-dashoffset: 1150;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes strokeDrawS {
          0% {
            stroke-dashoffset: 2250;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        /* --- STAGE 2: Concentric Sonar Shockwaves from Inner 'D' --- */
        @keyframes sonarWave {
          0% {
            transform: translate(-50%, -50%) scale(0.1);
            opacity: 0.95;
            border-width: 3px;
          }
          40% {
            opacity: 0.7;
            border-width: 2.5px;
          }
          100% {
            transform: translate(-50%, -50%) scale(3.8);
            opacity: 0;
            border-width: 1px;
          }
        }

        /* --- STAGE 3: Solid Glossy Red Fill Wipe (Left to Right) --- */
        @keyframes fillWipeLeftToRight {
          0% {
            -webkit-clip-path: inset(0 100% 0 0);
            clip-path: inset(0 100% 0 0);
            opacity: 0.8;
          }
          100% {
            -webkit-clip-path: inset(0 0% 0 0);
            clip-path: inset(0 0% 0 0);
            opacity: 1;
          }
        }

        /* --- STAGE 4: Metallic Sheen Sweep Beam --- */
        @keyframes sheenSweep {
          0% {
            transform: translateX(-160%) skewX(-26deg);
            opacity: 0;
          }
          20% {
            opacity: 0.95;
          }
          80% {
            opacity: 0.95;
          }
          100% {
            transform: translateX(260%) skewX(-26deg);
            opacity: 0;
          }
        }

        /* --- STAGE 5: DIGITECH Left-to-Right Wipe --- */
        @keyframes digitechWipe {
          0% {
            -webkit-clip-path: inset(0 100% 0 0);
            clip-path: inset(0 100% 0 0);
            opacity: 0.9;
          }
          100% {
            -webkit-clip-path: inset(0 0% 0 0);
            clip-path: inset(0 0% 0 0);
            opacity: 1;
          }
        }

        /* --- STAGE 6: Dual Inward Colliding Lasers --- */
        @keyframes laserLeftInward {
          0% {
            left: -20%;
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            left: 50%;
            opacity: 1;
          }
        }

        @keyframes laserRightInward {
          0% {
            left: 120%;
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            left: 50%;
            opacity: 1;
          }
        }

        @keyframes inventoryRevealLeft {
          0% {
            -webkit-clip-path: inset(0 100% 0 0);
            clip-path: inset(0 100% 0 0);
          }
          100% {
            -webkit-clip-path: inset(0 50% 0 0);
            clip-path: inset(0 50% 0 0);
          }
        }

        @keyframes inventoryRevealRight {
          0% {
            -webkit-clip-path: inset(0 0 0 100%);
            clip-path: inset(0 0 0 100%);
          }
          100% {
            -webkit-clip-path: inset(0 0 0 50%);
            clip-path: inset(0 0 0 50%);
          }
        }

        /* --- STAGE 7: Collision & Giant X-Cross Anamorphic Optical Flare --- */
        @keyframes flareCoreEruption {
          0% {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 0;
          }
          20% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 1;
          }
          65% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.95;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 0;
          }
        }

        @keyframes horizontalFlareBeam {
          0% {
            transform: translate(-50%, -50%) scaleX(0.05);
            opacity: 0;
          }
          25% {
            transform: translate(-50%, -50%) scaleX(1);
            opacity: 1;
          }
          75% {
            transform: translate(-50%, -50%) scaleX(1.25);
            opacity: 0.85;
          }
          100% {
            transform: translate(-50%, -50%) scaleX(1.5);
            opacity: 0;
          }
        }

        @keyframes xFlareRays {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.25);
          }
          22% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.05);
          }
          60% {
            opacity: 0.95;
            transform: translate(-50%, -50%) scale(1.18);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.45);
          }
        }

        @keyframes ambientAuraBreath {
          0% {
            opacity: 0;
            transform: scale(0.96);
          }
          35% {
            opacity: 0.75;
            transform: scale(1.02);
          }
          70% {
            opacity: 0.6;
            transform: scale(1.01);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
      `}</style>

      {/* Pure White Background */}
      <div className="absolute inset-0 bg-white pointer-events-none" />

      {/* Central Animation Stage (Responsive: Compact & proportional on mobile, expansive on desktop) */}
      <div className="relative z-10 flex flex-col items-center justify-center w-[62vw] max-w-[260px] sm:w-full sm:max-w-[380px] md:max-w-[480px] px-3 sm:px-6">
        <div className="relative w-full aspect-[645/390]">

          {/* ======================================================== */}
          {/* STAGE 1: SVG OUTLINE VECTOR DRAWING (Sequential Stroke)  */}
          {/* ======================================================== */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 pointer-events-none z-10 ${
              phase >= 3 ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <svg
              viewBox="0 0 645 390"
              className="w-full h-full object-contain"
            >
              <g
                fill="none"
                stroke="#DC2626"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Letter 'D' - Draws first (0.0s - 0.8s) from inner circular node outward */}
                <path
                  d="M 0 0 L 0 215 L 110 215 L 111 214 L 121 214 L 146 208 L 166 200 L 182 189 L 196 176 L 207 160 L 216 140 L 220 121 L 220 101 L 187 101 L 185 96 L 185 90 L 182 77 L 174 62 L 157 44 L 142 35 L 125 29 L 105 26 L 33 26 L 31 27 L 31 100 L 33 101 L 76 100 L 80 90 L 84 86 L 94 80 L 94 79 L 91 79 L 81 85 L 75 93 L 73 98 L 35 98 L 33 96 L 33 30 L 35 28 L 36 29 L 92 28 L 93 29 L 118 30 L 138 36 L 146 40 L 160 50 L 167 57 L 177 72 L 181 82 L 183 91 L 183 102 L 185 104 L 186 103 L 188 104 L 217 104 L 218 105 L 217 124 L 213 141 L 209 151 L 203 162 L 193 175 L 175 191 L 153 203 L 134 209 L 104 213 L 3 213 L 2 212 L 2 1 L 3 0 L 117 0 L 124 2 L 130 2 L 150 8 L 167 16 L 176 22 L 197 42 L 209 62 L 216 84 L 215 89 L 197 89 L 195 86 L 194 77 L 190 67 L 180 51 L 166 37 L 159 33 L 158 31 L 142 23 L 139 23 L 130 19 L 106 15 L 20 15 L 19 16 L 19 197 L 106 197 L 126 194 L 145 188 L 160 180 L 178 164 L 192 140 L 196 125 L 196 118 L 194 117 L 161 118 L 159 116 L 160 96 L 156 82 L 148 69 L 133 56 L 116 49 L 105 47 L 53 47 L 51 48 L 51 84 L 62 85 L 68 77 L 75 71 L 84 66 L 96 63 L 104 63 L 117 66 L 135 77 L 130 70 L 116 63 L 108 61 L 91 61 L 73 69 L 65 76 L 61 82 L 57 83 L 54 82 L 53 80 L 54 55 L 53 54 L 55 50 L 109 50 L 118 52 L 128 56 L 137 62 L 150 76 L 157 94 L 156 120 L 192 120 L 193 126 L 191 129 L 179 130 L 176 137 L 168 147 L 148 161 L 137 165 L 118 168 L 55 168 L 53 166 L 53 155 L 54 154 L 53 141 L 55 128 L 61 128 L 73 140 L 82 145 L 91 148 L 111 148 L 123 144 L 134 136 L 139 130 L 144 120 L 146 113 L 146 97 L 144 91 L 142 90 L 141 91 L 143 95 L 144 109 L 141 120 L 133 133 L 119 143 L 108 146 L 89 145 L 73 137 L 62 125 L 51 126 L 51 170 L 125 170 L 147 164 L 160 157 L 170 148 L 171 150 L 160 163 L 145 173 L 136 177 L 113 183 L 34 183 L 33 182 L 33 116 L 34 115 L 33 113 L 34 112 L 73 112 L 77 120 L 86 128 L 99 132 L 103 132 L 104 130 L 92 128 L 86 125 L 80 120 L 74 109 L 73 110 L 72 109 L 33 109 L 31 110 L 31 186 L 105 186 L 132 181 L 152 172 L 164 163 L 178 145 L 180 138 L 184 132 L 189 132 L 190 135 L 183 152 L 174 164 L 161 176 L 141 187 L 120 193 L 105 195 L 22 195 L 21 194 L 21 19 L 23 17 L 25 18 L 101 17 L 118 19 L 138 24 L 151 30 L 163 38 L 179 54 L 189 71 L 193 83 L 193 89 L 195 92 L 218 92 L 219 86 L 216 73 L 210 58 L 196 37 L 182 23 L 163 11 L 149 5 L 132 0 Z"
                  style={{
                    strokeDasharray: 5350,
                    strokeDashoffset: 5350,
                    animation: 'strokeDrawD 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards'
                  }}
                />

                {/* Letter 'I' - Draws starting at ~0.18s */}
                <path
                  d="M 230 5 L 229 7 L 230 9 L 229 11 L 230 18 L 230 89 L 229 90 L 230 186 L 229 187 L 229 199 L 230 205 L 231 206 L 239 205 L 242 206 L 280 206 L 282 205 L 282 5 Z"
                  style={{
                    strokeDasharray: 500,
                    strokeDashoffset: 500,
                    animation: 'strokeDrawI 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) 0.18s forwards'
                  }}
                />
                <path
                  d="M 233 8 L 278 8 L 279 9 L 279 202 L 278 203 L 233 203 L 232 202 L 232 9 Z"
                  style={{
                    strokeDasharray: 500,
                    strokeDashoffset: 500,
                    animation: 'strokeDrawI 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) 0.18s forwards'
                  }}
                />

                {/* Letter 'M' - Draws starting at ~0.32s */}
                <path
                  d="M 297 5 L 296 6 L 296 205 L 297 206 L 299 205 L 300 206 L 346 206 L 346 110 L 348 106 L 381 156 L 404 156 L 428 118 L 437 106 L 438 107 L 438 205 L 439 206 L 487 206 L 488 205 L 488 5 L 444 5 L 427 31 L 425 36 L 405 65 L 405 67 L 392 85 L 340 5 Z"
                  style={{
                    strokeDasharray: 1150,
                    strokeDashoffset: 1150,
                    animation: 'strokeDrawM 0.55s cubic-bezier(0.25, 0.1, 0.25, 1) 0.32s forwards'
                  }}
                />
                <path
                  d="M 300 8 L 339 8 L 377 66 L 377 68 L 392 89 L 397 84 L 430 31 L 436 24 L 436 22 L 446 8 L 485 8 L 486 9 L 485 15 L 486 17 L 485 20 L 485 41 L 486 42 L 485 44 L 486 49 L 485 202 L 484 203 L 441 203 L 440 202 L 440 100 L 437 100 L 402 154 L 383 154 L 372 139 L 347 99 L 344 100 L 344 202 L 343 203 L 300 203 L 299 202 L 299 9 Z"
                  style={{
                    strokeDasharray: 1150,
                    strokeDashoffset: 1150,
                    animation: 'strokeDrawM 0.55s cubic-bezier(0.25, 0.1, 0.25, 1) 0.32s forwards'
                  }}
                />

                {/* Letter 'S' - Draws starting at ~0.44s */}
                <path
                  d="M 590 34 L 556 34 L 541 41 L 535 47 L 531 55 L 530 61 L 531 76 L 535 85 L 542 92 L 550 96 L 558 98 L 589 98 L 601 101 L 611 106 L 621 116 L 627 128 L 628 150 L 623 165 L 609 179 L 591 186 L 584 187 L 530 187 L 529 186 L 528 187 L 522 186 L 499 187 L 499 205 L 500 206 L 588 206 L 601 204 L 604 202 L 613 200 L 626 192 L 638 180 L 642 174 L 644 169 L 644 161 L 643 166 L 636 178 L 623 191 L 609 199 L 594 203 L 503 203 L 502 202 L 502 190 L 503 189 L 593 188 L 609 182 L 616 177 L 624 168 L 628 160 L 628 156 L 630 152 L 630 131 L 628 124 L 621 112 L 614 105 L 599 98 L 589 96 L 561 96 L 549 93 L 540 87 L 534 78 L 532 69 L 533 58 L 536 50 L 543 42 L 551 38 L 559 36 L 590 36 L 591 35 Z"
                  style={{
                    strokeDasharray: 2250,
                    strokeDashoffset: 2250,
                    animation: 'strokeDrawS 0.55s cubic-bezier(0.25, 0.1, 0.25, 1) 0.44s forwards'
                  }}
                />
                <path
                  d="M 643 5 L 555 5 L 538 9 L 529 13 L 515 23 L 510 29 L 503 41 L 499 59 L 500 80 L 503 90 L 509 102 L 521 114 L 541 124 L 558 127 L 587 127 L 590 128 L 596 134 L 597 147 L 595 151 L 587 157 L 501 157 L 499 159 L 499 175 L 501 177 L 585 177 L 592 176 L 606 169 L 614 160 L 618 150 L 618 133 L 614 123 L 600 111 L 590 108 L 553 107 L 535 99 L 528 92 L 522 81 L 520 72 L 520 58 L 522 51 L 528 40 L 538 31 L 550 26 L 560 24 L 622 24 L 623 32 L 625 33 L 626 23 L 625 22 L 559 22 L 545 25 L 534 31 L 529 35 L 523 43 L 518 58 L 518 74 L 521 85 L 527 95 L 532 100 L 543 106 L 557 110 L 588 110 L 596 112 L 606 118 L 612 125 L 615 131 L 616 136 L 615 152 L 608 164 L 602 169 L 589 174 L 583 175 L 521 175 L 520 174 L 503 175 L 502 174 L 502 161 L 503 160 L 586 160 L 596 154 L 598 151 L 600 142 L 599 135 L 593 127 L 580 124 L 571 125 L 565 124 L 564 125 L 543 122 L 527 115 L 519 109 L 511 100 L 504 87 L 502 78 L 502 54 L 506 41 L 514 28 L 527 17 L 537 12 L 551 8 L 640 8 L 641 9 L 641 49 L 639 51 L 558 51 L 553 54 L 549 59 L 549 72 L 555 79 L 560 81 L 597 82 L 611 86 L 619 90 L 635 104 L 643 118 L 644 123 L 644 114 L 641 108 L 628 93 L 619 87 L 610 83 L 593 79 L 562 79 L 555 76 L 551 69 L 552 59 L 557 54 L 560 53 L 642 53 L 643 52 Z"
                  style={{
                    strokeDasharray: 2250,
                    strokeDashoffset: 2250,
                    animation: 'strokeDrawS 0.55s cubic-bezier(0.25, 0.1, 0.25, 1) 0.44s forwards'
                  }}
                />
              </g>
            </svg>
          </div>

          {/* ======================================================== */}
          {/* STAGE 2: CONCENTRIC SONAR SHOCKWAVES EMITTING FROM 'D'   */}
          {/* ======================================================== */}
          {phase >= 2 && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: '16.7%', // Exact coordinate of inner circular node of 'D'
                top: '28.2%',
                width: 0,
                height: 0
              }}
            >
              {[0, 0.1, 0.2, 0.3, 0.4].map((delay, idx) => (
                <div
                  key={idx}
                  className="absolute w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-red-500 shadow-[0_0_14px_rgba(239,68,68,0.55)]"
                  style={{
                    animation: `sonarWave 0.75s cubic-bezier(0.12, 0.8, 0.32, 1) ${delay}s both`
                  }}
                />
              ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* STAGE 3 & 4: SOLID GLOSSY RED FILL + SPECULAR SHEEN      */}
          {/* ======================================================== */}
          {phase >= 3 && (
            <div
              className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
              style={{
                animation: 'fillWipeLeftToRight 0.55s cubic-bezier(0.25, 0.85, 0.35, 1) forwards'
              }}
            >
              <img
                src="/dims_splash/layer_dims.png"
                alt="DIMS"
                className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(220,38,38,0.22)]"
              />

              {/* Specular White Light Sheen Sweep (Stage 4) */}
              {phase >= 4 && (
                <div
                  className="absolute inset-0 w-20 sm:w-28 md:w-36 h-[160%] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none z-30"
                  style={{
                    animation: 'sheenSweep 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                  }}
                />
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* STAGE 5: DIGITECH SUBTITLE (Left-to-Right Wipe)          */}
          {/* ======================================================== */}
          {phase >= 5 && (
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                animation: 'digitechWipe 0.5s cubic-bezier(0.2, 0.85, 0.3, 1) forwards'
              }}
            >
              <img
                src="/dims_splash/layer_digitech.png"
                alt="DIGITECH"
                className="w-full h-full object-contain filter drop-shadow-[0_1px_4px_rgba(220,38,38,0.18)]"
              />
            </div>
          )}

          {/* ======================================================== */}
          {/* STAGE 6: DUAL INWARD COLLIDING LASER BEAMS               */}
          {/* ======================================================== */}
          {phase >= 6 && (
            <div className="absolute inset-0 pointer-events-none z-20">
              
              {/* Text Revealed from Outside in (Stage 6) or Held Fully (Stage 7+) */}
              {phase === 6 ? (
                <>
                  {/* Left Half: INVENTORY MAN- revealed by left laser */}
                  <div
                    className="absolute inset-0"
                    style={{
                      animation: 'inventoryRevealLeft 0.45s cubic-bezier(0.2, 0.7, 0.25, 1) forwards'
                    }}
                  >
                    <img
                      src="/dims_splash/layer_inventory.png"
                      alt="INVENTORY MANAGEMENT SYSTEM"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Right Half: -AGEMENT SYSTEM revealed by right laser */}
                  <div
                    className="absolute inset-0"
                    style={{
                      animation: 'inventoryRevealRight 0.45s cubic-bezier(0.2, 0.7, 0.25, 1) forwards'
                    }}
                  >
                    <img
                      src="/dims_splash/layer_inventory.png"
                      alt="INVENTORY MANAGEMENT SYSTEM"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Left Traveling Laser Spark Point */}
                  <div
                    className="absolute top-[95.3%] -translate-y-1/2 -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 pointer-events-none z-30"
                    style={{
                      animation: 'laserLeftInward 0.45s cubic-bezier(0.2, 0.7, 0.25, 1) forwards'
                    }}
                  >
                    {/* Laser Spark Core */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white rounded-full shadow-[0_0_12px_#ff0033,0_0_24px_#ff2244]" />
                    {/* Laser Horizontal Trail */}
                    <div className="absolute top-1/2 right-1/2 w-12 sm:w-16 md:w-24 h-[1.5px] sm:h-[2px] -translate-y-1/2 bg-gradient-to-l from-white via-[#ff0033] to-transparent shadow-[0_0_8px_#ff0033]" />
                  </div>

                  {/* Right Traveling Laser Spark Point */}
                  <div
                    className="absolute top-[95.3%] -translate-y-1/2 -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 pointer-events-none z-30"
                    style={{
                      animation: 'laserRightInward 0.45s cubic-bezier(0.2, 0.7, 0.25, 1) forwards'
                    }}
                  >
                    {/* Laser Spark Core */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white rounded-full shadow-[0_0_12px_#ff0033,0_0_24px_#ff2244]" />
                    {/* Laser Horizontal Trail */}
                    <div className="absolute top-1/2 left-1/2 w-12 sm:w-16 md:w-24 h-[1.5px] sm:h-[2px] -translate-y-1/2 bg-gradient-to-r from-white via-[#ff0033] to-transparent shadow-[0_0_8px_#ff0033]" />
                  </div>
                </>
              ) : (
                /* Stage 7+: Fully Revealed Pristine Text */
                <img
                  src="/dims_splash/layer_inventory.png"
                  alt="INVENTORY MANAGEMENT SYSTEM"
                  className="w-full h-full object-contain"
                />
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* STAGE 7: COLLISION & GIANT X-CROSS ANAMORPHIC FLARE      */}
          {/* ======================================================== */}
          {phase === 7 && (
            <div
              className="absolute left-1/2 top-[80%] pointer-events-none z-30"
              style={{ width: 0, height: 0 }}
            >
              {/* Soft Crimson Ambient Halo Breathing Behind DIMS */}
              <div
                className="absolute left-1/2 top-[-50px] sm:top-[-70px] md:top-[-80px] -translate-x-1/2 -translate-y-1/2 w-56 sm:w-72 md:w-96 h-32 sm:h-40 md:h-48 bg-red-500/25 blur-3xl rounded-full pointer-events-none"
                style={{ animation: 'ambientAuraBreath 0.55s ease-out forwards' }}
              />

              {/* Horizontal Core Laser Flare Line */}
              <div
                className="absolute top-0 left-0 w-[120vw] max-w-[850px] h-[3px] bg-gradient-to-r from-transparent via-white via-40% via-[#ff1e38] to-transparent shadow-[0_0_20px_#ff002b]"
                style={{ animation: 'horizontalFlareBeam 0.55s cubic-bezier(0.15, 0.8, 0.25, 1) forwards' }}
              />

              {/* Optical Starburst Flare Core */}
              <div
                className="absolute top-0 left-0 w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center pointer-events-none"
                style={{ animation: 'flareCoreEruption 0.55s ease-out forwards' }}
              >
                <div className="w-3 sm:w-4 h-3 sm:h-4 bg-white rounded-full shadow-[0_0_25px_#ff0033,0_0_50px_#ff1144]" />
              </div>

              {/* Four Giant Anamorphic Diagonal Laser Rays (The 'X' Cross Flare) */}
              <div
                className="absolute top-0 left-0 pointer-events-none flex items-center justify-center"
                style={{ animation: 'xFlareRays 0.55s cubic-bezier(0.15, 0.8, 0.25, 1) forwards' }}
              >
                {/* Ray 1: Diagonal Top-Right to Bottom-Left (+32 deg) */}
                <div className="absolute w-[140vw] max-w-[950px] h-[2.5px] bg-gradient-to-r from-transparent via-[#ff2244] via-48% via-white via-52% via-[#ff2244] to-transparent rotate-[32deg] shadow-[0_0_14px_#ff002b,0_0_28px_rgba(255,0,50,0.6)]" />

                {/* Ray 2: Diagonal Top-Left to Bottom-Right (-32 deg) */}
                <div className="absolute w-[140vw] max-w-[950px] h-[2.5px] bg-gradient-to-r from-transparent via-[#ff2244] via-48% via-white via-52% via-[#ff2244] to-transparent -rotate-[32deg] shadow-[0_0_14px_#ff002b,0_0_28px_rgba(255,0,50,0.6)]" />

                {/* Secondary Softer Lens Glow Streaks (+36 deg & -36 deg) */}
                <div className="absolute w-[120vw] max-w-[850px] h-[1.5px] bg-red-400 rotate-[36deg] opacity-75 shadow-[0_0_10px_#ff1133]" />
                <div className="absolute w-[120vw] max-w-[850px] h-[1.5px] bg-red-400 -rotate-[36deg] opacity-75 shadow-[0_0_10px_#ff1133]" />
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* STAGE 8: PRISTINE COMPLETED LOGO HOLD                    */}
          {/* ======================================================== */}
          {/* When phase >= 8, all layers (DIMS, DIGITECH, INVENTORY) hold */}
          {/* cleanly and sharply with zero distortion before dissolving */}

        </div>
      </div>

    </div>
  );
}
