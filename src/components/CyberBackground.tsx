/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Reusable Animated Cybersecurity Background Component
 * 
 * Features:
 * - Shared across Desktop and Mobile viewports
 * - Central subtle shield watermark
 * - Concentric rotating radar rings & scanning arcs
 * - Fine circuit-board traces & pulsing signal nodes
 * - Floating data packets & cryptographic identifiers (0x7F4A, SHA256, AES-256)
 * - Decorative cybersecurity terms ("THREAT INTELLIGENCE", "ZERO TRUST", "NETWORK DEFENSE", "EARLY WARNING")
 * - Responsive layout & reduced-motion accessibility support
 */

import React from 'react';

export const CyberBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* 1. Base Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.06)_1px,transparent_1px)] bg-[size:3rem_3rem]" />

      {/* 2. Soft Ambient Color Glow Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />

      {/* 3. Central Coordinated SVG Cybersecurity Environment */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 800"
      >
        <defs>
          {/* Shield Watermark Gradient */}
          <linearGradient id="bg-shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.25" />
          </linearGradient>

          {/* Circuit Line Gradient */}
          <linearGradient id="bg-circuit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
          </linearGradient>

          {/* Laser Glow Filter */}
          <filter id="bg-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- Central Shield Watermark --- */}
        <g transform="translate(600, 400) scale(2.8)" opacity="0.16">
          <path
            d="M 0 -70 L 50 -50 C 50 0, 35 45, 0 65 C -35 45, -50 0, -50 -50 Z"
            fill="none"
            stroke="url(#bg-shield-grad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M 0 -58 L 40 -40 C 40 0, 28 35, 0 52 C -28 35, -40 0, -40 -40 Z"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1"
            strokeDasharray="6 3"
            strokeOpacity="0.6"
          />
        </g>

        {/* --- Rotating Radar Rings & Scanning Arcs --- */}
        <g transform="translate(600, 400)">
          {/* Outer Radar Ring */}
          <circle r="340" fill="none" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.12" strokeDasharray="12 6" />
          <circle r="260" fill="none" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="20 10" />
          <circle r="180" fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeOpacity="0.2" />

          {/* Rotating Radar Arc Sweep */}
          <g className="animate-radar-sweep origin-center">
            <path
              d="M 0 0 L 260 0 A 260 260 0 0 1 183.8 183.8 Z"
              fill="url(#bg-shield-grad)"
              opacity="0.18"
            />
            <line x1="0" y1="0" x2="260" y2="0" stroke="#00f5ff" strokeWidth="1.8" strokeOpacity="0.7" />
          </g>
        </g>

        {/* --- Interconnected Circuit Board Traces --- */}
        <g stroke="url(#bg-circuit-grad)" strokeWidth="1.5" fill="none" strokeLinecap="round">
          {/* Top Left Quadrant Traces */}
          <path d="M 100 120 L 300 120 L 380 200 L 480 200" />
          <path d="M 150 250 L 280 250 L 340 310 L 420 310" />
          
          {/* Top Right Quadrant Traces */}
          <path d="M 1100 120 L 900 120 L 820 200 L 720 200" />
          <path d="M 1050 250 L 920 250 L 860 310 L 780 310" />

          {/* Bottom Left Quadrant Traces */}
          <path d="M 100 680 L 300 680 L 380 600 L 480 600" />
          <path d="M 150 550 L 280 550 L 340 490 L 420 490" />

          {/* Bottom Right Quadrant Traces */}
          <path d="M 1100 680 L 900 680 L 820 600 L 720 600" />
          <path d="M 1050 550 L 920 550 L 860 490 L 780 490" />
        </g>

        {/* --- Pulsing Network Nodes --- */}
        <g>
          {/* Top Nodes */}
          <circle cx="300" cy="120" r="4" fill="#06b6d4" className="animate-pulse" />
          <circle cx="380" cy="200" r="3.5" fill="#3b82f6" />
          <circle cx="900" cy="120" r="4" fill="#8b5cf6" className="animate-pulse" />
          <circle cx="820" cy="200" r="3.5" fill="#06b6d4" />

          {/* Bottom Nodes */}
          <circle cx="300" cy="680" r="4" fill="#10b981" className="animate-pulse" />
          <circle cx="380" cy="600" r="3.5" fill="#06b6d4" />
          <circle cx="900" cy="680" r="4" fill="#06b6d4" className="animate-pulse" />
          <circle cx="820" cy="600" r="3.5" fill="#8b5cf6" />
        </g>

        {/* --- Flowing Light Signal Particles --- */}
        <g>
          <circle cx="200" cy="120" r="2.5" fill="#00f5ff" filter="url(#bg-glow)">
            <animate attributeName="cx" values="100;300;380" dur="4s" repeatCount="indefinite" />
            <animate attributeName="cy" values="120;120;200" dur="4s" repeatCount="indefinite" />
          </circle>

          <circle cx="1000" cy="120" r="2.5" fill="#c084fc" filter="url(#bg-glow)">
            <animate attributeName="cx" values="1100;900;820" dur="5s" repeatCount="indefinite" />
            <animate attributeName="cy" values="120;120;200" dur="5s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>

      {/* 4. Floating Cryptographic Identifiers & Security Keywords */}
      <div className="absolute inset-0 text-cyan-400/30 text-[10px] font-mono tracking-widest pointer-events-none select-none">
        {/* Top Left Floating Identifiers */}
        <div className="absolute top-12 left-10 space-y-1 hidden sm:block">
          <div>[TEL_NODE_01]: ACTIVE</div>
          <div className="text-cyan-300/40">SHA256: 8f94a...e12d</div>
          <div className="text-purple-400/30">ZERO TRUST INTERCEPT</div>
        </div>

        {/* Top Right Floating Identifiers */}
        <div className="absolute top-12 right-10 text-right space-y-1 hidden sm:block">
          <div>SOC GATEWAY v4.2</div>
          <div className="text-cyan-300/40">RSA-4096 ENCRYPTED</div>
          <div className="text-emerald-400/30">SIGNAL ANALYSIS: ON</div>
        </div>

        {/* Bottom Left Floating Terms */}
        <div className="absolute bottom-16 left-10 space-y-1 hidden md:block">
          <div className="text-purple-300/30">THREAT INTELLIGENCE</div>
          <div className="text-cyan-400/30">EARLY WARNING RADAR</div>
        </div>

        {/* Bottom Right Floating Terms */}
        <div className="absolute bottom-16 right-10 text-right space-y-1 hidden md:block">
          <div className="text-cyan-300/30">NETWORK DEFENSE CORE</div>
          <div className="text-emerald-300/30">AUTONOMOUS TRIAGE</div>
        </div>
      </div>
    </div>
  );
};
