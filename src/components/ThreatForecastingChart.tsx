/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Threat Forecasting Chart with Recharts
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Sparkles, AlertCircle, ShieldAlert, Clock, Cpu } from 'lucide-react';

interface ForecastDataPoint {
  time: string;
  historicalLoad?: number;
  predictedLoad?: number;
  upperConfidence?: number;
  lowerConfidence?: number;
  isPeakAnomaly?: boolean;
}

export const ThreatForecastingChart: React.FC = () => {
  const [horizon, setHorizon] = useState<'12H' | '24H' | '7D'>('24H');

  // Time-series dataset with historical baseline + ML predicted load
  const forecastData: ForecastDataPoint[] = [
    // Historical (past 12 hours)
    { time: 'T-12h', historicalLoad: 38, upperConfidence: 42, lowerConfidence: 34 },
    { time: 'T-10h', historicalLoad: 45, upperConfidence: 50, lowerConfidence: 40 },
    { time: 'T-08h', historicalLoad: 52, upperConfidence: 58, lowerConfidence: 48 },
    { time: 'T-06h', historicalLoad: 68, upperConfidence: 74, lowerConfidence: 62 },
    { time: 'T-04h', historicalLoad: 60, upperConfidence: 66, lowerConfidence: 54 },
    { time: 'T-02h', historicalLoad: 74, upperConfidence: 80, lowerConfidence: 68 },
    { time: 'NOW', historicalLoad: 82, predictedLoad: 82, upperConfidence: 88, lowerConfidence: 76 },

    // Predictive ML Forecast (next 12-24 hours)
    { time: '+02h', predictedLoad: 78, upperConfidence: 86, lowerConfidence: 70 },
    { time: '+04h', predictedLoad: 94, upperConfidence: 104, lowerConfidence: 84, isPeakAnomaly: true },
    { time: '+06h', predictedLoad: 88, upperConfidence: 98, lowerConfidence: 78 },
    { time: '+08h', predictedLoad: 72, upperConfidence: 82, lowerConfidence: 62 },
    { time: '+10h', predictedLoad: 58, upperConfidence: 68, lowerConfidence: 48 },
    { time: '+12h', predictedLoad: 46, upperConfidence: 56, lowerConfidence: 36 },
    { time: '+16h', predictedLoad: 54, upperConfidence: 66, lowerConfidence: 42 },
    { time: '+20h', predictedLoad: 65, upperConfidence: 78, lowerConfidence: 52 },
    { time: '+24h', predictedLoad: 60, upperConfidence: 72, lowerConfidence: 48 },
  ];

  return (
    <div className="cyber-card rounded-2xl p-5 border border-purple-900/40 relative overflow-hidden space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Predictive Threat Forecasting
              <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> ML FORECAST ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Anticipates security event volume, credential-stuffing bursts, and infrastructure load before exploitation.
            </p>
          </div>
        </div>

        {/* Horizon Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          {(['12H', '24H', '7D'] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                horizon === h
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Insight Banner */}
      <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-purple-200">
          <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>
            <strong>Predictive Alert:</strong> High probability of volumetric anomaly surge predicted at <strong>+04h (02:00 AM)</strong>.
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-slate-400">Confidence: <strong className="text-cyan-300">96.4%</strong></span>
          <span className="text-slate-400">Predicted Delta: <strong className="text-red-400">+42% Peak Load</strong></span>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={forecastData}
            margin={{ top: 20, right: 30, left: -10, bottom: 0 }}
          >
            <defs>
              {/* Confidence Interval Gradient */}
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>

              {/* Historical Area Gradient */}
              <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>

              {/* Predicted Area Gradient */}
              <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e294b" opacity={0.6} />

            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              domain={[20, 110]}
              unit=" eps"
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900/95 border border-purple-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono space-y-1">
                      <p className="font-bold text-white border-b border-slate-800 pb-1">{label}</p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex justify-between gap-3" style={{ color: entry.color }}>
                          <span>{entry.name}:</span>
                          <strong className="font-bold">{entry.value} EPS</strong>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'monospace' }}
            />

            {/* Reference Line for CURRENT TIME */}
            <ReferenceLine
              x="NOW"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{ value: 'CURRENT TIME', fill: '#22d3ee', fontSize: 10, position: 'top', fontFamily: 'monospace' }}
            />

            {/* Reference Line for PREDICTED PEAK SURGE */}
            <ReferenceLine
              x="+04h"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{ value: 'PREDICTED PEAK SURGE', fill: '#fb7185', fontSize: 10, position: 'insideTopRight', fontFamily: 'monospace' }}
            />

            {/* Upper Confidence Band */}
            <Area
              type="monotone"
              dataKey="upperConfidence"
              name="Upper Bound (Confidence)"
              stroke="transparent"
              fill="url(#confidenceGradient)"
            />

            {/* Historical Load Area */}
            <Area
              type="monotone"
              dataKey="historicalLoad"
              name="Historical Ingest Load"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fill="url(#historicalGradient)"
            />

            {/* Predicted Security Load Line */}
            <Line
              type="monotone"
              dataKey="predictedLoad"
              name="Predicted Security Load"
              stroke="#ec4899"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#ec4899', stroke: '#070c1d', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Predictive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Projected 24h Peak</span>
          <span className="text-base font-black font-mono text-pink-400">104 EPS (+42%)</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Expected between 02:00 - 04:00 UTC</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Model Reliability</span>
          <span className="text-base font-black font-mono text-emerald-400">96.4% F1-Score</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Trained on 48M historical logs</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Recommended Action</span>
          <span className="text-base font-bold text-cyan-300">Auto-PreScale WAF</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Scale ingress replica pool from 8 to 14</p>
        </div>
      </div>
    </div>
  );
};
