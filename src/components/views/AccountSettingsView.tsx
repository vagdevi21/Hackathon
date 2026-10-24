/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Account Settings Dedicated View
 * Includes Profile management and Change Account Password feature.
 */

import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Key, 
  Lock, 
  CheckCircle2, 
  RefreshCw, 
  LogOut, 
  Info,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { UserProfile, updateStoredUser, updateUserPassword } from '../../utils/auth-store';
import { UserRole } from '../../utils/security-engine';
import { cyberAudio } from '../../utils/cyber-audio';

interface AccountSettingsViewProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({
  currentUser,
  onLogout,
}) => {
  const [displayName, setDisplayName] = useState<string>(currentUser?.displayName || 'SecOps Lead');
  const [role, setRole] = useState<UserRole>(currentUser?.role || 'SECOPS_ADMIN');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = () => {
    if (currentUser) {
      updateStoredUser({
        ...currentUser,
        displayName,
        role,
      });
      setSavedSuccess(true);
      cyberAudio.playSuccess();
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      cyberAudio.playWarning();
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      cyberAudio.playWarning();
      return;
    }

    const identifier = currentUser?.accountIdentifier || currentUser?.username || 'analyst@darkwatch.corp';
    const success = updateUserPassword(identifier, newPassword);

    if (success) {
      setPasswordMsg({ type: 'success', text: 'Account password changed successfully! Your credentials have been synchronized.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      cyberAudio.playSuccess();
    } else {
      setPasswordMsg({ type: 'error', text: 'Failed to update password. Please try again.' });
      cyberAudio.playWarning();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <User className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Account Settings & Security Profile
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
              ACTIVE SESSION
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your authenticated analyst profile, operational access tier, and session credentials.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-xs font-mono font-bold transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Sign Out</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-emerald-300 text-xs font-mono animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Profile configuration saved successfully. Access policies synchronized.</span>
        </div>
      )}

      {/* Main Profile Form */}
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 space-y-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-white text-2xl border border-cyan-400/50 shadow-glow-cyan">
            {displayName ? displayName[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{displayName || 'Analyst'}</h3>
            <p className="text-xs font-mono text-cyan-400">{currentUser?.accountIdentifier || 'analyst@darkwatch.corp'}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-700">
              ID: {currentUser?.id || 'SEC-USER-01'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-800">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-400">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 outline-none font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-400">Assigned Role & RBAC Tier</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 outline-none font-mono cursor-pointer"
            >
              <option value="SECOPS_ADMIN">SECOPS_ADMIN (Full Threat & Patch Authority)</option>
              <option value="TIER2_ANALYST">TIER2_ANALYST (Triage & Mitigation Approval)</option>
              <option value="COMPLIANCE_OFFICER">COMPLIANCE_OFFICER (Governance & Audit Logs)</option>
              <option value="READ_ONLY_OPERATOR">READ_ONLY_OPERATOR (Telemetry Inspection Only)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveProfile}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-mono text-xs font-bold transition-all shadow-glow-cyan cursor-pointer"
          >
            Save Account Changes
          </button>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="cyber-card rounded-2xl p-6 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Change Account Password</h3>
            <p className="text-xs text-slate-400">Update your account authentication credentials and security password.</p>
          </div>
        </div>

        {passwordMsg && (
          <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center gap-2 animate-fadeIn ${
            passwordMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}>
            {passwordMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-400">Current Password</label>
              <div className="relative flex items-center">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password..."
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 text-slate-500 hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-400">New Password</label>
              <div className="relative flex items-center">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)..."
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 text-slate-500 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-400">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-glow-rose"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
