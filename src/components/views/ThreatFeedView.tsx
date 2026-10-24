/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Live Threat Anomaly Feed Dedicated View
 */

import React, { useState } from 'react';
import { Radio, Flame, ShieldAlert, Filter, Search, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { ThreatAlert } from '../../types/security';

interface ThreatFeedViewProps {
  alerts: ThreatAlert[];
  onSelectAlert: (alert: ThreatAlert) => void;
  onOpenSimulateAttack: () => void;
}

export const ThreatFeedView: React.FC<ThreatFeedViewProps> = ({
  alerts,
  onSelectAlert,
  onOpenSimulateAttack,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'ACTIVE'>('ALL');
  const [search, setSearch] = useState<string>('');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'CRITICAL' && a.severity !== 'CRITICAL') return false;
    if (filter === 'HIGH' && a.severity !== 'HIGH') return false;
    if (filter === 'ACTIVE' && a.status === 'MITIGATED') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.mitreTactic.toLowerCase().includes(q) ||
        a.targetAsset.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Live Threat Anomaly Feed
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-700/50">
              STREAM INGEST
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time feed of anomalous packets, brute-force attempts, credential abuse, and behavioral deviations.
          </p>
        </div>

        <button
          onClick={onOpenSimulateAttack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-xs font-mono font-bold transition-all shadow-glow-rose cursor-pointer"
        >
          <Flame className="w-4 h-4 text-red-400 animate-pulse" />
          <span>Inject Simulated Threat</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'ACTIVE', 'CRITICAL', 'HIGH'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filter === lvl
                  ? 'bg-cyan-600 text-white border border-cyan-500'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-72 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search anomaly ID, tactic, asset..."
            className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full font-mono"
          />
        </div>
      </div>

      {/* Feed List or Empty State */}
      {filteredAlerts.length === 0 ? (
        <div className="cyber-card rounded-2xl p-10 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No active anomalies in stream</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Perimeter security sensors and heuristic monitors are operating with 0 unhandled breaches. Click 'Inject Simulated Threat' to test the anomaly detector.
            </p>
          </div>
          <button
            onClick={onOpenSimulateAttack}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono text-xs font-bold transition-all cursor-pointer"
          >
            Inject Simulated Threat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlerts.map((alert) => {
            const isMitigated = alert.status === 'MITIGATED';
            const isCritical = alert.severity === 'CRITICAL';
            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                  isMitigated
                    ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                    : isCritical
                    ? 'bg-red-950/30 border-red-500/40 text-red-200 shadow-glow-rose'
                    : 'bg-slate-900/80 border-slate-800 text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{alert.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-900/80 text-red-300 border border-red-700/50'
                          : alert.severity === 'HIGH'
                          ? 'bg-amber-900/80 text-amber-300 border border-amber-700/50'
                          : 'bg-blue-900/80 text-blue-300 border border-blue-700/50'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1 line-clamp-2">{alert.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{alert.description}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-4 pt-3 border-t border-slate-800/80">
                  <span>{alert.sourceCountry} → {alert.targetAsset.name}</span>
                  <span className="text-cyan-400 font-bold flex items-center gap-1">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
