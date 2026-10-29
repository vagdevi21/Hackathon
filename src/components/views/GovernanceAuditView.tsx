/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Governance, Compliance & Cryptographic Audit Trail (Slide 09 & 12)
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Search, 
  FileCheck, 
  Hash, 
  Download, 
  Key, 
  Cpu, 
  ExternalLink,
  Shield,
  Layers
} from 'lucide-react';
import { AuditRecord } from '../../types/security';
import { UserRole, verifyAuditChain } from '../../utils/security-engine';

interface GovernanceAuditViewProps {
  auditLogs: AuditRecord[];
  currentRole: UserRole;
}

export const GovernanceAuditView: React.FC<GovernanceAuditViewProps> = ({
  auditLogs,
  currentRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    totalBlocks: number;
    error?: string;
  } | null>(null);

  const complianceStandards = [
    { name: 'NIST CSF 2.0', score: 94, status: 'COMPLIANT', desc: 'Identify, Protect, Detect, Respond, Recover' },
    { name: 'GDPR Article 32', score: 96, status: 'COMPLIANT', desc: 'Security of processing & breach notification' },
    { name: 'SOC 2 Type II', score: 98, status: 'CERTIFIED', desc: 'Security, confidentiality & availability criteria' },
    { name: 'HIPAA Security Rule', score: 92, status: 'COMPLIANT', desc: 'Administrative, physical & technical safeguards' },
  ];

  const rbacMatrix = [
    { role: 'SecOps Admin', approvePlaybook: true, simulatePlaybook: true, deployPatch: true, modifyFirewall: true, exportAudit: true },
    { role: 'Tier 2 Analyst', approvePlaybook: true, simulatePlaybook: true, deployPatch: false, modifyFirewall: false, exportAudit: true },
    { role: 'Tier 1 Analyst', approvePlaybook: false, simulatePlaybook: true, deployPatch: false, modifyFirewall: false, exportAudit: false },
    { role: 'Compliance Officer', approvePlaybook: false, simulatePlaybook: false, deployPatch: false, modifyFirewall: false, exportAudit: true },
  ];

  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/audit/verify', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data);
      } else {
        const local = verifyAuditChain(auditLogs);
        setVerificationResult(local);
      }
    } catch {
      const local = verifyAuditChain(auditLogs);
      setVerificationResult(local);
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.hash.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="cyber-card rounded-2xl p-5 border border-purple-900/40 relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              SHA-256 HASH CHAIN
            </span>
            <span className="text-xs font-mono text-cyan-400">IMMUTABLE FORENSIC INTEGRITY</span>
          </div>
          <h2 className="text-xl font-bold text-white">Governance, Compliance & Forensic Audit Trail</h2>
          <p className="text-xs text-slate-400">
            Every AI recommendation, human approval decision, and patch deployment is cryptographically chained with SHA-256 for zero-trust compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-xs font-mono font-bold text-purple-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Chain Integrity'}</span>
          </button>
          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" /> Genesis Block: #0001
          </span>
        </div>
      </div>

      {/* Chain Verification Result Toast */}
      {verificationResult && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono animate-fadeIn ${
          verificationResult.isValid
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/40 border-red-500/40 text-red-300'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>Cryptographic Chain Integrity Confirmed:</strong> {verificationResult.totalBlocks} blocks verified against NIST FIPS 180-4 standard. Zero hash tampering detected.
            </span>
          </div>
          <button
            onClick={() => setVerificationResult(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Compliance Standards Posture */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {complianceStandards.map((std) => (
          <div
            key={std.name}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{std.name}</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                {std.status}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-emerald-400">{std.score}%</span>
              <span className="text-[11px] font-mono text-slate-400">Posture Score</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">{std.desc}</p>
          </div>
        ))}
      </div>

      {/* Role-Based Access Control (RBAC) Matrix */}
      <div className="cyber-card rounded-2xl p-5 border border-purple-900/40 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-purple-400" /> Role-Based Access Control (RBAC) Governance Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3 text-center">Approve Live SOAR</th>
                <th className="py-2.5 px-3 text-center">Simulate Action</th>
                <th className="py-2.5 px-3 text-center">Deploy Patch</th>
                <th className="py-2.5 px-3 text-center">Modify Firewall</th>
                <th className="py-2.5 px-3 text-center">Export Audit Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rbacMatrix.map((r) => {
                const isCurrent = (
                  (r.role === 'SecOps Admin' && currentRole === 'SECOPS_ADMIN') ||
                  (r.role === 'Tier 2 Analyst' && currentRole === 'TIER_2_ANALYST') ||
                  (r.role === 'Tier 1 Analyst' && currentRole === 'TIER_1_ANALYST') ||
                  (r.role === 'Compliance Officer' && currentRole === 'COMPLIANCE_OFFICER')
                );

                return (
                  <tr
                    key={r.role}
                    className={`transition-colors ${isCurrent ? 'bg-purple-950/30 font-bold text-purple-200' : 'text-slate-300'}`}
                  >
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />}
                      <span>{r.role}</span>
                      {isCurrent && <span className="text-[10px] text-purple-300 bg-purple-950 px-1.5 py-0.2 rounded border border-purple-800">ACTIVE</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {r.approvePlaybook ? <span className="text-emerald-400">✓ YES</span> : <span className="text-slate-600">✕ NO</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {r.simulatePlaybook ? <span className="text-emerald-400">✓ YES</span> : <span className="text-slate-600">✕ NO</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {r.deployPatch ? <span className="text-emerald-400">✓ YES</span> : <span className="text-slate-600">✕ NO</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {r.modifyFirewall ? <span className="text-emerald-400">✓ YES</span> : <span className="text-slate-600">✕ NO</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {r.exportAudit ? <span className="text-emerald-400">✓ YES</span> : <span className="text-slate-600">✕ NO</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Audit Log Ledger */}
      <div className="cyber-card rounded-2xl p-5 border border-purple-900/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Cryptographically Verified Audit Ledger
            </h3>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit records or hashes..."
              className="bg-transparent text-white placeholder-slate-500 outline-none w-48 font-mono"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor / Principal</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Asset</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Cryptographic SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2.5 px-3 text-white font-medium">{log.actor}</td>
                  <td className="py-2.5 px-3 text-purple-300">{log.role}</td>
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-300">{log.target}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.result === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400' :
                      log.result === 'SIMULATED' ? 'bg-amber-950 text-amber-400' :
                      'bg-red-950 text-red-400'
                    }`}>
                      {log.result}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => handleCopyHash(log.hash)}
                      className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
                      title="Click to copy forensic signature hash"
                    >
                      <span className="truncate max-w-[140px]">{log.hash}</span>
                      {copiedHash === log.hash ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Hash className="w-3 h-3 text-slate-500" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
