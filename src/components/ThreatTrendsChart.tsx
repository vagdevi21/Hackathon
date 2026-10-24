/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Threat Trends Interactive Chart (Slide 08)
 */

import React, { useState } from 'react';
import { TrendingUp, BarChart3, Filter } from 'lucide-react';

export const ThreatTrendsChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D'>('24H');
  const [hoveredPoint, setHoveredPoint] = useState<{ time: string; malware: number; phishing: number; suspicious: number } | null>(null);

  // Timepoints matching Slide 08: 12:00, 16:00, 20:00, 00:00, 04:00, 08:00, 12:00
  const dataPoints = [
    { time: '12:00', malware: 18, phishing: 9, suspicious: 5 },
    { time: '16:00', malware: 14, phishing: 11, suspicious: 8 },
    { time: '20:00', malware: 26, phishing: 16, suspicious: 12 },
    { time: '00:00', malware: 19, phishing: 12, suspicious: 15 },
    { time: '04:00', malware: 32, phishing: 18, suspicious: 11 },
    { time: '08:00', malware: 28, phishing: 24, suspicious: 18 },
    { time: '12:00', malware: 35, phishing: 20, suspicious: 14 },
  ];

  // SVG dimensions
  const width = 580;
  const height = 210;
  const paddingX = 40;
  const paddingY = 25;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;

  const maxVal = 40;

  const getCoordinates = (value: number, index: number) => {
    const x = paddingX + (index / (dataPoints.length - 1)) * plotWidth;
    const y = height - paddingY - (value / maxVal) * plotHeight;
    return { x, y };
  };

  // Generate smooth SVG cubic bezier path
  const createSmoothPath = (key: 'malware' | 'phishing' | 'suspicious') => {
    const points = dataPoints.map((d, i) => getCoordinates(d[key], i));
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      path += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const createAreaPath = (key: 'malware' | 'phishing' | 'suspicious') => {
    const linePath = createSmoothPath(key);
    const lastX = paddingX + plotWidth;
    const firstX = paddingX;
    const baselineY = height - paddingY;
    return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  };

  return (
    <div className="cyber-card rounded-2xl p-4 sm:p-5 border border-purple-900/40 relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Threat Trends</h3>
            <p className="text-[11px] text-slate-400">Multi-vector volumetric anomaly progression</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-glow-purple" />
            <span className="text-slate-300 font-medium">Malware</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
            <span className="text-slate-300 font-medium">Phishing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
            <span className="text-slate-300 font-medium">Suspicious</span>
          </div>
        </div>
      </div>

      {/* SVG Line / Area Graph */}
      <div className="relative w-full h-[190px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none overflow-visible">
          <defs>
            <linearGradient id="malwareGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="phishingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 10, 20, 30, 40].map((val) => {
            const y = height - paddingY - (val / maxVal) * plotHeight;
            return (
              <g key={`grid-${val}`}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#1e294b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={createAreaPath('malware')} fill="url(#malwareGradient)" />
          <path d={createAreaPath('phishing')} fill="url(#phishingGradient)" />

          {/* Stroke Lines */}
          <path d={createSmoothPath('malware')} fill="none" stroke="#a855f7" strokeWidth="2.5" />
          <path d={createSmoothPath('phishing')} fill="none" stroke="#22d3ee" strokeWidth="2" />
          <path d={createSmoothPath('suspicious')} fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Interactive Data Points */}
          {dataPoints.map((d, i) => {
            const mPt = getCoordinates(d.malware, i);
            const isHovered = hoveredPoint?.time === d.time;
            return (
              <g
                key={`pts-${d.time}-${i}`}
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              >
                {/* Vertical hover crosshair line */}
                {isHovered && (
                  <line
                    x1={mPt.x}
                    y1={paddingY}
                    x2={mPt.x}
                    y2={height - paddingY}
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                )}
                {/* Dots */}
                <circle
                  cx={mPt.x}
                  cy={mPt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#a855f7"
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="transition-all"
                />
                {/* Time Axis Labels */}
                <text
                  x={mPt.x}
                  y={height - 8}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {d.time}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-slate-900/95 border border-purple-500/50 p-2.5 rounded-lg shadow-xl text-xs backdrop-blur-md z-20 pointer-events-none animate-fadeIn">
            <div className="font-mono text-purple-300 font-bold mb-1 border-b border-slate-800 pb-1">
              {hoveredPoint.time} Telemetry
            </div>
            <div className="flex justify-between gap-3 text-purple-400">
              <span>Malware:</span>
              <span className="font-mono font-bold">{hoveredPoint.malware}</span>
            </div>
            <div className="flex justify-between gap-3 text-cyan-400">
              <span>Phishing:</span>
              <span className="font-mono font-bold">{hoveredPoint.phishing}</span>
            </div>
            <div className="flex justify-between gap-3 text-emerald-400">
              <span>Suspicious:</span>
              <span className="font-mono font-bold">{hoveredPoint.suspicious}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
