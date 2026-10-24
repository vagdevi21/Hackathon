/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Global Attack Map Dedicated View
 */

import React from 'react';
import { Globe, ShieldAlert, Radio, Flame, Info } from 'lucide-react';
import { ThreatAlert } from '../../types/security';
import { AttackWorldMap } from '../AttackWorldMap';

interface AttackMapViewProps {
  alerts: ThreatAlert[];
  onSelectAlert: (alert: ThreatAlert) => void;
  onOpenSimulateAttack: () => void;
}

export const AttackMapView: React.FC<AttackMapViewProps> = ({
  alerts,
  onSelectAlert,
  onOpenSimulateAttack,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Globe className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Global Attack Map
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
              GEOLOCATION TELEMETRY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time visual interception of inbound perimeter attacks, origin nodes, and honeypot triggers.
          </p>
        </div>

        <button
          onClick={onOpenSimulateAttack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-xs font-mono font-bold transition-all shadow-glow-rose cursor-pointer"
        >
          <Flame className="w-4 h-4 text-red-400 animate-pulse" />
          <span>Simulate Inbound Attack</span>
        </button>
      </div>

      {/* Telemetry Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="flex items-center gap-2 text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          Perimeter Geolocation Feed • Visualizing verified live alerts and simulated test vectors.
        </span>
        <span className="text-[10px] text-cyan-300/80">
          Active Inbound Vectors: {alerts.length}
        </span>
      </div>

      {/* Main Full-Size Map Container */}
      <div className="cyber-card rounded-2xl p-4 sm:p-6 border border-cyan-500/30 shadow-2xl">
        <AttackWorldMap alerts={alerts} onSelectAlert={onSelectAlert} />
      </div>
    </div>
  );
};
