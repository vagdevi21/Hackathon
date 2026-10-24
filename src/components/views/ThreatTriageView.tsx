/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Threat Detection & Triage View (Slide 05 & 07)
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Bot, 
  Radio, 
  Cpu, 
  CheckCircle, 
  ChevronRight, 
  Sparkles, 
  Play, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { ThreatAlert } from '../../types/security';

interface ThreatTriageViewProps {
  alerts: ThreatAlert[];
  onSelectAlert: (alert: ThreatAlert) => void;
  onOpenSimulateAttack: () => void;
}

export const ThreatTriageView: React.FC<ThreatTriageViewProps> = ({
  alerts,
  onSelectAlert,
  onOpenSimulateAttack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.sourceIp.includes(searchTerm) ||
      alert.sourceCountry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.targetAsset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* 3-Stage Workflow Banner matching Slide 05 */}
      <div className="cyber-card rounded-2xl p-5 border border-purple-900/40 relative overflow-hidden">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
              05 • HOW IT WORKS
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">The 3-Stage Workflow</h2>
          <p className="text-xs text-slate-400">From suspicious activity to a safer tomorrow in three simple steps.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stage 1: DETECT */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center font-mono text-xs">
                01
              </span>
              <span>DETECT</span>
            </div>
            <p className="text-xs text-slate-300">Identify potentially suspicious activity using multiple detection methods.</p>
            <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px] font-mono text-slate-400">
              <span className="p-1 rounded bg-slate-900/80 border border-slate-800">Anomaly Detection</span>
              <span className="p-1 rounded bg-slate-900/80 border border-slate-800">Pattern Analysis</span>
              <span className="p-1 rounded bg-slate-900/80 border border-slate-800">Threat Intel</span>
              <span className="p-1 rounded bg-slate-900/80 border border-slate-800">Behavior Analysis</span>
            </div>
          </div>

          {/* Stage 2: ASSESS */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center font-mono text-xs">
                02
              </span>
              <span>ASSESS</span>
            </div>
            <p className="text-xs text-slate-300">Prioritize alerts based on severity, confidence, and operational context.</p>
            <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px] font-mono text-slate-400">
              <span className="p-1 rounded bg-slate-900/80 border border-slate-800 text-red-400">Critical / High Severity</span>
              <span className="p-1 rounded bg-slate-900/80 border border-slate-800 text-cyan-300">Confidence Score</span>
              <span className="p-1 rounded bg-slate-900/80 border border-slate-800">Context Analysis</span>
              <span className="p-1 rounded bg-slate-900/80 border border-slate-800">Alert Prioritization</span>
            </div>
          </div>

          {/* Stage 3: RESPOND */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center font-mono text-xs">
                03
              </span>
              <span>RESPOND</span>
            </div>
            <p className="text-xs text-slate-300">Recommend appropriate action and apply approval or simulation safeguards.</p>
            <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px] font-mono text-slate-400">
              <span className="p-1 rounded bg-slate-900/80 border border-slate-800 text-emerald-300">Recommended Action</span>
              <span className="p-1 rounded bg-slate-900/80 border border-slate-800 text-amber-300">Human Approval</span>
              <span className="p-1 rounded bg-slate-900/80 border border-slate-800 text-blue-300">Simulation Mode</span>
              <span className="p-1 rounded bg-slate-900/80 border border-slate-800">Audit Logging</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search threats by IP, CVE, affected asset or payload..."
            className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
          />
        </div>

        {/* Severity filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg font-mono transition-all cursor-pointer ${
                severityFilter === sev
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenSimulateAttack}
          className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>Simulate Attack</span>
        </button>
      </div>

      {/* List of Threat Cards */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center cyber-card rounded-2xl border border-slate-800">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Matching Threats Found</h3>
            <p className="text-xs text-slate-400 mt-1">All filtered criteria are currently clean or resolved.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const severityColor = {
              CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/40',
              HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/40',
              MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
              LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/40',
            }[alert.severity];

            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                className="p-4 sm:p-5 rounded-2xl cyber-card border border-purple-900/30 hover:border-purple-500/60 transition-all cursor-pointer group shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${severityColor}`}>
                      {alert.severity}
                    </span>
                    <span className="font-mono text-xs text-slate-400 font-bold">{alert.id}</span>
                    <span className="text-xs text-slate-500">• {alert.timestamp}</span>
                    <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                      {alert.type}
                    </span>
                    <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      {alert.confidence}% Confidence
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    {alert.title}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                    <span>Source: <strong className="text-slate-200">{alert.sourceIp} ({alert.sourceCountry})</strong></span>
                    <span>Target: <strong className="text-cyan-300">{alert.targetAsset.name}</strong></span>
                    <span>MITRE: <strong className="text-purple-300">{alert.mitreTechnique}</strong></span>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                    alert.status === 'MITIGATED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' :
                    alert.status === 'SIMULATED' ? 'bg-amber-950/60 text-amber-400 border border-amber-800' :
                    'bg-red-950/60 text-red-400 border border-red-800 animate-pulse'
                  }`}>
                    {alert.status}
                  </span>

                  <button className="px-3.5 py-1.5 rounded-lg bg-purple-600/20 group-hover:bg-purple-600 group-hover:text-white text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all">
                    <span>Inspect & Triage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
