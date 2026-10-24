/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Network Health & Topology Dedicated View
 */

import React from 'react';
import { Activity, Server, Info, ShieldCheck } from 'lucide-react';
import { NetworkTopologyRadar } from '../NetworkTopologyRadar';

export const NetworkTopologyView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Network Health & Topology
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
              INFRASTRUCTURE RADAR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time topology health of enterprise firewalls, ingress gateways, IAM brokers, and databases.
          </p>
        </div>
      </div>

      {/* Honest Labeling Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="flex items-center gap-2 text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          Sample Enterprise Telemetry • Simulating node status across hybrid multi-region cloud VPCs.
        </span>
      </div>

      {/* Main Container */}
      <div className="cyber-card rounded-2xl p-4 sm:p-6 border border-cyan-500/30 shadow-2xl">
        <NetworkTopologyRadar />
      </div>
    </div>
  );
};
