/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Minimal, Elegant Top Application Header
 * Contains:
 * - Left: Hamburger sidebar toggle + brand icon + compact title
 * - Center: Current Page Breadcrumb / Status Title
 * - Right: Notification Bell + Circular User Avatar (38-42px) with Profile Dropdown
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Bell, 
  ChevronDown, 
  Sliders, 
  LogOut, 
  Sun, 
  Moon, 
  Laptop, 
  HelpCircle, 
  User, 
  CheckCircle2,
  ExternalLink,
  Presentation
} from 'lucide-react';
import { CyberLogoIcon } from './CyberLogoIcon';
import { UserProfile } from '../utils/auth-store';

export type AppTheme = 'dark' | 'light' | 'system';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  activeTab: string;
  currentUser: UserProfile | null;
  unresolvedThreatCount: number;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onLogout: () => void;
  onOpenSecuritySettings?: () => void;
  onOpenPitchDeck: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  activeTab,
  currentUser,
  unresolvedThreatCount,
  theme,
  onThemeChange,
  onLogout,
  onOpenPitchDeck,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return { section: 'MAIN', title: 'Live Threat Dashboard' };
      case 'link-scanner':
        return { section: 'MAIN', title: 'URL & Phone Scam Scanner' };
      case 'phone-analysis':
        return { section: 'MAIN', title: 'Phone Number Analysis' };
      case 'scan-history':
        return { section: 'MAIN', title: 'Scan History & Investigations' };
      case 'attack-map':
        return { section: 'THREAT INTELLIGENCE', title: 'Global Attack Map' };
      case 'threat-heatmap':
        return { section: 'THREAT INTELLIGENCE', title: 'Threat Density Heatmap' };
      case 'triage':
        return { section: 'THREAT INTELLIGENCE', title: 'Threats & Triage Queue' };
      case 'threat-distribution':
        return { section: 'THREAT INTELLIGENCE', title: 'Threat Distribution' };
      case 'threat-trends':
        return { section: 'THREAT INTELLIGENCE', title: 'Threat Trends & Analytics' };
      case 'forecasting':
        return { section: 'ADVANCED SECURITY', title: 'Predictive Threat Forecasting' };
      case 'network-topology':
        return { section: 'ADVANCED SECURITY', title: 'Network Health & Topology' };
      case 'threat-feed':
        return { section: 'ADVANCED SECURITY', title: 'Live Threat Anomaly Feed' };
      case 'vulnerabilities':
        return { section: 'ADVANCED SECURITY', title: 'Vulnerability Radar & CVEs' };
      case 'patches':
        return { section: 'ADVANCED SECURITY', title: 'Patch Automation Pipeline' };
      case 'siem':
        return { section: 'ADVANCED SECURITY', title: 'SIEM Pipeline & Ingestion' };
      case 'account-settings':
        return { section: 'SETTINGS', title: 'Account Settings & Profile' };
      case 'security-settings':
        return { section: 'SETTINGS', title: 'Security Settings' };
      case 'playbooks':
        return { section: 'ORCHESTRATION', title: 'AI Incident Playbooks' };
      case 'audit':
        return { section: 'COMPLIANCE', title: 'Governance & Cryptographic Audit' };
      default:
        return { section: 'DarkWatch AI', title: 'SOC Overview' };
    }
  };

  const pageMeta = getPageTitle(activeTab);
  const userInitial = currentUser?.displayName 
    ? currentUser.displayName.trim()[0].toUpperCase() 
    : 'U';

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#050818]/95 backdrop-blur-xl border-b border-cyan-500/20 px-4 sm:px-6 flex items-center justify-between transition-colors">
      
      {/* Left Area: Mobile Hamburger Button & Compact Brand / Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          aria-label="Toggle Mobile Sidebar Menu"
        >
          <Menu className="w-5 h-5 text-cyan-400" />
        </button>

        <div className="flex items-center gap-2.5">
          <CyberLogoIcon size={30} className="hidden sm:inline-flex" />
          <div className="hidden sm:block">
            <span className="text-base font-black tracking-tight text-white leading-none">
              Dark<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Watch</span>
            </span>
          </div>
        </div>
      </div>

      {/* Center Area: Elegant Breadcrumb & Page Title */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-slate-500 hidden md:inline">{pageMeta.section}</span>
        <span className="text-slate-600 hidden md:inline">/</span>
        <span className="text-cyan-300 font-bold tracking-wide truncate max-w-[200px] sm:max-w-md">
          {pageMeta.title}
        </span>
      </div>

      {/* Right Area: Notification Bell & Small Circular User Avatar */}
      <div className="flex items-center gap-3">
        
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors relative cursor-pointer"
            aria-label="Notifications"
            title="Active Security Notifications"
          >
            <Bell className="w-4 h-4" />
            {unresolvedThreatCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          {/* Quick Notification Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#090e24] border border-cyan-500/40 p-4 shadow-2xl z-50 text-slate-100 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                  Security Alerts
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/50">
                  {unresolvedThreatCount} ACTIVE
                </span>
              </div>
              <div className="py-2 space-y-2 text-xs">
                {unresolvedThreatCount > 0 ? (
                  <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-900/40 space-y-1">
                    <span className="text-red-300 font-bold block text-[11px]">
                      Zero-Day Threat Intercept Active
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Adversary telemetry detected in perimeter gateway. Review triage queue immediately.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    No critical unhandled alerts. System perimeter operating normally.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Small Circular User Avatar with Dropdown Indicator */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-800/60 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-cyan-400"
            aria-label="User Profile and Account Menu"
            title={currentUser?.displayName || 'User Profile'}
          >
            {/* Circular Avatar: 38-42px diameter, cyan-to-violet gradient, subtle glow */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-0.5 shadow-glow-cyan flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full rounded-full bg-[#070b1a] flex items-center justify-center text-white font-bold text-xs sm:text-sm font-mono tracking-tight">
                {userInitial}
              </div>
            </div>

            {/* Subtle Dropdown Chevron */}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
          </button>

          {/* Profile Dropdown Panel */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#080d24] border border-cyan-500/45 p-4 shadow-2xl shadow-cyan-950/80 z-50 text-slate-100 animate-fadeIn space-y-3">
              
              {/* Profile Header: Avatar + User Info */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 p-0.5 flex-shrink-0 shadow-glow-cyan flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#050817] flex items-center justify-center text-white font-black text-base font-mono">
                    {userInitial}
                  </div>
                </div>

                <div className="truncate flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate block">
                      {currentUser?.displayName || 'SecOps Analyst'}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  </div>
                </div>
              </div>

              {/* Menu Links */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs font-medium">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenPitchDeck();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
                >
                  <Presentation className="w-3.5 h-3.5 text-purple-400" />
                  <span>Help & Pitch Deck</span>
                </button>

                {/* Sign Out Action */}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:text-white hover:bg-red-950/60 transition-colors text-left font-mono font-semibold cursor-pointer border-t border-slate-800/60 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
