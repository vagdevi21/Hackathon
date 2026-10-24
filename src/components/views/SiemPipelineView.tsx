/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - SIEM Tools Integration & Data Pipeline (Slide 06)
 */

import React, { useState } from 'react';
import { 
  Radio, 
  Layers, 
  Database, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Terminal, 
  RefreshCw, 
  Zap, 
  Cpu, 
  Server, 
  Cloud, 
  Activity,
  SlidersHorizontal
} from 'lucide-react';
import { INITIAL_SIEM_CONNECTORS } from '../../data/mock-security-data';
import { SIEMConnector } from '../../types/security';

export const SiemPipelineView: React.FC = () => {
  const [connectors, setConnectors] = useState<SIEMConnector[]>(INITIAL_SIEM_CONNECTORS);
  const [logFilter, setLogFilter] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const [liveLogs, setLiveLogs] = useState<{ id: string; time: string; source: string; level: string; msg: string }[]>([
    { id: 'LOG-881', time: '13:21:04.221', source: 'FortiGate-Perimeter', level: 'WARN', msg: 'TCP SYN flood throttled: 1,200 dropped syn packets from 103.21.244.12' },
    { id: 'LOG-882', time: '13:21:03.904', source: 'Auth-IdP-Broker', level: 'ALERT', msg: 'Kerberos token entropy mismatch on principal sec-ops@darkwatch.corp' },
    { id: 'LOG-883', time: '13:21:02.115', source: 'K8s-Cilium-Agent', level: 'INFO', msg: 'Egress NetworkPolicy enforced on namespace "payment-gateway"' },
    { id: 'LOG-884', time: '13:20:59.880', source: 'Splunk-Forwarder', level: 'INFO', msg: 'Batch indexed 4,820 events from cloudwatch-us-west-2' },
    { id: 'LOG-885', time: '13:20:58.312', source: 'CrowdStrike-EDR', level: 'CRIT', msg: 'Behavioral IoC blocked: unbacked executable code execution in svchost.exe' },
    { id: 'LOG-886', time: '13:20:56.109', source: 'AWS-GuardDuty', level: 'WARN', msg: 'Recon:IAMUser/TorIPCaller observed on user analytics-deployer' },
  ]);

  const handleRefreshSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const newLog = {
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        time: new Date().toISOString().substring(11, 23),
        source: 'Kafka-Telemetry-Ingest',
        level: 'INFO',
        msg: `Processed batch of ${Math.floor(2000 + Math.random() * 4000)} normalized JSON security events into DarkWatch pipeline.`,
      };
      setLiveLogs((prev) => [newLog, ...prev.slice(0, 15)]);
      setIsSyncing(false);
    }, 600);
  };

  const filteredLogs = liveLogs.filter((l) =>
    l.msg.toLowerCase().includes(logFilter.toLowerCase()) ||
    l.source.toLowerCase().includes(logFilter.toLowerCase()) ||
    l.level.toLowerCase().includes(logFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Slide 06 Pipeline Architecture Visualizer */}
      <div className="cyber-card rounded-2xl p-5 border border-purple-900/40 relative overflow-hidden">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-cyan-400 border border-blue-500/30">
              06 • DATA SOURCES & PROCESSING
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Data Sources and Ingestion Pipeline</h2>
          <p className="text-xs text-slate-400">
            Collecting relevant security events and transforming them into actionable insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Security Data Sources (4 cols) */}
          <div className="md:col-span-4 p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Server className="w-4 h-4" /> Security Data Sources
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <strong className="text-white block">Network Devices</strong>
                <span className="text-slate-400 text-[11px]">Firewalls, routers, switches, gateways</span>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <strong className="text-white block">Endpoints</strong>
                <span className="text-slate-400 text-[11px]">Devices, workstations, Linux servers</span>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <strong className="text-white block">Application Logs</strong>
                <span className="text-slate-400 text-[11px]">Apps, web servers, databases, containers</span>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <strong className="text-white block">Cloud Services</strong>
                <span className="text-slate-400 text-[11px]">AWS, GCP, Azure, SaaS IAM audits</span>
              </div>
            </div>
          </div>

          {/* Data Processing (4 cols) */}
          <div className="md:col-span-4 p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" /> Real-Time Processing
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-purple-400 font-bold block">Filtering</span>
                <span className="text-[10px] text-slate-400">Remove 84% noise</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-cyan-400 font-bold block">Enrichment</span>
                <span className="text-[10px] text-slate-400">Add Geo/Threat context</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-emerald-400 font-bold block">Normalization</span>
                <span className="text-[10px] text-slate-400">OSSF / ECS standard</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-amber-400 font-bold block">Structuring</span>
                <span className="text-[10px] text-slate-400">Prepare for AI Agent</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 text-center font-mono pt-1">
              Better data. Smarter analysis. Stronger security.
            </p>
          </div>

          {/* Processed Security Data (4 cols) */}
          <div className="md:col-span-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <Database className="w-4 h-4" /> Processed Security Data
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded bg-slate-900/80 border border-slate-800 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Clean and structured events</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-900/80 border border-slate-800 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Enriched with relevant context</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-900/80 border border-slate-800 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Ready for AI analysis</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-900/80 border border-slate-800 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Stored securely for monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SIEM Connectors Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" /> Connected SIEM Integrations ({connectors.length})
          </h3>
          <span className="text-xs font-mono text-emerald-400">Total Throughput: 61,400 EPS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {connectors.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {c.status}
                </span>
              </div>

              <div className="space-y-1 font-mono text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Throughput:</span>
                  <strong className="text-cyan-300">{c.eventsPerSec.toLocaleString()} EPS</strong>
                </div>
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <strong className="text-emerald-300">{c.latencyMs}ms</strong>
                </div>
                <div className="flex justify-between">
                  <span>Noise Filtered:</span>
                  <strong className="text-purple-300">{c.filteringNoiseReductionPercent}%</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live SIEM Log Stream Terminal */}
      <div className="cyber-card rounded-2xl p-5 border border-purple-900/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Live Normalized Ingestion Stream
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder="Filter stream logs..."
                className="bg-transparent text-white placeholder-slate-500 outline-none w-36"
              />
            </div>

            <button
              onClick={handleRefreshSync}
              disabled={isSyncing}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Poll latest SIEM events"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Terminal Box */}
        <div className="p-4 rounded-xl bg-black/85 border border-slate-800 font-mono text-xs space-y-2 max-h-64 overflow-y-auto">
          {filteredLogs.map((l) => {
            const levelColor = {
              CRIT: 'text-red-400 bg-red-950/80 px-1 rounded font-bold',
              ALERT: 'text-orange-400 bg-orange-950/80 px-1 rounded font-bold',
              WARN: 'text-amber-300 bg-amber-950/80 px-1 rounded',
              INFO: 'text-cyan-400',
            }[l.level] || 'text-slate-400';

            return (
              <div key={l.id} className="flex items-start gap-2 leading-relaxed hover:bg-slate-900/50 p-1 rounded transition-colors">
                <span className="text-slate-500 flex-shrink-0">{l.time}</span>
                <span className={`text-[10px] ${levelColor} flex-shrink-0`}>{l.level}</span>
                <span className="text-purple-300 font-semibold flex-shrink-0">[{l.source}]</span>
                <span className="text-slate-300">{l.msg}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
