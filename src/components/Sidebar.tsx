/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Collapsible Left Navigation Sidebar
 * 
 * Strict Structure:
 * - MAIN: Dashboard, URL & Phone Scam Scanner, Phone Number Analysis, Scan History
 * - THREAT INTELLIGENCE: Global Attack Map, Threat Density Heatmap, Threats & Triage, Threat Distribution, Threat Trends & Analytics
 * - ADVANCED SECURITY: Predictive Threat Forecasting, Network Health & Topology, Live Threat Anomaly Feed, Vulnerability Radar, Patch Automation, SIEM Pipeline
 * - SETTINGS: Security Settings, Account Settings, Logout
 */

import React from 'react';
import { 
  Layers, 
  Link2, 
  Phone, 
  History, 
  Globe, 
  Flame, 
  ShieldAlert, 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Radio, 
  Zap, 
  Lock, 
  User, 
  Presentation,
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { CyberLogoIcon } from './CyberLogoIcon';
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
  onOpenSecuritySettings?: () => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  highlight?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
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
  onOpenPitchDeck,
  currentUser,
  onLogout,
}) => {
  const navGroups: NavGroup[] = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Layers },
        { id: 'link-scanner', label: 'URL & Phone Scam Scanner', icon: Link2 },
        { id: 'phone-analysis', label: 'Phone Number Analysis', icon: Phone },
        { id: 'scan-history', label: 'Scan History', icon: History },
      ],
    },
    {
      title: 'THREAT INTELLIGENCE',
      items: [
        { id: 'attack-map', label: 'Global Attack Map', icon: Globe },
        { id: 'threat-heatmap', label: 'Threat Density Heatmap', icon: Flame },
        { id: 'triage', label: 'Threats & Triage', icon: ShieldAlert, badge: unresolvedThreatCount },
        { id: 'threat-distribution', label: 'Threat Distribution', icon: PieChart },
        { id: 'threat-trends', label: 'Threat Trends & Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'ADVANCED SECURITY',
      items: [
        { id: 'forecasting', label: 'Predictive Threat Forecasting', icon: TrendingUp },
        { id: 'network-topology', label: 'Network Health & Topology', icon: Activity },
        { id: 'threat-feed', label: 'Live Threat Anomaly Feed', icon: Radio },
        { id: 'vulnerabilities', label: 'Vulnerability Radar', icon: Flame },
        { id: 'patches', label: 'Patch Automation', icon: Zap },
        { id: 'siem', label: 'SIEM Pipeline', icon: Layers },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        { id: 'account-settings', label: 'Account Settings', icon: User },
        { id: 'pitch-deck', label: 'Pitch Deck & Architecture', icon: Presentation },
      ],
    },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'pitch-deck') {
      onOpenPitchDeck();
    } else {
      onSelectTab(id);
    }
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

      {/* Sidebar Aside Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#060a1c] border-r border-cyan-500/20 text-slate-200 transition-all duration-300 flex flex-col justify-between shadow-2xl ${
          // Desktop sizing
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        } ${
          // Mobile drawer
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header Branding with Creative Fingerprint+Shield SVG */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-2 h-16 bg-[#040714]">
          <div 
            onClick={() => handleNavClick('dashboard')}
            className={`flex items-center gap-3 cursor-pointer overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}
            title="DarkWatch AI Dashboard"
          >
            <CyberLogoIcon size={34} />
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-lg font-serif font-extrabold tracking-tight flex items-center leading-none">
                  <span className="brand-name">DarkWatch</span>
                  <span className="ai-label">AI</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-300/80 block mt-0.5 truncate">
                  Cyber Early Warning
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
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
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-none">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        isCollapsed ? 'absolute -top-1 -right-1 bg-cyan-600 text-white' : 'ml-auto bg-cyan-600/90 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Quick Controls Strip in non-collapsed or compact icons */}
          <div className="pt-3 border-t border-slate-800/80 space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                System Controls
              </div>
            )}
            
            {/* Live SOC / Simulation Mode Toggle */}
            <button
              onClick={onToggleSimulationMode}
              title={isCollapsed ? (simulationMode ? 'Mode: Simulation' : 'Mode: Live SOC') : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                simulationMode 
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40' 
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full ${simulationMode ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse flex-shrink-0`} />
              {!isCollapsed && <span>{simulationMode ? 'SIMULATION MODE' : 'LIVE SOC TELEMETRY'}</span>}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={isCollapsed ? (soundEnabled ? 'Audio alerts active' : 'Audio muted') : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              )}
              {!isCollapsed && <span>{soundEnabled ? 'Audio Alerts: ON' : 'Audio: Muted'}</span>}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={handleCycleTheme}
              title={isCollapsed ? `Theme: ${theme.toUpperCase()}` : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              {theme === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              ) : theme === 'light' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              ) : (
                <Laptop className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              )}
              {!isCollapsed && <span className="capitalize">Theme: {theme}</span>}
            </button>
          </div>
        </div>

        {/* Section: Account & Logout Footer */}
        <div className="p-3 border-t border-slate-800/90 bg-[#040714] space-y-2">
          {!isCollapsed && currentUser && (
            <div 
              onClick={() => handleNavClick('account-settings')}
              className="px-2 py-1.5 flex items-center gap-2.5 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
              title="View Account Settings"
            >
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
