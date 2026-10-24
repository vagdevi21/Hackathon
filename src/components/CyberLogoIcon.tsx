/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Custom Vector Sentinel Emblem
 * 
 * Bespoke Logo Emblem Combining:
 * 1. Refined Abstract Shield Contour
 * 2. Abstract Geometric "D" integrated into the left shield silhouette
 * 3. Digital Eye / Radar Ring for threat detection
 * 4. Early Warning Waveform / Signal pulse
 * 5. Network Intelligence Circuit Traces & Laser Scanning Beam
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
    const timer = setTimeout(() => {
      setHasLoaded(true);
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`app-header-brand-icon relative inline-flex items-center justify-center flex-shrink-0 select-none group ${className}`}
      style={{ width: size, height: size }}
      title="DarkWatch AI — Custom Cybersecurity Sentinel Emblem"
    >
      {/* 1. Ambient Glow Ring */}
      <div 
        className={`absolute -inset-1 rounded-[24%] bg-gradient-to-tr from-cyan-500/35 via-indigo-600/25 to-purple-600/35 blur-[7px] pointer-events-none transition-all duration-700 ${
          isPulsing ? 'opacity-100 scale-110 animate-emblem-pulse' : 'opacity-65 animate-emblem-pulse'
        }`} 
      />

      {/* 2. Light-sweep diagonal beam */}
      <div className="absolute inset-0 rounded-[22%] overflow-hidden pointer-events-none z-10">
        <div 
          className={`absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent skew-x-[-22deg] ${
            animated || hasLoaded ? 'animate-emblem-sweep' : ''
          }`} 
        />
      </div>

      {/* 3. Bespoke SVG Emblem */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.6)] relative z-0 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Outer Shield & Geometric D Gradient */}
          <linearGradient id="dw-shield-gradient" x1="10" y1="8" x2="90" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f5ff" />
            <stop offset="45%" stopColor="#38bdf8" />
            <stop offset="80%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          {/* Radar Eye & Circuit Gradient */}
          <linearGradient id="dw-radar-grad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f5ff" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* Core Fill */}
          <radialGradient id="dw-shield-core" cx="50" cy="45" r="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.25" />
            <stop offset="55%" stopColor="#4338ca" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#030718" stopOpacity="0.9" />
          </radialGradient>

          {/* Laser Glow Filter */}
          <filter id="dw-laser-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- Outer Shield Base --- */}
        <path
          d="M 50 8 L 86 21 C 86 52, 70 79, 50 94 C 30 79, 14 52, 14 21 Z"
          fill="url(#dw-shield-core)"
          stroke="url(#dw-shield-gradient)"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* --- Abstract Geometric "D" integrated on left side --- */}
        <path
          d="M 28 26 L 28 74 M 28 26 C 52 26, 62 38, 62 50 C 62 62, 52 74, 28 74"
          stroke="url(#dw-shield-gradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeOpacity="0.85"
        />

        {/* --- Digital Eye / Threat Detection Radar Ring --- */}
        <circle
          cx="50"
          cy="50"
          r="20"
          stroke="url(#dw-radar-grad)"
          strokeWidth="2"
          strokeDasharray="8 4"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r="12"
          stroke="#00f5ff"
          strokeWidth="1.2"
          strokeDasharray="4 2"
          fill="none"
          strokeOpacity="0.6"
        />

        {/* --- Early Warning Signal Waveform --- */}
        <path
          d="M 32 50 L 40 50 L 44 42 L 48 58 L 52 38 L 56 60 L 60 50 L 68 50"
          stroke="#00f5ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#dw-laser-filter)"
        />

        {/* --- Circuit Traces & Network Nodes --- */}
        <g stroke="url(#dw-radar-grad)" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M 66 32 L 75 25 L 80 25" />
          <circle cx="80" cy="25" r="2" fill="#10b981" stroke="none" />

          <path d="M 66 68 L 75 75 L 80 75" />
          <circle cx="80" cy="75" r="2" fill="#a855f7" stroke="none" />
        </g>

        {/* Central Core Identity Node */}
        <circle cx="50" cy="50" r="3" fill="#00f5ff" filter="url(#dw-laser-filter)" />

        {/* --- Scanning Laser Beam --- */}
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
              <animate attributeName="y1" values="24; 76; 24" dur="3.2s" repeatCount="indefinite" />
              <animate attributeName="y2" values="24; 76; 24" dur="3.2s" repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.3; 0.95; 0.3" dur="3.2s" repeatCount="indefinite" />
            </line>
          </g>
        )}
      </svg>
    </div>
  );
};
