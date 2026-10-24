/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Live Threat Simulation Modal
 */

import React, { useState } from 'react';
import { X, Flame, ShieldAlert, Zap, Globe, Target, Terminal, Play } from 'lucide-react';
import { ThreatAlert } from '../types/security';

interface SimulateAttackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectThreat: (threat: ThreatAlert) => void;
}

export const SimulateAttackModal: React.FC<SimulateAttackModalProps> = ({
  isOpen,
  onClose,
  onInjectThreat,
}) => {
  if (!isOpen) return null;

  const scenarios: {
    title: string;
    type: ThreatAlert['type'];
    severity: ThreatAlert['severity'];
    country: string;
    countryCode: string;
    sourceIp: string;
    targetName: string;
    targetType: ThreatAlert['targetAsset']['type'];
    criticality: ThreatAlert['targetAsset']['criticality'];
    description: string;
    payload: string;
    action: string;
    playbookId: string;
  }[] = [
    {
      title: 'regreSSHion Signal Handler Race (CVE-2024-6387 RCE Exploit)',
      type: 'ZERO_DAY',
      severity: 'CRITICAL',
      country: 'France',
      countryCode: 'FR',
      sourceIp: '185.190.141.22',
      targetName: 'Edge DMZ Bastion Host 01',
      targetType: 'FIREWALL',
      criticality: 'MISSION_CRITICAL',
      description: 'Asynchronous SIGALRM signal race condition exploited in OpenSSH server 9.2p1 to gain unauthenticated root shell.',
      payload: 'SSH-2.0-regreSSHion_exploit_poc / stack alignment pivot payload targeting glibc syslog() malloc lock.',
      action: 'Apply immediate sshd LoginGraceTime 0 rule and invoke automated canary patch.',
      playbookId: 'PB-ZERO-DAY-CANARY',
    },
    {
      title: 'Distributed Ransomware Lateral Movement via WMI & SMB',
      type: 'RANSOMWARE',
      severity: 'CRITICAL',
      country: 'Russia',
      countryCode: 'RU',
      sourceIp: '94.102.61.15',
      targetName: 'Internal File Storage Cluster',
      targetType: 'APP_GATEWAY',
      criticality: 'HIGH',
      description: 'Batch encryption canary file tripped on network share. Lateral WMI commands attempting to stop Volume Shadow Copy service (vssadmin).',
      payload: 'powershell.exe -enc JABjAGgAZQBjAGsA... "vssadmin delete shadows /all /quiet"',
      action: 'Isolate storage subnet, kill unauthorized WMI processes, and restore immutable snapshots.',
      playbookId: 'PB-RANSOM-CONTAIN',
    },
    {
      title: 'HTTP/2 Rapid Reset Distributed DDoS Wave (CVE-2023-44487)',
      type: 'UNUSUAL_TRAFFIC',
      severity: 'HIGH',
      country: 'Netherlands',
      countryCode: 'NL',
      sourceIp: '45.154.255.80',
      targetName: 'Public Ingress Load Balancer Fleet',
      targetType: 'APP_GATEWAY',
      criticality: 'MISSION_CRITICAL',
      description: '520,000 requests/sec rapid stream reset attack attempting to exhaust CPU worker pools.',
      payload: 'HEADERS frame followed immediately by RST_STREAM frame over 20,000 multiplexed HTTP/2 streams.',
      action: 'Activate Layer-7 Adaptive Rate Limiting & push Cloudflare WAF signature block.',
      playbookId: 'PB-DDOS-RATE-LIMIT',
    },
    {
      title: 'Spear-Phishing QR Code (Quishing) Token Harvest',
      type: 'PHISHING',
      severity: 'MEDIUM',
      country: 'United Kingdom',
      countryCode: 'GB',
      sourceIp: '185.180.12.9',
      targetName: 'Corporate Email Gateway',
      targetType: 'APP_GATEWAY',
      criticality: 'MEDIUM',
      description: 'Image-embedded QR code directing mobile users to fake Microsoft 365 MFA proxy portal.',
      payload: 'OCR scanner extracted target redirect: "https://login-microsoftonline-verify.top/oauth/token"',
      action: 'Blacklist redirect domain across Secure Web Gateway and notify targeted users.',
      playbookId: 'PB-MAIL-PURGE',
    },
  ];

  const handleSelectScenario = (sc: typeof scenarios[0]) => {
    const newAlert: ThreatAlert = {
      id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      title: sc.title,
      type: sc.type,
      severity: sc.severity,
      confidence: Math.floor(90 + Math.random() * 9),
      timestamp: 'Just now',
      sourceIp: sc.sourceIp,
      sourceCountry: sc.country,
      sourceCountryCode: sc.countryCode,
      targetAsset: {
        id: `AST-${Math.floor(100 + Math.random() * 900)}`,
        name: sc.targetName,
        ip: `10.240.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
        type: sc.targetType,
        criticality: sc.criticality,
      },
      status: 'ACTIVE',
      mitreTactic: 'Execution / Initial Access',
      mitreTechnique: 'Exploit Public-Facing Application (T1190)',
      description: sc.description,
      payloadSummary: sc.payload,
      recommendedAction: sc.action,
      playbookId: sc.playbookId,
      requiresHumanApproval: sc.severity === 'CRITICAL',
    };

    onInjectThreat(newAlert);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#090e24] border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Adversary Attack Vector Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Test DarkWatch AI real-time anomaly detection, correlation & human-in-the-loop triage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenarios List */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-300 mb-2">
            Select a live cyber attack scenario to inject into the ingestion stream. Observe the threat map, metric gauges, and automated mitigation recommendation update in real time:
          </p>

          {scenarios.map((sc, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectScenario(sc)}
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-purple-950/30 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer group flex items-start justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    sc.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                    sc.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {sc.severity}
                  </span>
                  <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    {sc.title}
                  </h4>
                </div>

                <p className="text-xs text-slate-400 leading-snug">
                  {sc.description}
                </p>

                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 pt-1">
                  <span>Origin: <strong className="text-slate-300">{sc.country} ({sc.sourceIp})</strong></span>
                  <span>•</span>
                  <span>Target: <strong className="text-cyan-300">{sc.targetName}</strong></span>
                </div>
              </div>

              <button className="flex-shrink-0 mt-1 px-3 py-1.5 rounded-lg bg-red-600/20 group-hover:bg-red-600 group-hover:text-white text-red-300 border border-red-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm">
                <Play className="w-3.5 h-3.5" />
                <span>Inject</span>
              </button>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>DarkWatch AI Test Harness v2.4</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
