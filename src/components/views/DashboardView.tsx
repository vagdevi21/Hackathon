/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Streamlined Security Dashboard View
 * 
 * Clean, uncluttered layout:
 * 1. Welcome header: "Welcome to DarkWatch AI" & subtitle
 * 2. Prominent Security Analysis entry card (URL & Phone Analysis tabs, clean inputs)
 * 3. Compact overview cards populated strictly by genuine data / honest empty states
 * (Maps, heatmaps, forecasts, radar, and full triage are accessible via dedicated sidebar views)
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  History, 
  Link2, 
  Phone, 
  Globe, 
  Flame, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { ThreatAlert } from '../../types/security';
import { getScanHistory, saveScanHistoryItem, ScanHistoryRecord } from '../../utils/scan-history-store';
import { analyzeWebsiteUrl, analyzePhoneNumber, DetailedAnalysisResult } from '../../services/link-analyzer';
import { cyberAudio } from '../../utils/cyber-audio';

import { UserProfile } from '../../utils/auth-store';

interface DashboardViewProps {
  alerts: ThreatAlert[];
  onSelectAlert: (alert: ThreatAlert) => void;
  onOpenSimulateAttack: () => void;
  onNavigateToTab?: (tab: string, initialQuery?: string) => void;
  onOpenHistory?: () => void;
  currentUser?: UserProfile | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  alerts,
  onSelectAlert,
  onOpenSimulateAttack,
  onNavigateToTab,
  onOpenHistory,
  currentUser,
}) => {
  const [targetType, setTargetType] = useState<'URL' | 'PHONE'>('URL');
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [latestAnalysis, setLatestAnalysis] = useState<DetailedAnalysisResult | null>(null);
  const [historyItems, setHistoryItems] = useState<ScanHistoryRecord[]>(() => getScanHistory(currentUser?.username));

  useEffect(() => {
    const handleUpdate = () => {
      setHistoryItems(getScanHistory(currentUser?.username));
    };
    window.addEventListener('darkwatch_history_updated', handleUpdate);
    return () => window.removeEventListener('darkwatch_history_updated', handleUpdate);
  }, [currentUser?.username]);

  const handleRunAnalysis = () => {
    const raw = inputQuery.trim();
    if (!raw) return;

    setIsAnalyzing(true);
    cyberAudio.playScan();

    setTimeout(async () => {
      const isPhone = targetType === 'PHONE' || raw.startsWith('+') || /^\d[\d\s\-\(\)]{6,}$/.test(raw);
      const result = isPhone ? await analyzePhoneNumber(raw) : analyzeWebsiteUrl(raw);

      setLatestAnalysis(result);
      setIsAnalyzing(false);

      // Persist to scan history with user identity
      saveScanHistoryItem({
        query: result.target,
        targetType: result.type,
        scamRating: result.estimatedRiskScore ?? 0,
        verdict: (result.riskTier === 'HIGH' ? 'CRITICAL_SCAM' : result.riskTier === 'MEDIUM' ? 'HIGH_RISK' : 'VERIFIED_SAFE'),
        category: result.statusLabel,
        summary: result.recommendationMessage,
        blacklistsFlagged: result.riskFactors
          .filter((f) => f.result === 'THREAT_DETECTED' || f.result === 'WARNING')
          .map((f) => f.name),
        totalBlacklistsChecked: result.riskFactors.length,
        isSaved: true,
      }, currentUser?.username);

      cyberAudio.playSuccess();
    }, 600);
  };

  const highRiskCount = historyItems.filter((h) => h.scamRating >= 60).length;
  const verifiedSafeCount = historyItems.filter((h) => h.scamRating < 30).length;
  const activeAlertsCount = alerts.filter((a) => a.status !== 'MITIGATED').length;

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      {/* 1. Welcome Header - Clean High-Contrast Adaptive Styling */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="welcome-title text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold tracking-tight flex flex-wrap items-center">
            <span className="welcome-title">Welcome to</span>
            <span className="brand-name ml-2">DarkWatch</span>
            <span className="ai-label">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-cyan-300/90 font-sans font-medium tracking-wide mt-1.5">
            Intelligent Cyber Threat Early Warning & Real-Time Incident Defense
          </p>
        </div>
      </div>

      {/* 2. Prominent Security Analysis Card */}
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 space-y-5 shadow-2xl bg-gradient-to-br from-[#060b20] via-slate-900/90 to-[#0c0824]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-glow-cyan">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="security-analysis-title flex items-center gap-2">
                Intelligent Security Analysis
              </h2>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus-within:border-cyan-500 transition-colors shadow-inner">
            {targetType === 'URL' ? (
              <Globe className="w-4 h-4 text-slate-500 flex-shrink-0" />
            ) : (
              <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
            )}
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && inputQuery.trim() && handleRunAnalysis()}
              placeholder="Enter URL or phone number to analyze..."
              className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full font-mono"
            />
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || !inputQuery.trim()}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-cyan"
          >
            <Search className="w-4 h-4" />
            <span>{isAnalyzing ? 'Evaluating Security Evidence...' : 'Analyze for Threats'}</span>
          </button>
        </div>

        {/* Instant Result Preview Bar */}
        {latestAnalysis && (
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-black border ${
                    latestAnalysis.riskTier === 'HIGH'
                      ? 'bg-red-950 text-red-300 border-red-700/60 shadow-glow-rose'
                      : latestAnalysis.riskTier === 'MEDIUM'
                      ? 'bg-amber-950 text-amber-300 border-amber-700/60'
                      : latestAnalysis.riskTier === 'LOW'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60 shadow-glow-emerald'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  ESTIMATED RISK: {latestAnalysis.estimatedRiskScore !== null ? `${latestAnalysis.estimatedRiskScore}/100` : 'N/A'} • {latestAnalysis.statusLabel}
                </span>
                <span className="text-white font-bold text-xs">{latestAnalysis.maskedTarget}</span>
              </div>

              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('link-scanner', latestAnalysis.target)}
                  className="text-xs text-cyan-400 hover:underline font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>View Full Evidence & Risk Distribution →</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Nav Module Shortcuts */}
      <div className="cyber-card rounded-2xl p-5 border border-slate-800/80 bg-slate-900/30 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Explore Dedicated Cybersecurity Modules
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'attack-map', label: 'Global Attack Map', icon: Globe, color: 'text-cyan-400' },
            { id: 'threat-heatmap', label: 'Density Heatmap', icon: Flame, color: 'text-amber-400' },
            { id: 'threat-trends', label: 'Trends & Analytics', icon: Activity, color: 'text-purple-400' },
            { id: 'forecasting', label: 'Threat Forecasting', icon: Sparkles, color: 'text-emerald-400' },
          ].map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => onNavigateToTab?.(mod.id)}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all text-left group cursor-pointer"
              >
                <Icon className={`w-4 h-4 ${mod.color} mb-1.5 group-hover:scale-110 transition-transform`} />
                <span className="text-xs font-bold text-white block group-hover:text-cyan-300">{mod.label}</span>
                <span className="text-[10px] font-mono text-slate-500 block">Open View →</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
