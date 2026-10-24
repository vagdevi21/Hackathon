/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Real-time Network Topology & Health Radar
 */

import React, { useState } from 'react';
import { Server, Shield, Database, Radio, Cpu, Cloud, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from 'lucide-react';

interface NetworkNode {
  id: string;
  name: string;
  category: 'PERIMETER' | 'GATEWAY' | 'IDENTITY' | 'COMPUTE' | 'DATABASE' | 'STORAGE';
  ip: string;
  status: 'HEALTHY' | 'WARNING' | 'COMPROMISED';
  latencyMs: number;
  throughputMbps: number;
  anomalyDetected?: string;
}

export const NetworkTopologyRadar: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  const nodes: NetworkNode[] = [
    {
      id: 'NODE-FW-01',
      name: 'Perimeter NextGen Firewall',
      category: 'PERIMETER',
      ip: '10.240.1.1',
      status: 'HEALTHY',
      latencyMs: 3.2,
      throughputMbps: 8400,
    },
    {
      id: 'NODE-GW-01',
      name: 'Kubernetes Ingress Gateway',
      category: 'GATEWAY',
      ip: '10.240.10.15',
      status: 'WARNING',
      latencyMs: 14.8,
      throughputMbps: 4200,
      anomalyDetected: 'ALT-9403: Outbound port scan burst (850 pkts/s)',
    },
    {
      id: 'NODE-IAM-01',
      name: 'Identity & OAuth Broker',
      category: 'IDENTITY',
      ip: '10.240.12.8',
      status: 'WARNING',
      latencyMs: 9.1,
      throughputMbps: 620,
      anomalyDetected: 'ALT-9401: Concurrent Tor exit login anomaly',
    },
    {
      id: 'NODE-APP-01',
      name: 'Core Microservices Fleet',
      category: 'COMPUTE',
      ip: '10.240.20.0/24',
      status: 'HEALTHY',
      latencyMs: 4.5,
      throughputMbps: 12800,
    },
    {
      id: 'NODE-DB-01',
      name: 'Primary Financial Ledger DB',
      category: 'DATABASE',
      ip: '10.240.50.2',
      status: 'COMPROMISED',
      latencyMs: 22.4,
      throughputMbps: 1850,
      anomalyDetected: 'ALT-9402: High-entropy DNS Tunneling exfiltration active',
    },
    {
      id: 'NODE-S3-01',
      name: 'AWS S3 Analytics Data Lake',
      category: 'STORAGE',
      ip: '52.216.14.90',
      status: 'WARNING',
      latencyMs: 18.2,
      throughputMbps: 940,
      anomalyDetected: 'ALT-9405: Unauthorized public ACL modification attempt',
    },
  ];

  return (
    <div className="cyber-card rounded-2xl p-4 sm:p-5 border border-purple-900/40 relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Network Health & Topology Radar
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                98% HEALTHY
              </span>
            </h3>
            <p className="text-xs text-slate-400">Continuous deep packet inspection & zero-trust segmentation telemetry</p>
          </div>
        </div>

        {/* Global Node Summary Badges */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> 4 Healthy
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-800/40">
            <AlertTriangle className="w-3.5 h-3.5" /> 2 Warning
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/40 text-red-300 border border-red-800/40 animate-pulse">
            <XCircle className="w-3.5 h-3.5" /> 1 Compromised
          </span>
        </div>
      </div>

      {/* Grid of Topology Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {nodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const statusColors = {
            HEALTHY: {
              border: 'border-emerald-500/40 hover:border-emerald-400',
              bg: 'bg-emerald-950/20',
              badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
              dot: 'bg-emerald-400',
              icon: CheckCircle2,
            },
            WARNING: {
              border: 'border-amber-500/40 hover:border-amber-400',
              bg: 'bg-amber-950/20',
              badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
              dot: 'bg-amber-400',
              icon: AlertTriangle,
            },
            COMPROMISED: {
              border: 'border-red-500/60 hover:border-red-400 shadow-glow-rose',
              bg: 'bg-red-950/30',
              badge: 'bg-red-500/10 text-red-400 border-red-500/30',
              dot: 'bg-red-400 animate-ping',
              icon: XCircle,
            },
          }[node.status];

          const IconComponent = {
            PERIMETER: Shield,
            GATEWAY: ArrowUpRight,
            IDENTITY: Cpu,
            COMPUTE: Server,
            DATABASE: Database,
            STORAGE: Cloud,
          }[node.category];

          const StatusIcon = statusColors.icon;

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-purple-500 ring-2 ring-purple-500/30 bg-slate-900/90'
                  : `${statusColors.border} ${statusColors.bg} hover:bg-slate-900/60`
              }`}
            >
              {/* Category & Status row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-slate-800 text-slate-300">
                    <IconComponent className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{node.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400">{node.ip}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusColors.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`} />
                  {node.status}
                </span>
              </div>

              {/* Metrics row */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Latency: <strong className="text-slate-200">{node.latencyMs}ms</strong></span>
                <span>Throughput: <strong className="text-slate-200">{node.throughputMbps} Mbps</strong></span>
              </div>

              {/* Anomaly banner if warning/compromised */}
              {node.anomalyDetected && (
                <div className="mt-2 p-1.5 rounded bg-red-950/50 border border-red-800/40 text-[10px] text-red-300 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="truncate">{node.anomalyDetected}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Node Drawer / Detail Strip */}
      {selectedNode && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/95 border border-purple-500/40 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="font-mono text-purple-300 font-bold">{selectedNode.id}</span>
            <span className="text-white font-semibold">{selectedNode.name}</span>
            <span className="text-slate-400 font-mono">({selectedNode.ip})</span>
            {selectedNode.anomalyDetected && (
              <span className="text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-800/50">
                Active Anomaly Triggered
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-[11px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
