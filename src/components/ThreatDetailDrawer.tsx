/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Threat Detail & Incident Response Drawer (Slide 05 & 09)
 */

import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Bot, 
  CheckCircle, 
  AlertTriangle, 
  Radio, 
  Terminal, 
  ArrowRight, 
  Cpu, 
  Play, 
  Lock, 
  FileText, 
  Share2,
  Sparkles
} from 'lucide-react';
import { ThreatAlert } from '../types/security';
import { UserRole, hasPermission } from '../utils/security-engine';
import { analyzeThreatWithAI, AIAnalysisResult } from '../services/ai-agent';

interface ThreatDetailDrawerProps {
  alert: ThreatAlert | null;
  onClose: () => void;
  currentRole: UserRole;
  simulationMode: boolean;
  onSimulateMitigation: (alertId: string) => void;
  onApproveMitigation: (alertId: string) => void;
}

export const ThreatDetailDrawer: React.FC<ThreatDetailDrawerProps> = ({
  alert,
  onClose,
  currentRole,
  simulationMode,
  onSimulateMitigation,
  onApproveMitigation,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  if (!alert) return null;

  const canApprove = hasPermission(currentRole, 'APPROVE_PLAYBOOK');
  const canSimulate = hasPermission(currentRole, 'SIMULATE_PLAYBOOK');

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeThreatWithAI(alert);
      setAiResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const severityBadge = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/40',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/40',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/40',
  }[alert.severity];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#090e24] border-l border-purple-900/50 h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${severityBadge}`}>
              {alert.severity}
            </span>
            <span className="font-mono text-xs text-slate-400 font-bold">{alert.id}</span>
            <span className="text-xs text-slate-500">• {alert.timestamp}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Title & Status */}
          <div>
            <h2 className="text-lg font-bold text-white mb-2 leading-snug">{alert.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Type: {alert.type}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                AI Confidence: {alert.confidence}%
              </span>
              <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                alert.status === 'MITIGATED' ? 'bg-emerald-950 text-emerald-400' :
                alert.status === 'SIMULATED' ? 'bg-amber-950 text-amber-400' :
                'bg-red-950 text-red-400 animate-pulse'
              }`}>
                Status: {alert.status}
              </span>
            </div>
          </div>

          {/* Telemetry Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">Adversary Source</span>
              <p className="text-xs font-bold text-white mt-0.5 font-mono">
                {alert.sourceIp} ({alert.sourceCountry})
              </p>
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">Target Asset</span>
              <p className="text-xs font-bold text-white mt-0.5">
                {alert.targetAsset.name}
              </p>
              <p className="text-[10px] font-mono text-slate-400">{alert.targetAsset.ip} • {alert.targetAsset.criticality}</p>
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">MITRE ATT&CK Tactic</span>
              <p className="text-xs font-semibold text-purple-300 mt-0.5">{alert.mitreTactic}</p>
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">MITRE ATT&CK Technique</span>
              <p className="text-xs font-semibold text-cyan-300 mt-0.5">{alert.mitreTechnique}</p>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" /> Forensic Incident Description
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
              {alert.description}
            </p>
          </div>

          {/* Raw Payload Inspection */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Intercepted Network Payload
            </h4>
            <pre className="text-[11px] font-mono text-emerald-300 bg-black/70 p-3 rounded-lg border border-slate-800 overflow-x-auto whitespace-pre-wrap">
              {alert.payloadSummary}
            </pre>
          </div>

          {/* AI Explainable Reasoning Section (Slide 07 & 09) */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  DarkWatch Explainable AI Analysis
                </h4>
              </div>
              <button
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzing}
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>{isAnalyzing ? 'Correlating...' : 'Trigger AI Deep Scan'}</span>
              </button>
            </div>

            {aiResult ? (
              <div className="space-y-3 text-xs animate-fadeIn">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-1">Plain-Language Root Cause:</span>
                  <p className="text-slate-300 leading-relaxed">{aiResult.summary}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="font-bold text-red-400 block mb-1">Blast Radius Impact:</span>
                  <p className="text-slate-300 leading-relaxed">{aiResult.blastRadius}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1">Simulation Hypothesis (Zero-Downtime Check):</span>
                  <p className="text-slate-300 leading-relaxed">{aiResult.simulationHypothesis}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Click &quot;Trigger AI Deep Scan&quot; to invoke DarkWatch AI reasoning for multi-vector correlation and root-cause explainability.
              </p>
            )}
          </div>

          {/* Recommended Action & Playbook */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <span className="text-[11px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Recommended Remediation Playbook
            </span>
            <p className="text-xs text-white font-medium">{alert.recommendedAction}</p>
            <div className="text-[11px] text-slate-400 font-mono">
              Associated SOAR Playbook: <span className="text-purple-300 font-bold">{alert.playbookId}</span>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions (Slide 09 - Human in the loop) */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/90 sticky bottom-0 z-10 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current Role: <strong className="text-white">{currentRole}</strong></span>
            <span>Approval Required: <strong className="text-amber-300">{alert.requiresHumanApproval ? 'YES (Human-in-Loop)' : 'NO (Autonomous Safe)'}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Simulation Mode Button */}
            <button
              onClick={() => onSimulateMitigation(alert.id)}
              disabled={!canSimulate}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Mitigation</span>
            </button>

            {/* Live Approval Button */}
            <button
              onClick={() => onApproveMitigation(alert.id)}
              disabled={!canApprove || alert.status === 'MITIGATED'}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-glow-purple flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{alert.status === 'MITIGATED' ? 'Already Mitigated' : 'Approve & Execute (Live)'}</span>
            </button>
          </div>

          {!canApprove && (
            <p className="text-[11px] text-center text-amber-400/80 font-mono">
              ⚠️ Live approval restricted to SecOps Admin. (Switch role in header to test admin approval).
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
