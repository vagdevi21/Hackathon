/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Application Header with Prominent Cyber Title, Interactive User Profile Dropdown & Navigation
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Sliders, 
  UserCheck, 
  Flame, 
  Bell, 
  Radio, 
  Zap,
  Layers,
  Link2,
  Sun,
  Moon,
  Laptop,
  History,
  Fingerprint,
  Camera,
  CreditCard,
  Lock,
  LogOut,
  User,
  Sparkles,
  Info,
  CheckCircle2,
  Terminal,
  Activity,
  X
} from 'lucide-react';
import { UserRole } from '../utils/security-engine';
import { CyberLogoIcon } from './CyberLogoIcon';
import { getScanHistory } from '../utils/scan-history-store';
import { UserProfile } from '../utils/auth-store';

export type AppTheme = 'dark' | 'light' | 'system';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  simulationMode: boolean;
  onToggleSimulationMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onOpenSimulateAttack: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unresolvedThreatCount: number;
  onOpenHistory?: () => void;
  onOpenLogin?: () => void;
  currentUser?: UserProfile | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  simulationMode,
  onToggleSimulationMode,
  soundEnabled,
  onToggleSound,
  theme,
  onThemeChange,
  onOpenSimulateAttack,
  activeTab,
  onSelectTab,
  unresolvedThreatCount,
  onOpenHistory,
  onOpenLogin,
  currentUser,
}) => {
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateCount = () => {
      setHistoryCount(getScanHistory().length);
    };
    updateCount();
    window.addEventListener('darkwatch_history_updated', updateCount);
    return () => window.removeEventListener('darkwatch_history_updated', updateCount);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'link-scanner', label: 'URL & Phone Scam Scanner', icon: Link2 },
    { id: 'triage', label: 'Threats & Triage', icon: ShieldAlert, badge: unresolvedThreatCount },
    { id: 'vulnerabilities', label: 'Vulnerability Radar', icon: Flame },
    { id: 'patches', label: 'Patch Automation', icon: Zap },
    { id: 'siem', label: 'SIEM Pipeline', icon: Radio },
    { id: 'playbooks', label: 'AI Incident Playbooks', icon: Sliders },
    { id: 'audit', label: 'Governance & Audit', icon: ShieldCheck },
  ];

  const getAuthBadge = (method?: string) => {
    switch (method) {
      case 'AADHAAR':
        return { label: 'Aadhaar UIDAI', icon: CreditCard, color: 'text-purple-400 bg-purple-950/80 border-purple-700/60' };
      case 'FINGERPRINT':
        return { label: 'Fingerprint Biometric', icon: Fingerprint, color: 'text-cyan-400 bg-cyan-950/80 border-cyan-700/60' };
      case 'IRIS':
        return { label: 'Iris Cam Scanner', icon: Camera, color: 'text-emerald-400 bg-emerald-950/80 border-emerald-700/60' };
      case 'PASSWORD':
        return { label: 'Password Credential', icon: Lock, color: 'text-pink-400 bg-pink-950/80 border-pink-700/60' };
      default:
        return { label: 'MFA Verified', icon: ShieldCheck, color: 'text-cyan-400 bg-cyan-950/80 border-cyan-700/60' };
    }
  };

  const authBadge = getAuthBadge(currentUser?.authMethod);
  const AuthIcon = authBadge.icon;

  const getRoleDisplayName = (r: UserRole) => {
    switch (r) {
      case 'SECOPS_ADMIN': return 'SecOps Admin (Level 4 Lead)';
      case 'TIER_2_ANALYST': return 'Tier 2 Incident Responder';
      case 'TIER_1_ANALYST': return 'Tier 1 Triage Analyst';
      case 'COMPLIANCE_OFFICER': return 'Security & Audit Officer';
    }
  };

  const getRolePurpose = (r: UserRole) => {
    switch (r) {
      case 'SECOPS_ADMIN': return 'Zero-Day Threat Interception, Emergency Patch Deployment & SOC Defense Authority';
      case 'TIER_2_ANALYST': return 'Adversary Payload Reverse Engineering & Automated Mitigation Playbooks';
      case 'TIER_1_ANALYST': return 'Real-time Telemetry Surveillance, Scam URL Inspection & Incident Escalation';
      case 'COMPLIANCE_OFFICER': return 'SOC2 Type II, ISO 27001, CERT-In & Zero-Trust Governance Auditing';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070b19]/95 backdrop-blur-xl border-b border-cyan-500/20">
      {/* Main Navigation & Action Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand / Logo with Prominent Bold Custom Cyber Gradient Title */}
        <div className="flex items-center gap-3.5">
          <CyberLogoIcon unresolvedThreatCount={unresolvedThreatCount} />

          <div className="cursor-pointer group" onClick={() => onSelectTab('dashboard')}>
            <div className="flex items-center gap-2">
              {/* Enhanced large brand title with high contrast cyber gradient */}
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md font-sans">
                <span className="text-white group-hover:text-cyan-200 transition-colors">Dark</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 font-extrabold tracking-wide">
                  Watch
                </span>
                <span className="ml-2 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 text-white text-base sm:text-lg font-mono font-black align-middle shadow-glow-cyan border border-cyan-300/40">
                  AI
                </span>
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-cyan-300 font-semibold tracking-wide flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-glow-emerald" />
              Smarter Security. Safer Tomorrow.
            </p>
          </div>
        </div>

        {/* Global Controls & Status Toggles */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Quick Attack Simulator Trigger */}
          <button
            onClick={onOpenSimulateAttack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-mono text-xs font-bold transition-all shadow-glow-rose cursor-pointer"
            title="Inject simulated adversary attack vector into live telemetry"
          >
            <Flame className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            <span className="hidden sm:inline">Simulate Threat</span>
          </button>

          {/* Simulation vs Live Mode Switch */}
          <button
            onClick={onToggleSimulationMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold font-mono transition-all cursor-pointer ${
              simulationMode
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-sm'
                : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm'
            }`}
            title="Toggle between dry-run simulation mode and live autonomous enforcement"
          >
            <span className={`w-2 h-2 rounded-full ${simulationMode ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
            <span className="hidden sm:inline">{simulationMode ? 'SIMULATION' : 'LIVE SOC'}</span>
          </button>

          {/* Scan & Search History Drawer Trigger */}
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold transition-all cursor-pointer shadow-glow-cyan"
              title="View saved searches and threat reports"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-600 text-white text-[10px]">
                  {historyCount}
                </span>
              )}
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-cyan-400'
                : 'bg-slate-900/50 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute alert sounds' : 'Enable cyber alert sounds'}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Mode Toggle (Dark / Light / System Adaptive) */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => onThemeChange('dark')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                theme === 'dark' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Dark Cyber Mode"
              aria-label="Switch to Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onThemeChange('light')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                theme === 'light' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Light Clean Mode"
              aria-label="Switch to Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onThemeChange('system')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                theme === 'system' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="System Screen Adaptive Mode"
              aria-label="Adaptive to System Screen Theme"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Profile Badge with Interactive Popover Information Card */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/40 to-cyan-950/60 border border-cyan-500/40 text-xs font-mono font-bold hover:border-cyan-400 transition-all cursor-pointer shadow-glow-cyan"
              title="Click to view User Profile, Session Purpose, or Re-Authenticate"
              aria-label="User Profile & Security Gateway"
            >
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300">
                <User className="w-3 h-3" />
              </div>
              <div className="text-left hidden md:block">
                <span className="text-white block text-[11px] leading-tight">
                  {currentUser?.displayName || 'Vagdevi'}
                </span>
                <span className="text-[9px] text-cyan-300 block font-normal">
                  {currentUser?.aadhaarNumber ? `UID: ${currentUser.aadhaarNumber.slice(-4)}` : 'Team Synora'}
                </span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[9px] border flex items-center gap-1 ${authBadge.color}`}>
                <AuthIcon className="w-2.5 h-2.5" />
                <span>{authBadge.label}</span>
              </span>
            </button>

            {/* Interactive User Information Card Dropdown Popover */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#090d22] border border-cyan-500/50 shadow-2xl shadow-cyan-950/80 p-4 z-50 animate-fadeIn text-slate-100">
                {/* Header bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-glow-cyan">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>{currentUser?.displayName || 'Vagdevi'}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </h4>
                      <span className="text-[10px] font-mono text-cyan-400 block">
                        Team Synora Cyber Defense
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowUserDropdown(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Profile Details List */}
                <div className="py-3 space-y-2.5 text-xs font-mono">
                  {/* Identity / Aadhaar */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                      Aadhaar / ID Card:
                    </span>
                    <span className="text-white font-bold">
                      •••• •••• {currentUser?.aadhaarNumber ? currentUser.aadhaarNumber.slice(-4) : '3456'}
                    </span>
                  </div>

                  {/* Role & Clearance */}
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        Designated SOC Role:
                      </span>
                      <span className="text-cyan-300 font-bold">
                        {getRoleDisplayName(currentRole)}
                      </span>
                    </div>
                  </div>

                  {/* Purpose / Mission (User request: ఏ పర్పస్ మీద ఓపెన్ చేశారు అనేది) */}
                  <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 space-y-1">
                    <span className="text-cyan-300 text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1">
                      <Activity className="w-3 h-3 text-cyan-400" />
                      Session Purpose & Operational Mission:
                    </span>
                    <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                      {getRolePurpose(currentRole)}
                    </p>
                  </div>

                  {/* Authentication Mode */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      Auth Verification:
                    </span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                      <AuthIcon className="w-3 h-3" />
                      {authBadge.label}
                    </span>
                  </div>

                  {/* Workstation Node */}
                  <div className="flex items-center justify-between px-1 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-slate-500" />
                      Workstation Node:
                    </span>
                    <span>SOC-NODE-01 • IP 10.240.12.8</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      if (onOpenLogin) onOpenLogin();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-mono text-xs font-bold transition-all shadow-glow-cyan text-center cursor-pointer"
                  >
                    Switch User / Re-Authenticate
                  </button>
                  <button
                    onClick={() => setShowUserDropdown(false)}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RBAC Role Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2 py-1">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer pr-1"
              title="Switch user role to test Role-Based Access Control (RBAC)"
            >
              <option value="SECOPS_ADMIN" className="bg-slate-900 text-purple-300">SecOps Admin</option>
              <option value="TIER_2_ANALYST" className="bg-slate-900 text-blue-300">Tier 2 Analyst</option>
              <option value="TIER_1_ANALYST" className="bg-slate-900 text-emerald-300">Tier 1 Analyst</option>
              <option value="COMPLIANCE_OFFICER" className="bg-slate-900 text-amber-300">Compliance Officer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 py-1 border-t border-slate-800/60">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-red-600 text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
