/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - AI Incident Response Playbooks & Human-in-the-Loop Hub (Slide 09)
 */

import React, { useState } from 'react';
import { 
  Sliders, 
  Play, 
  CheckCircle2, 
  Bot, 
  ShieldAlert, 
  Clock, 
  ArrowRight, 
  FileText, 
  Sparkles,
  Terminal,
  Lock,
  Layers
} from 'lucide-react';
import { PLAYBOOKS } from '../../data/mock-security-data';
import { ResponsePlaybook } from '../../types/security';
import { UserRole, hasPermission } from '../../utils/security-engine';

interface AiPlaybooksViewProps {
  currentRole: UserRole;
  simulationMode: boolean;
  onExecutePlaybookLog: (name: string, isSimulation: boolean) => void;
}

export const AiPlaybooksView: React.FC<AiPlaybooksViewProps> = ({
  currentRole,
  simulationMode,
  onExecutePlaybookLog,
}) => {
  const [selectedPlaybook, setSelectedPlaybook] = useState<ResponsePlaybook>(PLAYBOOKS[0]);
  const [runningStepIndex, setRunningStepIndex] = useState<number | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  const canApprove = hasPermission(currentRole, 'APPROVE_PLAYBOOK');
  const canSimulate = hasPermission(currentRole, 'SIMULATE_PLAYBOOK');

  const handleRunPlaybook = (isSim: boolean) => {
    if (isSim && !canSimulate) return;
    if (!isSim && !canApprove) return;

    setRunningStepIndex(0);
    setExecutionMessage(`Initializing ${selectedPlaybook.name} (${isSim ? 'SIMULATION' : 'LIVE'})...`);

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current < selectedPlaybook.steps.length) {
        setRunningStepIndex(current);
        setExecutionMessage(`[Step ${current + 1}/${selectedPlaybook.steps.length}] Executing: ${selectedPlaybook.steps[current]}`);
      } else {
        clearInterval(interval);
        setRunningStepIndex(null);
        setExecutionMessage(
          isSim
            ? `Simulation completed successfully. Zero false-positive disruption predicted.`
            : `Live playbook execution completed across all nodes. Threat neutralized.`
        );
        onExecutePlaybookLog(selectedPlaybook.name, isSim);
      }
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner matching Slide 09 */}
      <div className="cyber-card rounded-2xl p-5 border border-purple-900/40 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                09 • RESPONSE & GOVERNANCE
              </span>
              <span className="text-xs font-mono text-cyan-400">HUMAN-IN-THE-LOOP SOAR</span>
            </div>
            <h2 className="text-xl font-bold text-white">Controlled Response & Autonomous Playbooks</h2>
            <p className="text-xs text-slate-400">
              From detection to action — DarkWatch AI recommends the optimal mitigation with mandatory human sign-off for critical assets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 98.8% Autonomous Accuracy
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Playbook Catalog & Live Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Playbook List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-purple-400" /> Predefined SOAR Playbooks ({PLAYBOOKS.length})
          </h3>

          {PLAYBOOKS.map((pb) => {
            const isSelected = selectedPlaybook.id === pb.id;
            return (
              <div
                key={pb.id}
                onClick={() => setSelectedPlaybook(pb)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-purple-500 ring-1 ring-purple-500/40 bg-slate-900/90 shadow-glow-purple'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold text-purple-300">{pb.id}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    pb.automatedSafe ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {pb.automatedSafe ? 'Autonomous Safe' : 'Approval Required'}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-white mb-1">{pb.name}</h4>
                <p className="text-xs text-slate-300 line-clamp-2 mb-2">{pb.description}</p>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Steps: {pb.steps.length}</span>
                  <span>Est: ~{pb.estimatedExecutionSeconds}s</span>
                  <span className="text-emerald-400 font-semibold">{pb.successRatePercent}% success</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Playbook Step-by-Step Inspector & Interactive Runner (7 cols) */}
        <div className="lg:col-span-7 cyber-card rounded-2xl p-5 border border-purple-900/40 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono font-bold text-purple-400">{selectedPlaybook.id} • {selectedPlaybook.category}</span>
              <h3 className="text-base font-bold text-white">{selectedPlaybook.name}</h3>
            </div>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/40">
              Avg SLA: {selectedPlaybook.estimatedExecutionSeconds}s
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            {selectedPlaybook.description}
          </p>

          {/* Steps List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" /> Sequential Execution Steps
            </h4>

            <div className="space-y-2">
              {selectedPlaybook.steps.map((step, idx) => {
                const isStepRunning = runningStepIndex === idx;
                const isStepFinished = runningStepIndex !== null && runningStepIndex > idx;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isStepRunning
                        ? 'bg-purple-950/40 border-purple-500 shadow-glow-purple text-white animate-pulse'
                        : isStepFinished
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-xs flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-medium leading-relaxed">{step}</p>
                    </div>
                    {isStepFinished && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Trigger Controls */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Execution Authorization</span>
              <span className="font-mono text-slate-400">Current Role: <strong className="text-purple-300">{currentRole}</strong></span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleRunPlaybook(true)}
                disabled={!canSimulate || runningStepIndex !== null}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Execution (Dry Run)</span>
              </button>

              <button
                onClick={() => handleRunPlaybook(false)}
                disabled={!canApprove || runningStepIndex !== null}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-mono shadow-glow-purple transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Approve & Execute Live</span>
              </button>
            </div>

            {!canApprove && (
              <p className="text-[11px] text-center text-amber-400/80 font-mono">
                ⚠️ Live approval requires SecOps Admin role. (Switch role in top bar).
              </p>
            )}

            {executionMessage && (
              <div className="p-3 bg-black/80 rounded-lg border border-purple-500/40 text-xs font-mono text-emerald-300 animate-fadeIn flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>{executionMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
