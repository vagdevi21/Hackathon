/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Threat Distribution Donut
 * Derived dynamically from verified findings or displays honest empty state when no data exists.
 */

import React, { useState, useEffect } from 'react';
import { PieChart, ShieldCheck, AlertCircle } from 'lucide-react';
import { ThreatCategoryDistribution } from '../services/link-analyzer';
import { getScanHistory } from '../utils/scan-history-store';

interface ThreatDistributionDonutProps {
  customDistribution?: ThreatCategoryDistribution[];
  emptyMessage?: string;
}

export const ThreatDistributionDonut: React.FC<ThreatDistributionDonutProps> = ({
  customDistribution,
  emptyMessage = 'Insufficient evidence to calculate threat distribution. Run a scan to generate verified distribution telemetry.',
}) => {
  // If custom distribution passed, use it; otherwise compute from actual scan history
  const [historyItems] = useState(() => getScanHistory());

  let items: ThreatCategoryDistribution[] = [];

  if (customDistribution && customDistribution.length > 0) {
    items = customDistribution;
  } else if (historyItems.length > 0) {
    // Dynamically categorize scan history
    const counts: Record<string, number> = {
      Phishing: 0,
      Malware: 0,
      'VoIP Fraud / Impersonation': 0,
      'Suspicious Domain': 0,
    };
    let total = 0;

    for (const h of historyItems) {
      if (h.scamRating > 30) {
        total++;
        const cat = (h.category || '').toLowerCase();
        if (cat.includes('phish') || cat.includes('credential')) counts.Phishing++;
        else if (cat.includes('malware') || cat.includes('apk') || cat.includes('drainer')) counts.Malware++;
        else if (cat.includes('voip') || cat.includes('irs') || cat.includes('impersonat')) counts['VoIP Fraud / Impersonation']++;
        else counts['Suspicious Domain']++;
      }
    }

    if (total > 0) {
      const colors = ['#06b6d4', '#a855f7', '#f59e0b', '#ec4899'];
      let colorIdx = 0;
      items = Object.entries(counts)
        .filter(([_, c]) => c > 0)
        .map(([name, count]) => {
          const color = colors[colorIdx++ % colors.length];
          return {
            name,
            percentage: Math.round((count / total) * 100),
            count,
            color,
            description: `${count} verified detections`,
          };
        });
    }
  }

  const [activeItem, setActiveItem] = useState<ThreatCategoryDistribution | null>(items[0] || null);

  useEffect(() => {
    if (items.length > 0) {
      setActiveItem(items[0]);
    } else {
      setActiveItem(null);
    }
  }, [customDistribution]);

  if (items.length === 0) {
    return (
      <div className="cyber-card rounded-2xl p-5 border border-purple-900/40 relative overflow-hidden flex flex-col justify-center items-center text-center min-h-[260px]">
        <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">Threat Distribution</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-3">
          {emptyMessage}
        </p>
        <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
          AWAITING SCAN TELEMETRY
        </span>
      </div>
    );
  }

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
            <p className="text-[11px] text-slate-400">Derived from verified findings</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
          Dynamic Telemetry
        </span>
      </div>

      {/* Donut & Stats container */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        {/* SVG Donut */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#0f172a"
              strokeWidth={strokeWidth}
            />
            {items.map((slice) => {
              const strokeDashoffset = circumference - (circumference * slice.percentage) / 100;
              const rotation = (accumulatedPercent / 100) * 360;
              accumulatedPercent += slice.percentage;

              return (
                <circle
                  key={slice.name}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{
                    transformOrigin: 'center',
                    transform: `rotate(${rotation}deg)`,
                    transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                  }}
                  className="cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setActiveItem(slice)}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-black font-mono text-white">
              {activeItem ? `${activeItem.percentage}%` : '100%'}
            </span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase truncate max-w-[90px]">
              {activeItem ? activeItem.name : 'Findings'}
            </span>
          </div>
        </div>

        {/* Legend / Breakdown list */}
        <div className="flex-1 space-y-2 w-full">
          {items.map((slice) => {
            const isSelected = activeItem?.name === slice.name;
            return (
              <div
                key={slice.name}
                onMouseEnter={() => setActiveItem(slice)}
                className={`p-2 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-800/80 border-slate-700 shadow-sm'
                    : 'bg-slate-900/40 border-transparent hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
                    <span className="font-semibold text-slate-200 truncate">{slice.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-400">({slice.count})</span>
                    <span className="font-bold text-white">{slice.percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
