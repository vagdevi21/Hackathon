/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Threat Distribution Donut (Slide 08)
 */

import React, { useState } from 'react';
import { PieChart, ShieldCheck } from 'lucide-react';

interface Slice {
  name: string;
  percent: number;
  color: string;
  accent: string;
  count: number;
}

export const ThreatDistributionDonut: React.FC = () => {
  const slices: Slice[] = [
    { name: 'Malware', percent: 48, color: '#a855f7', accent: '#c084fc', count: 48 },
    { name: 'Phishing', percent: 27, color: '#06b6d4', accent: '#22d3ee', count: 27 },
    { name: 'Suspicious', percent: 15, color: '#10b981', accent: '#34d399', count: 15 },
    { name: 'Others', percent: 10, color: '#f59e0b', accent: '#fbbf24', count: 10 },
  ];

  const [activeSlice, setActiveSlice] = useState<Slice>(slices[0]);

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="cyber-card rounded-2xl p-4 sm:p-5 border border-purple-900/40 relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Threat Distribution</h3>
            <p className="text-[11px] text-slate-400">Classified payload taxonomy</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
          100% Normalized
        </span>
      </div>

      {/* Donut & Stats container */}
      <div className="flex items-center justify-between gap-4 py-2">
        {/* SVG Donut */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#0f172a"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slices.map((slice) => {
              const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += slice.percent;
              const isSelected = activeSlice.name === slice.name;

              return (
                <circle
                  key={slice.name}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setActiveSlice(slice)}
                />
              );
            })}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span
              className="text-2xl font-black font-mono tracking-tight"
              style={{ color: activeSlice.color }}
            >
              {activeSlice.percent}%
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
              {activeSlice.name}
            </span>
          </div>
        </div>

        {/* Legend list */}
        <div className="flex-1 space-y-2">
          {slices.map((slice) => {
            const isSelected = activeSlice.name === slice.name;
            return (
              <div
                key={slice.name}
                onMouseEnter={() => setActiveSlice(slice)}
                className={`flex items-center justify-between p-1.5 rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/80 border border-slate-700 shadow-sm'
                    : 'hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: slice.color, boxShadow: `0 0 8px ${slice.color}88` }}
                  />
                  <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {slice.name}
                  </span>
                </div>
                <span
                  className="text-xs font-mono font-bold"
                  style={{ color: slice.color }}
                >
                  {slice.percent}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
