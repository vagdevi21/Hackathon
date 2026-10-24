/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Interactive Live Global Attack Map
 */

import React, { useState } from 'react';
import { Globe, ShieldAlert, Crosshair, Zap, Activity } from 'lucide-react';
import { ThreatAlert } from '../types/security';

interface AttackWorldMapProps {
  alerts: ThreatAlert[];
  onSelectAlert?: (alert: ThreatAlert) => void;
}

interface CountryNode {
  code: string;
  name: string;
  x: number; // SVG viewBox coordinates (width: 800, height: 420)
  y: number;
  count: number;
  threatType: string;
}

export const AttackWorldMap: React.FC<AttackWorldMapProps> = ({ alerts, onSelectAlert }) => {
  const [hoveredNode, setHoveredNode] = useState<CountryNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');

  // Corporate SOC HQ target (San Jose / Silicon Valley, USA)
  const targetHq = { x: 190, y: 155, name: 'SOC Primary Data Center (US-West)' };

  // Origin attacker nodes matching Slide 08 (US, IN, DE, SG, BR)
  const attackOrigins: CountryNode[] = [
    { code: 'US', name: 'United States', x: 220, y: 160, count: 5, threatType: 'DNS Tunneling / Exploits' },
    { code: 'IN', name: 'India', x: 550, y: 200, count: 3, threatType: 'Port Scan / SYN Burst' },
    { code: 'DE', name: 'Germany', x: 420, y: 130, count: 2, threatType: 'Tor Exit Node / Anomaly' },
    { code: 'SG', name: 'Singapore', x: 595, y: 250, count: 1, threatType: 'Cobalt Strike Beacon' },
    { code: 'BR', name: 'Brazil', x: 295, y: 295, count: 1, threatType: 'S3 ACL Policy Tamper' },
  ];

  return (
    <div className="cyber-card rounded-2xl p-4 sm:p-5 relative overflow-hidden border border-purple-900/40 shadow-xl">
      {/* Background cyber grid */}
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Globe className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Live Attack Map
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                STREAM ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-400">Real-time incoming adversarial telemetry & geo-vectors</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          {(['ALL', 'CRITICAL', 'HIGH'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeFilter === filter
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Map Container */}
      <div className="relative w-full aspect-[2/1] min-h-[260px] sm:min-h-[320px] bg-[#070c1d]/90 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center">
        <svg
          viewBox="0 0 800 420"
          className="w-full h-full select-none"
          style={{ filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.4))' }}
        >
          <defs>
            {/* Radar scan gradient */}
            <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>

            {/* Attack arc glow */}
            <linearGradient id="arcGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
            </linearGradient>

            {/* Target pulse filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Stylized continent outlines & coordinate grids */}
          <g opacity="0.35" stroke="#1e2d5a" strokeWidth="1" fill="#0d1736">
            {/* North America */}
            <path d="M 100 80 L 250 70 L 280 130 L 240 180 L 190 220 L 140 180 L 90 140 Z" />
            {/* South America */}
            <path d="M 230 220 L 320 230 L 310 340 L 260 380 L 220 300 Z" />
            {/* Europe */}
            <path d="M 380 90 L 460 80 L 480 150 L 400 160 L 370 120 Z" />
            {/* Africa */}
            <path d="M 380 170 L 480 180 L 470 310 L 410 330 L 370 230 Z" />
            {/* Asia */}
            <path d="M 480 70 L 680 80 L 720 180 L 640 240 L 530 220 L 470 150 Z" />
            {/* Australia */}
            <path d="M 640 280 L 730 290 L 710 360 L 630 350 Z" />
          </g>

          {/* Latitude & Longitude grid lines */}
          <g stroke="#1a254c" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.5">
            <line x1="0" y1="105" x2="800" y2="105" />
            <line x1="0" y1="210" x2="800" y2="210" />
            <line x1="0" y1="315" x2="800" y2="315" />
            <line x1="200" y1="0" x2="200" y2="420" />
            <line x1="400" y1="0" x2="400" y2="420" />
            <line x1="600" y1="0" x2="600" y2="420" />
          </g>

          {/* Attack Arcs from origins to Target HQ */}
          {attackOrigins.map((origin, index) => {
            const dx = targetHq.x - origin.x;
            const dy = targetHq.y - origin.y;
            const cx = (origin.x + targetHq.x) / 2;
            const cy = Math.min(origin.y, targetHq.y) - Math.abs(dx) * 0.25;

            return (
              <g key={`arc-${origin.code}`}>
                {/* Arc baseline */}
                <path
                  d={`M ${origin.x} ${origin.y} Q ${cx} ${cy} ${targetHq.x} ${targetHq.y}`}
                  fill="none"
                  stroke="url(#arcGlow)"
                  strokeWidth={origin.count > 2 ? '2' : '1.5'}
                  strokeDasharray="6 4"
                  opacity="0.75"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="100"
                    to="0"
                    dur={`${2.5 + index * 0.5}s`}
                    repeatCount="indefinite"
                  />
                </path>

                {/* Animated beam pulse particle */}
                <circle r="3" fill="#f43f5e" filter="url(#neonGlow)">
                  <animateMotion
                    path={`M ${origin.x} ${origin.y} Q ${cx} ${cy} ${targetHq.x} ${targetHq.y}`}
                    dur={`${2.2 + index * 0.4}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Target HQ Node (Protected SOC Data Center) */}
          <g transform={`translate(${targetHq.x}, ${targetHq.y})`}>
            {/* Concentric protective rings */}
            <circle r="22" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.3" className="animate-ping" />
            <circle r="14" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" filter="url(#neonGlow)" />
            <circle r="6" fill="#93c5fd" />
            <text x="0" y="-18" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="bold" fontFamily="monospace">
              SOC CORE
            </text>
          </g>

          {/* Origin Country Nodes */}
          {attackOrigins.map((node) => {
            const isHovered = hoveredNode?.code === node.code;
            return (
              <g
                key={node.code}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => {
                  const matchingAlert = alerts.find(a => a.sourceCountryCode === node.code);
                  if (matchingAlert && onSelectAlert) {
                    onSelectAlert(matchingAlert);
                  }
                }}
              >
                {/* Ping wave */}
                <circle
                  r={8 + node.count * 2}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  opacity="0.4"
                  className="animate-ping"
                />

                {/* Glow node */}
                <circle
                  r={5 + node.count * 1.5}
                  fill="#7f1d1d"
                  stroke="#ef4444"
                  strokeWidth={isHovered ? '2.5' : '1.5'}
                  filter="url(#neonGlow)"
                />
                <circle r={2.5} fill="#fca5a5" />

                {/* Node Label */}
                <text
                  x="0"
                  y={16 + node.count * 1.5}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.code} ({node.count})
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip when hovering over node */}
        {hoveredNode && (
          <div
            className="absolute top-4 left-4 z-20 bg-slate-900/95 border border-red-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs animate-fadeIn"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {hoveredNode.name} [{hoveredNode.code}]
              </span>
              <span className="text-xs font-mono text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded">
                {hoveredNode.count} Active Threats
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mb-1">
              Primary Vector: <span className="text-amber-300">{hoveredNode.threatType}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Click node to inspect correlated incident details and trigger AI mitigation.
            </p>
          </div>
        )}

        {/* Telemetry HUD overlay in corner */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-lg backdrop-blur-sm hidden sm:flex items-center gap-4 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>INGRESS: 42.8 Gbps</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>ANOMALIES: 12 DETECTED</span>
          </div>
        </div>
      </div>

      {/* Country attack ranking strip (matching Slide 08) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-800/80">
        {attackOrigins.map((c) => (
          <div
            key={c.code}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-bold text-slate-300">{c.name}</span>
            </div>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded">
              {c.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
