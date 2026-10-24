/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Security & Zero-Trust Posture Settings Modal
 */

import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Terminal, 
  CheckCircle2, 
  Cpu, 
  Fingerprint, 
  Globe, 
  Database 
} from 'lucide-react';
import { UserProfile, getAuthMethodLabel, formatLoginTimestamp } from '../utils/auth-store';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn select-none">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#080d24] border border-cyan-500/40 rounded-3xl shadow-2xl p-6 text-slate-100 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-glow-cyan">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Security & Zero-Trust Posture</h3>
              <p className="text-xs text-slate-400">Cryptographic hardware binding & active session telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Session Token Cryptography:
              </span>
              <span className="text-cyan-300 font-bold">AES-256-GCM / Ephemeral Key</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                Active Authentication Mode:
              </span>
              <span className="text-purple-300 font-bold">
                {currentUser ? getAuthMethodLabel(currentUser.authMethod) : 'Passkey WebAuthn'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Audit Trail Immutability:
              </span>
              <span className="text-emerald-400 font-bold">SHA-256 Chained Hashes</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2 text-[11px]">
            <span className="text-cyan-300 font-bold uppercase tracking-wider block">
              Zero-Trust Privacy & Biometric Architecture:
            </span>
            <p className="text-slate-300 leading-relaxed font-normal">
              DarkWatch AI strictly enforces client-side enclave verification. No raw biometrics, fingerprint images, ocular templates, or unhashed passwords are ever logged or transmitted across the wire.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Current Session ID:</span>
              <span className="text-white font-mono">{currentUser?.id || 'USR-8921'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Previous Verified Login:</span>
              <span className="text-white font-mono">{formatLoginTimestamp(currentUser?.previousLogin)}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
