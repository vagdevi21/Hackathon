/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Full View & Expand Modal for Maps & Visualizations
 * Provides full-screen high-res drilldown when user clicks any map or chart
 */

import React from 'react';
import { X, Maximize2, Minimize2, Download, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { ThreatAlert } from '../types/security';
import { AttackWorldMap } from './AttackWorldMap';
import { GlobalThreatHeatmap } from './GlobalThreatHeatmap';
import { ThreatTrendsChart } from './ThreatTrendsChart';
import { ThreatDistributionDonut } from './ThreatDistributionDonut';
import { ThreatForecastingChart } from './ThreatForecastingChart';
import { NetworkTopologyRadar } from './NetworkTopologyRadar';

export type FullViewTarget = 
  | 'ATTACK_MAP' 
  | 'GLOBAL_HEATMAP' 
  | 'THREAT_TRENDS' 
  | 'THREAT_DISTRIBUTION' 
  | 'PREDICTIVE_FORECAST' 
  | 'NETWORK_TOPOLOGY';

interface FullViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: FullViewTarget | null;
  alerts: ThreatAlert[];
  onSelectAlert: (alert: ThreatAlert) => void;
}

export const FullViewModal: React.FC<FullViewModalProps> = ({
  isOpen,
  onClose,
  target,
  alerts,
  onSelectAlert,
}) => {
  if (!isOpen || !target) return null;

  const getTargetTitle = () => {
    switch (target) {
      case 'ATTACK_MAP':
        return {
          title: 'Live Cyber Attack World Map (Full View)',
          subtitle: 'Real-time intercept vectors, origin telemetry, adversary attribution & target SOC nodes',
          badge: 'FULL MAP INTERCEPT VIEW',
        };
      case 'GLOBAL_HEATMAP':
        return {
          title: 'Global Threat Density Heatmap (Full View)',
          subtitle: 'Country risk density scores, high-risk malware geographic clusters & regional telemetry',
          badge: 'GEOPOLITICAL HEAT DENSITY',
        };
      case 'THREAT_TRENDS':
        return {
          title: 'Threat Detection & Trends Analytics (Full View)',
          subtitle: 'Continuous anomaly rate, autonomous mitigation timeline, and volume telemetry',
          badge: 'HOURLY TELEMETRY',
        };
      case 'THREAT_DISTRIBUTION':
        return {
          title: 'Threat Category & Severity Breakdown (Full View)',
          subtitle: 'Zero-day exploits, state-sponsored APTs, ransomware, DDoS, and phishing ratios',
          badge: 'SEVERITY CLASSIFICATION',
        };
      case 'PREDICTIVE_FORECAST':
        return {
          title: 'Predictive Attack Surge Forecasting (Full View)',
          subtitle: 'Next 12-hour surge probability, confidence bounds, and autonomous defensive posture',
          badge: 'PREDICTIVE AI ENGINE',
        };
      case 'NETWORK_TOPOLOGY':
        return {
          title: 'Perimeter Topology Radar (Full View)',
          subtitle: 'Telemetry node status, packet anomaly density, packet loss, and latency monitoring',
          badge: 'TOPOLOGY TELEMETRY',
        };
    }
  };

  const meta = getTargetTitle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-7xl max-h-[94vh] bg-[#070b1a] border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/70 flex flex-col text-slate-100 overflow-hidden my-auto">
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />

        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-glow-cyan">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {meta.title}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  {meta.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Close full view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {target === 'ATTACK_MAP' && (
            <div className="space-y-4">
              <AttackWorldMap alerts={alerts} onSelectAlert={onSelectAlert} />
              
              {/* Extra Full View Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">INTERCEPT SUCCESS RATE</span>
                  <span className="text-emerald-400 font-bold text-base">99.98%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">ACTIVE ATTACK VECTORS</span>
                  <span className="text-red-400 font-bold text-base">{alerts.length} STRIKES</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">PRIMARY ADVERSARY</span>
                  <span className="text-purple-400 font-bold text-base">APT29 / COBALT</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">GEO COVERAGE</span>
                  <span className="text-cyan-400 font-bold text-base">192 COUNTRIES</span>
                </div>
              </div>
            </div>
          )}

          {target === 'GLOBAL_HEATMAP' && (
            <div className="space-y-4">
              <GlobalThreatHeatmap />
            </div>
          )}

          {target === 'THREAT_TRENDS' && (
            <div className="space-y-4">
              <ThreatTrendsChart />
            </div>
          )}

          {target === 'THREAT_DISTRIBUTION' && (
            <div className="space-y-4">
              <ThreatDistributionDonut />
            </div>
          )}

          {target === 'PREDICTIVE_FORECAST' && (
            <div className="space-y-4">
              <ThreatForecastingChart />
            </div>
          )}

          {target === 'NETWORK_TOPOLOGY' && (
            <div className="space-y-4">
              <NetworkTopologyRadar />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
