/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Threat Density Heatmap Dedicated View
 */

import React from 'react';
import { Flame, ShieldAlert, Info } from 'lucide-react';
import { GlobalThreatHeatmap } from '../GlobalThreatHeatmap';

export const ThreatHeatmapView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Flame className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Threat Density Heatmap
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700/50">
              GLOBAL EXPOSURE INDEX
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global geographic concentration of malicious IP clusters, botnet infrastructure, and spam relays.
          </p>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="flex items-center gap-2 text-slate-300">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
          Aggregate Global Heatmap • Dynamic density calculation based on threat reputation telemetry.
        </span>
      </div>

      {/* Main Heatmap Container */}
      <div className="cyber-card rounded-2xl p-4 sm:p-6 border border-amber-500/30 shadow-2xl">
        <GlobalThreatHeatmap />
      </div>
    </div>
  );
};
