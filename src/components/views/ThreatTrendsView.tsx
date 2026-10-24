/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Threat Trends & Analytics Dedicated View
 */

import React from 'react';
import { BarChart3, TrendingUp, Info } from 'lucide-react';
import { ThreatTrendsChart } from '../ThreatTrendsChart';

export const ThreatTrendsView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Threat Trends & Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700/50">
              7-DAY INCIDENT VELOCITY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Historical incident volume, attack vector breakdown, and detection velocity curves over time.
          </p>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="flex items-center gap-2 text-slate-300">
          <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />
          Analytics Engine • Visualizing 7-day rolling incident trends and attack mitigation rates.
        </span>
      </div>

      {/* Main Chart Container */}
      <div className="cyber-card rounded-2xl p-4 sm:p-6 border border-purple-500/30 shadow-2xl">
        <ThreatTrendsChart />
      </div>
    </div>
  );
};
