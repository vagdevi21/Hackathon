/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Custom Biometric Cyber-Fingerprint Vector Emblem
 * Features:
 * - High-tech biometric fingerprint ridges with algorithmic flow
 * - Futuristic cyber-circuit traces and data nodes emerging from the fingerprint whorl
 * - Glowing laser scanner sweep beam with neon cyan, electric blue, and violet gradients
 * - Precision biometric reticle brackets at the four corners
 * - Subtle, refined CSS light-sweep & pulse animation on load and security state triggers
 */

import React, { useState, useEffect } from 'react';

interface CyberLogoIconProps {
  className?: string;
  size?: number;
  animated?: boolean;
  isPulsing?: boolean;
}

export const CyberLogoIcon: React.FC<CyberLogoIconProps> = ({ 
  className = '', 
  size = 40,
  animated = true,
  isPulsing = false
}) => {
  // Initial load sweep trigger
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none group ${className}`}
      style={{ width: size, height: size }}
      title="DarkWatch AI — Biometric Cyber Sentinel Emblem"
    >
      {/* 1. Subtle, refined ambient CSS pulse glow aura on initial load or security state trigger */}
      <div 
        className={`absolute -inset-1 rounded-[22%] bg-gradient-to-tr from-cyan-500/30 via-indigo-500/20 to-purple-500/30 blur-[6px] pointer-events-none transition-all duration-700 ${
          isPulsing ? 'opacity-100 scale-110 animate-emblem-pulse' : 'opacity-60 animate-emblem-pulse'
        }`} 
      />

      {/* 2. Refined light-sweep diagonal beam across the emblem */}
      <div className="absolute inset-0 rounded-[22%] overflow-hidden pointer-events-none z-10">
        <div 
          className={`absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent skew-x-[-20deg] ${
            animated || hasLoaded ? 'animate-emblem-sweep' : ''
          }`} 
        />
      </div>

      {/* 3. SVG Fingerprint Graphic with Reticle & Laser */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.55)] relative z-0 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Neon Fingerprint Gradient */}
          <linearGradient id="fp-cyan-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f5ff" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>

          {/* Circuit Trace Gradient */}
          <linearGradient id="fp-circuit-gradient" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="60%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>

          {/* Deep Radial Glow */}
          <radialGradient id="fp-radial-core" cx="50" cy="50" r="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#4f46e5" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#030718" stopOpacity="0.8" />
          </radialGradient>

          {/* Scanner Glow Filter */}
          <filter id="fp-laser-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Dark Scanner Canvas */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="22"
          fill="url(#fp-radial-core)"
          stroke="#0e244d"
          strokeWidth="1.5"
        />

        {/* Precision Biometric HUD Reticle Brackets (4 Corners) */}
        <path d="M 14 26 L 14 14 L 26 14" stroke="#00f5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 74 14 L 86 14 L 86 26" stroke="#00f5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 14 74 L 14 86 L 26 86" stroke="#00f5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 74 86 L 86 86 L 86 74" stroke="#00f5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Subtle Cyber Grid & Targeting Crosshair Marks */}
        <line x1="50" y1="10" x2="50" y2="16" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
        <line x1="50" y1="84" x2="50" y2="90" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
        <line x1="10" y1="50" x2="16" y2="50" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
        <line x1="84" y1="50" x2="90" y2="50" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />

        {/* Concentric Biometric Fingerprint Ridges with Cybernetic Flow */}
        <g stroke="url(#fp-cyan-gradient)" strokeLinecap="round" fill="none">
          <path d="M 48 56 C 48 48, 52 48, 52 56 L 52 64" strokeWidth="2.8" />
          <path d="M 43 58 C 43 43, 57 43, 57 58 L 57 66" strokeWidth="2.8" />
          <path d="M 38 60 C 38 38, 62 38, 62 58 L 62 70" strokeWidth="2.6" />
          <path d="M 33 62 C 33 32, 67 32, 67 58 C 67 68, 65 72, 65 76" strokeWidth="2.4" />
          <path d="M 28 64 C 28 26, 72 26, 72 58 C 72 68, 70 76, 70 80" strokeWidth="2.2" />
          <path d="M 24 64 C 24 22, 77 22, 77 56" strokeWidth="2.0" strokeDasharray="40 4 12" />
        </g>

        {/* Cybernetic Circuit Branches & Micro-Nodes */}
        <g stroke="url(#fp-circuit-gradient)" strokeWidth="1.8" fill="none" strokeLinecap="round">
          <path d="M 68 30 L 78 24 L 84 24" />
          <circle cx="84" cy="24" r="2.2" fill="#22c55e" stroke="none" />

          <path d="M 32 30 L 22 24 L 16 24" />
          <circle cx="16" cy="24" r="2.2" fill="#00f5ff" stroke="none" />

          <path d="M 32 72 L 24 78 L 18 78" />
          <circle cx="18" cy="78" r="2.2" fill="#a855f7" stroke="none" />

          <path d="M 66 74 L 74 80 L 80 80" />
          <circle cx="80" cy="80" r="2.2" fill="#38bdf8" stroke="none" />
        </g>

        {/* Central Biometric Verification Pulse Dot */}
        <circle cx="50" cy="52" r="3" fill="#00f5ff" filter="url(#fp-laser-glow)" />

        {/* Animated Laser Scanning Beam */}
        {animated && (
          <g filter="url(#fp-laser-glow)">
            <line
              x1="18"
              y1="50"
              x2="82"
              y2="50"
              stroke="#00f5ff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeOpacity="0.9"
            >
              <animate
                attributeName="y1"
                values="22; 78; 22"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y2"
                values="22; 78; 22"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-opacity"
                values="0.3; 1; 0.3"
                dur="3s"
                repeatCount="indefinite"
              />
            </line>
          </g>
        )}
      </svg>
    </div>
  );
};
