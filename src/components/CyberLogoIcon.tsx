/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Custom Biometric Shield & Fingerprint Emblem
 * Features:
 * - Creatively blends a protective cyber-shield contour with high-tech biometric fingerprint ridges
 * - Algorithmic fingerprint whorl transitioning into cybernetic circuit nodes
 * - Electric Cyan, Neon Turquoise, Royal Violet, and Deep Indigo gradients
 * - Subtle, refined CSS pulse and light-sweep animation that triggers on initial app load
 * - Carries .app-header-brand-icon for consistent high-fidelity branding across the app
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
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Trigger entrance sweep animation on mount
    const timer = setTimeout(() => {
      setHasLoaded(true);
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`app-header-brand-icon relative inline-flex items-center justify-center flex-shrink-0 select-none group ${className}`}
      style={{ width: size, height: size }}
      title="DarkWatch AI — Biometric Shield Sentinel Emblem"
    >
      {/* 1. Ambient CSS pulse glow aura on app load and security state triggers */}
      <div 
        className={`absolute -inset-1 rounded-[24%] bg-gradient-to-tr from-cyan-500/35 via-indigo-600/25 to-purple-600/35 blur-[7px] pointer-events-none transition-all duration-700 ${
          isPulsing ? 'opacity-100 scale-110 animate-emblem-pulse' : 'opacity-65 animate-emblem-pulse'
        }`} 
      />

      {/* 2. Refined light-sweep diagonal beam across the emblem */}
      <div className="absolute inset-0 rounded-[22%] overflow-hidden pointer-events-none z-10">
        <div 
          className={`absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent skew-x-[-22deg] ${
            animated || hasLoaded ? 'animate-emblem-sweep' : ''
          }`} 
        />
      </div>

      {/* 3. High-Fidelity SVG: Shield + Fingerprint Fusion */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.6)] relative z-0 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Primary Shield Outline Gradient: Electric Cyan to Royal Violet */}
          <linearGradient id="dw-shield-gradient" x1="10" y1="8" x2="90" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f5ff" />
            <stop offset="45%" stopColor="#38bdf8" />
            <stop offset="80%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          {/* Biometric Fingerprint Ridges Gradient: Cyan to Violet */}
          <linearGradient id="dw-fp-ridges" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f5ff" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* Deep Radial Shield Core Fill */}
          <radialGradient id="dw-shield-core" cx="50" cy="45" r="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#4338ca" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#030718" stopOpacity="0.85" />
          </radialGradient>

          {/* Circuit Trace Gradient */}
          <linearGradient id="dw-circuit-traces" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          {/* Laser Glow Filter */}
          <filter id="dw-laser-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- Outer Shield Base & Subtle Grid --- */}
        {/* Outer Shield Shell */}
        <path
          d="M 50 8
             L 86 21
             C 86 52, 70 79, 50 94
             C 30 79, 14 52, 14 21
             Z"
          fill="url(#dw-shield-core)"
          stroke="url(#dw-shield-gradient)"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />

        {/* Inner Shield Inset Contour */}
        <path
          d="M 50 14
             L 80 25
             C 80 50, 67 72, 50 86
             C 33 72, 20 50, 20 25
             Z"
          stroke="#00f5ff"
          strokeWidth="0.9"
          strokeOpacity="0.3"
          strokeDasharray="4 2"
          fill="none"
        />

        {/* --- Blended Biometric Fingerprint Ridges Inside Shield --- */}
        <g stroke="url(#dw-fp-ridges)" strokeLinecap="round" fill="none">
          {/* Innermost Core Loop */}
          <path
            d="M 48 54 C 48 47, 52 47, 52 54 L 52 63"
            strokeWidth="2.5"
          />

          {/* Loop 2 */}
          <path
            d="M 43 56 C 43 42, 57 42, 57 56 L 57 66"
            strokeWidth="2.4"
          />

          {/* Loop 3 */}
          <path
            d="M 38 58 C 38 37, 62 37, 62 58 L 62 70"
            strokeWidth="2.3"
          />

          {/* Loop 4 (Shield-Harmonized Arch) */}
          <path
            d="M 33 58 C 33 32, 67 32, 67 58 C 67 67, 64 74, 58 78"
            strokeWidth="2.1"
          />

          {/* Loop 5 (Outer Ridges flowing with shield sides) */}
          <path
            d="M 28 54 C 28 27, 72 27, 72 54 C 72 65, 68 74, 50 83"
            strokeWidth="1.9"
          />

          {/* Upper Crest Ridge */}
          <path
            d="M 32 26 C 43 21, 57 21, 68 26"
            strokeWidth="1.8"
            strokeDasharray="18 4 10"
          />
        </g>

        {/* --- Cybernetic Circuit Traces Emanating from Fingerprint into Shield --- */}
        <g stroke="url(#dw-circuit-traces)" strokeWidth="1.6" fill="none" strokeLinecap="round">
          {/* Top-Right Circuit Node */}
          <path d="M 66 32 L 75 27 L 79 27" />
          <circle cx="79" cy="27" r="2" fill="#10b981" stroke="none" />

          {/* Top-Left Circuit Node */}
          <path d="M 34 32 L 25 27 L 21 27" />
          <circle cx="21" cy="27" r="2" fill="#00f5ff" stroke="none" />

          {/* Bottom Center-Right Circuit Node */}
          <path d="M 60 68 L 68 73 L 73 73" />
          <circle cx="73" cy="73" r="1.8" fill="#a855f7" stroke="none" />

          {/* Bottom Center-Left Circuit Node */}
          <path d="M 40 68 L 32 73 L 27 73" />
          <circle cx="27" cy="73" r="1.8" fill="#38bdf8" stroke="none" />
        </g>

        {/* Central Core Identity Verification Node */}
        <circle cx="50" cy="50" r="2.8" fill="#00f5ff" filter="url(#dw-laser-filter)" />

        {/* --- Scanning Laser Beam Sweeping Vertically Across Shield --- */}
        {animated && (
          <g filter="url(#dw-laser-filter)">
            <line
              x1="22"
              y1="48"
              x2="78"
              y2="48"
              stroke="#00f5ff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.85"
            >
              <animate
                attributeName="y1"
                values="24; 76; 24"
                dur="3.2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y2"
                values="24; 76; 24"
                dur="3.2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-opacity"
                values="0.3; 0.95; 0.3"
                dur="3.2s"
                repeatCount="indefinite"
              />
            </line>
          </g>
        )}
      </svg>
    </div>
  );
};
