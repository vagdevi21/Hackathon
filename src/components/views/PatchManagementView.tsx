/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Automated Patch Management & Staged Canary Rollout
 */

import React, { useState } from 'react';
import { 
  Zap, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Terminal, 
  ShieldCheck, 
  Clock, 
  RefreshCw,
  Server
} from 'lucide-react';
import { PatchDeployment } from '../../types/security';
import { UserRole, hasPermission, advancePatchStage, PatchStage } from '../../utils/security-engine';

interface PatchManagementViewProps {
  patchPipeline: PatchDeployment[];
  onUpdatePipeline: (pipeline: PatchDeployment[]) => void;
  currentRole: UserRole;
}

export const PatchManagementView: React.FC<PatchManagementViewProps> = ({
  patchPipeline,
  onUpdatePipeline,
  currentRole,
}) => {
  const [selectedPatchId, setSelectedPatchId] = useState<string>(patchPipeline[0]?.id || '');
  const canDeploy = hasPermission(currentRole, 'DEPLOY_PATCH');

  const selectedPatch = patchPipeline.find((p) => p.id === selectedPatchId) || patchPipeline[0];

  const handleAdvanceStage = (patchId: string, testPass: boolean) => {
    if (!canDeploy) return;

    const updated = patchPipeline.map((p) => {
      if (p.id === patchId) {
        const { nextStage, message } = advancePatchStage(p.currentStage, testPass);
        let progress = p.progressPercent;
        let updatedNodes = p.nodesUpdated;

        if (nextStage === 'CANARY_TEST') {
          progress = 30;
          updatedNodes = Math.max(1, Math.round(p.nodesTotal * 0.1));
        } else if (nextStage === 'STAGING_VERIFY') {
          progress = 65;
          updatedNodes = Math.round(p.nodesTotal * 0.5);
        } else if (nextStage === 'PRODUCTION_DEPLOYED') {
          progress = 100;
          updatedNodes = p.nodesTotal;
        } else if (nextStage === 'ROLLBACK') {
          progress = 0;
          updatedNodes = 0;
        }

        const newLog = `[${new Date().toISOString().substring(11, 19)} UTC] ${message}`;

        return {
          ...p,
          currentStage: nextStage,
          progressPercent: progress,
          nodesUpdated: updatedNodes,
          lastUpdated: 'Just now',
          logs: [newLog, ...p.logs],
        };
      }
      return p;
    });

    onUpdatePipeline(updated);
  };

  const stageSteps: { stage: PatchStage; label: string; desc: string }[] = [
    { stage: 'PENDING', label: '1. Staging Audit', desc: 'Pre-flight checksum verification' },
    { stage: 'CANARY_TEST', label: '2. Canary Rollout (10%)', desc: 'Isolated test nodes & latency check' },
    { stage: 'STAGING_VERIFY', label: '3. Cluster Verification', desc: 'Synthetic fuzzing & zero-downtime test' },
    { stage: 'PRODUCTION_DEPLOYED', label: '4. Production Fleet', desc: 'Fleet-wide live rollout complete' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="cyber-card rounded-2xl p-5 border border-purple-900/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              ZERO-DOWNTIME CI/CD DEFENSE
            </span>
            <span className="text-xs font-mono text-emerald-400">AUTO-ROLLBACK SAFEGUARD ARMED</span>
          </div>
          <h2 className="text-xl font-bold text-white">Automated Patch Management & Fleet Staging</h2>
          <p className="text-xs text-slate-400">
            Autonomous hotfix orchestration with canary telemetry, instant regression rollback, and cryptographic validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-800/40 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" /> Fleet Health: 99.6%
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Patch Pipelines List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" /> Active Patch Rollouts ({patchPipeline.length})
          </h3>

          {patchPipeline.map((patch) => {
            const isSelected = selectedPatch?.id === patch.id;
            return (
              <div
                key={patch.id}
                onClick={() => setSelectedPatchId(patch.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-purple-500 ring-1 ring-purple-500/40 bg-slate-900/90 shadow-glow-purple'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold text-cyan-300">{patch.cveId}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    patch.currentStage === 'PRODUCTION_DEPLOYED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    patch.currentStage === 'ROLLBACK' ? 'bg-red-950 text-red-400 border border-red-800' :
                    'bg-purple-950 text-purple-300 border border-purple-800'
                  }`}>
                    {patch.currentStage}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-white mb-2">{patch.packageName}</h4>

                {/* Progress bar */}
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Rollout Progress:</span>
                    <strong className="text-white">{patch.progressPercent}% ({patch.nodesUpdated}/{patch.nodesTotal} nodes)</strong>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${patch.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Target: {patch.targetFleet}</span>
                  <span>Updated: {patch.lastUpdated}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Patch Deep Staging Pipeline & Actions (7 cols) */}
        {selectedPatch && (
          <div className="lg:col-span-7 cyber-card rounded-2xl p-5 border border-purple-900/40 space-y-6">
            <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-purple-400">{selectedPatch.id} • {selectedPatch.cveId}</span>
                <h3 className="text-base font-bold text-white">{selectedPatch.packageName} (v{selectedPatch.version})</h3>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-slate-400 block">Health Check</span>
                <span className="text-emerald-400 font-bold">{selectedPatch.healthScore}% PASS</span>
              </div>
            </div>

            {/* Visual Staged Pipeline Steps */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Automated Deployment Progression
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {stageSteps.map((s, idx) => {
                  const stageIndex = stageSteps.findIndex(st => st.stage === selectedPatch.currentStage);
                  const isCurrent = selectedPatch.currentStage === s.stage;
                  const isPassed = stageIndex > idx || selectedPatch.currentStage === 'PRODUCTION_DEPLOYED';

                  return (
                    <div
                      key={s.stage}
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-purple-950/40 border-purple-500 shadow-glow-purple text-white'
                          : isPassed
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-300'
                          : 'bg-slate-900/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold font-mono">{s.label}</span>
                        {isPassed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-400">{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pipeline Controls & Rollback Trigger */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Pipeline Execution Controls</span>
                <span className="font-mono text-slate-400">Role: <strong className="text-purple-300">{currentRole}</strong></span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleAdvanceStage(selectedPatch.id, true)}
                  disabled={!canDeploy || selectedPatch.currentStage === 'PRODUCTION_DEPLOYED'}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-glow-purple flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {selectedPatch.currentStage === 'PRODUCTION_DEPLOYED'
                      ? 'Fleet Rollout Verified'
                      : 'Advance Next Canary Stage'}
                  </span>
                </button>

                <button
                  onClick={() => handleAdvanceStage(selectedPatch.id, false)}
                  disabled={!canDeploy}
                  className="py-2.5 px-4 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/60 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  title="Simulate health check failure to demonstrate autonomous instant rollback"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                  <span>Test Auto-Rollback</span>
                </button>
              </div>

              {!canDeploy && (
                <p className="text-[11px] text-center text-amber-400/80 font-mono">
                  ⚠️ Patch execution requires SecOps Admin role permissions.
                </p>
              )}
            </div>

            {/* Real-time Staging Console Logs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Deployment Audit Telemetry
                </h4>
                <span className="text-[10px] font-mono text-slate-500">Live Agent Stream</span>
              </div>
              <div className="p-3 bg-black/80 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400/90 max-h-40 overflow-y-auto space-y-1">
                {selectedPatch.logs.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
