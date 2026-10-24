/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Predictive Threat Forecasting Dedicated View
 */

import React from 'react';
import { TrendingUp, Cpu, Info, AlertTriangle } from 'lucide-react';
import { ThreatForecastingChart } from '../ThreatForecastingChart';

export const ThreatForecastingView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Predictive Threat Forecasting
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700/50">
              DEMO / SIMULATED MODEL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Machine learning time-series projection for 24-hour perimeter attack surges and anomaly confidence intervals.
          </p>
        </div>
      </div>

      {/* Honest Labeling Notice */}
      <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs font-mono text-amber-200">
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
          Demonstration Telemetry: This model displays simulated 24h attack surge predictions based on synthetic SOC traffic patterns.
        </span>
      </div>

      {/* Main Chart Container */}
      <div className="cyber-card rounded-2xl p-4 sm:p-6 border border-purple-500/30 shadow-2xl">
        <ThreatForecastingChart />
      </div>
    </div>
  );
};
