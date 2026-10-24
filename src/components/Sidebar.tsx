/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Collapsible Left Navigation Sidebar
 * Contains:
 * - Main Navigation: Dashboard, URL & Phone Scam Scanner, Threats & Triage, Vulnerability Radar, Patch Automation, SIEM Pipeline
 * - Security Tools: Simulate Threat, Live SOC, History
 * - Preferences: Sound Settings, Appearance/Theme, Security Settings, Help & Support
 * - Account: User Profile, Account Settings, Logout
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Link2, 
  ShieldAlert, 
  Flame, 
  Zap, 
  Radio, 
  Sliders, 
  ShieldCheck, 
  Activity, 
  History, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Laptop, 
  User, 
  Settings, 
  LogOut, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X,
  Sparkles,
  Lock,
  Presentation
} from 'lucide-react';
import { CyberLogoIcon } from './CyberLogoIcon';
import { UserRole } from '../utils/security-engine';
import { UserProfile } from '../utils/auth-store';
import { AppTheme } from './Header';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  unresolvedThreatCount: number;
  historyCount: number;
  simulationMode: boolean;
  onToggleSimulationMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onOpenSimulateAttack: () => void;
  onOpenHistory: () => void;
  onOpenPitchDeck: () => void;
  onOpenSecuritySettings: () => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  unresolvedThreatCount,
  historyCount,
  simulationMode,
  onToggleSimulationMode,
  soundEnabled,
  onToggleSound,
  theme,
  onThemeChange,
  onOpenSimulateAttack,
  onOpenHistory,
  onOpenPitchDeck,
  onOpenSecuritySettings,
  currentUser,
  onLogout,
}) => {
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'link-scanner', label: 'URL & Phone Scam Scanner', icon: Link2 },
    { id: 'triage', label: 'Threats & Triage', icon: ShieldAlert, badge: unresolvedThreatCount },
    { id: 'vulnerabilities', label: 'Vulnerability Radar', icon: Flame },
    { id: 'patches', label: 'Patch Automation', icon: Zap },
    { id: 'siem', label: 'SIEM Pipeline', icon: Radio },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const handleCycleTheme = () => {
    if (theme === 'dark') onThemeChange('light');
    else if (theme === 'light') onThemeChange('system');
    else onThemeChange('dark');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Aside Element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#060a1c] border-r border-cyan-500/20 text-slate-200 transition-all duration-300 flex flex-col justify-between shadow-2xl ${
          // Desktop sizing
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        } ${
          // Mobile drawer
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding & Expand/Collapse Toggle */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-2 h-16 bg-[#040714]">
          <div 
            onClick={() => handleNavClick('dashboard')}
            className={`flex items-center gap-3 cursor-pointer overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}
            title="DarkWatch AI Dashboard"
          >
            <CyberLogoIcon size={34} />
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-lg font-black tracking-tight text-white block leading-none">
                  Dark<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Watch</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                    AI
                  </span>
                </span>
                <span className="text-[10px] font-mono text-cyan-300/80 block mt-0.5 truncate">
                  Early Warning SOC
                </span>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Mobile Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
          
          {/* Section 1: Main Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Main Navigation
              </div>
            )}
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isCollapsed ? 'absolute -top-1 -right-1 bg-red-600 text-white' : 'ml-auto bg-red-600/90 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Section 2: Security Tools */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Security Tools
              </div>
            )}

            {/* Simulate Threat Trigger */}
            <button
              onClick={() => {
                onOpenSimulateAttack();
                if (isMobileOpen) onCloseMobile();
              }}
              title={isCollapsed ? 'Simulate Threat' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-300 hover:text-red-200 hover:bg-red-950/30 border border-red-900/40 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <Flame className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
              {!isCollapsed && <span>Simulate Threat</span>}
            </button>

            {/* Live SOC Toggle */}
            <button
              onClick={onToggleSimulationMode}
              title={isCollapsed ? (simulationMode ? 'Mode: Simulation' : 'Mode: Live SOC') : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                simulationMode 
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40' 
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${simulationMode ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse flex-shrink-0`} />
              {!isCollapsed && (
                <span className="truncate font-mono">
                  {simulationMode ? 'SIMULATION' : 'LIVE SOC'}
                </span>
              )}
            </button>

            {/* Forensics History */}
            <button
              onClick={() => {
                onOpenHistory();
                if (isMobileOpen) onCloseMobile();
              }}
              title={isCollapsed ? 'Search History' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-cyan-300 hover:bg-cyan-950/30 border border-cyan-900/40 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <History className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              {!isCollapsed && <span>Search History</span>}
              {!isCollapsed && historyCount > 0 && (
                <span className="ml-auto px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50 text-[10px] font-mono">
                  {historyCount}
                </span>
              )}
            </button>
          </div>

          {/* Section 3: Preferences */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Preferences
              </div>
            )}

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={isCollapsed ? (soundEnabled ? 'Alert Sounds Active' : 'Sound Muted') : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500 flex-shrink-0" />
              )}
              {!isCollapsed && <span>{soundEnabled ? 'Sound Effects: On' : 'Sound: Muted'}</span>}
            </button>

            {/* Appearance / Theme Cycle */}
            <button
              onClick={handleCycleTheme}
              title={isCollapsed ? `Theme: ${theme.toUpperCase()}` : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              ) : theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-400 flex-shrink-0" />
              ) : (
                <Laptop className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              )}
              {!isCollapsed && (
                <span className="capitalize">Theme: {theme}</span>
              )}
            </button>

            {/* Security Policy Settings */}
            <button
              onClick={() => {
                onOpenSecuritySettings();
                if (isMobileOpen) onCloseMobile();
              }}
              title={isCollapsed ? 'Security Settings' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <Lock className="w-4 h-4 text-purple-400 flex-shrink-0" />
              {!isCollapsed && <span>Security Settings</span>}
            </button>

            {/* Help & Support / Pitch Deck */}
            <button
              onClick={() => {
                onOpenPitchDeck();
                if (isMobileOpen) onCloseMobile();
              }}
              title={isCollapsed ? 'Pitch Deck & Architecture' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <Presentation className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              {!isCollapsed && <span>Pitch Deck & Docs</span>}
            </button>
          </div>
        </div>

        {/* Section 4: Account & Logout Footer */}
        <div className="p-3 border-t border-slate-800/90 bg-[#040714] space-y-2">
          {!isCollapsed && currentUser && (
            <div className="px-2 py-1 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs border border-cyan-400/50 shadow-glow-cyan flex-shrink-0">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 block truncate">
                  {currentUser.role}
                </span>
              </div>
            </div>
          )}

          {/* Logout Action */}
          <button
            onClick={onLogout}
            title={isCollapsed ? 'Sign Out of DarkWatch AI' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold text-red-400 hover:text-white hover:bg-red-950/60 border border-red-900/30 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-red-400" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
