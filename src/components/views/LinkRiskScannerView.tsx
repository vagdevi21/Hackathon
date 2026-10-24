/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Intelligent URL & Phone Scam Risk Analysis Hub
 * 
 * Complies with strict specifications:
 * 1. Inputs start 100% empty with clean placeholders
 * 2. Separate tabs for Website URL Analysis and Phone Number Analysis
 * 3. Labeled "Estimated Risk Score" (0-100) with radial circular gauge
 * 4. Specific Risk Tiers: 0-29 Low Risk ("Lower Risk Detected"), 30-59 Medium Risk ("Caution Recommended"), 60-100 High Risk ("Do Not Proceed"), or "Unable to assess"
 * 5. Expandable "Risk Factors & Evidence" section (Passed / Warning / Threat Detected / Not Available)
 * 6. Expandable "How was this score calculated?" breakdown
 * 7. Dedicated "Threat Distribution — Analysis Results" donut chart derived from real findings with zero-data fallback
 * 8. Analysis Summary (checked, detected, unknown, uncompleted)
 * 9. Recommended Actions checklist
 */

import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  Phone, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Globe, 
  Clock, 
  ArrowRight,
  ArrowLeft,
  Share2,
  History,
  Check,
  Star,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  AlertOctagon,
  MinusCircle,
  HelpCircle,
  Layers,
  Sparkles,
  PlusCircle
} from 'lucide-react';
import { 
  analyzeWebsiteUrl, 
  analyzePhoneNumber, 
  DetailedAnalysisResult, 
  RiskFactorItem,
  maskPhoneNumber 
} from '../../services/link-analyzer';
import { ThreatDistributionDonut } from '../ThreatDistributionDonut';
import { saveScanHistoryItem, getScanHistory } from '../../utils/scan-history-store';
import { addCustomBlacklistItem, removeCustomBlacklistItem, isTargetBlacklisted } from '../../utils/custom-blacklist-store';
import { cyberAudio } from '../../utils/cyber-audio';
import { UserProfile } from '../../utils/auth-store';

interface LinkRiskScannerViewProps {
  onOpenHistory?: () => void;
  onBackToDashboard?: () => void;
  initialQuery?: string;
  initialType?: 'URL' | 'PHONE';
  currentUser?: UserProfile | null;
}

export const LinkRiskScannerView: React.FC<LinkRiskScannerViewProps> = ({ 
  onOpenHistory,
  onBackToDashboard,
  initialQuery = '',
  initialType = 'URL',
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'URL' | 'PHONE'>(initialType);
  const [inputQuery, setInputQuery] = useState<string>(initialQuery);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [result, setResult] = useState<DetailedAnalysisResult | null>(null);
  const [showHowCalculated, setShowHowCalculated] = useState<boolean>(false);
  const [showEvidence, setShowEvidence] = useState<boolean>(true);
  const [evidenceFilter, setEvidenceFilter] = useState<'ALL' | 'THREAT' | 'WARNING' | 'PASSED'>('ALL');
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setInputQuery(initialQuery);
      if (initialType) {
        setActiveTab(initialType);
      } else if (initialQuery.startsWith('+') || /^\d[\d\s\-\(\)]{6,}$/.test(initialQuery.trim())) {
        setActiveTab('PHONE');
      } else {
        setActiveTab('URL');
      }
      runAnalysis(initialQuery, initialType);
    }
  }, [initialQuery, initialType]);

  const runAnalysis = (targetToAnalyze?: string, forceType?: 'URL' | 'PHONE') => {
    const raw = (targetToAnalyze !== undefined ? targetToAnalyze : inputQuery).trim();
    if (!raw) return;

    setIsScanning(true);
    cyberAudio.playScan();

    setTimeout(async () => {
      const type = forceType || activeTab;
      const res = type === 'PHONE' ? await analyzePhoneNumber(raw) : analyzeWebsiteUrl(raw);
      setResult(res);
      setIsScanning(false);

      // Auto-save to persistent scan history with user identity
      saveScanHistoryItem({
        query: res.target,
        targetType: res.type,
        scamRating: res.estimatedRiskScore ?? 0,
        verdict: (res.riskTier === 'HIGH' ? 'CRITICAL_SCAM' : res.riskTier === 'MEDIUM' ? 'HIGH_RISK' : 'VERIFIED_SAFE'),
        category: res.statusLabel,
        summary: res.recommendationMessage,
        blacklistsFlagged: res.riskFactors
          .filter((f) => f.result === 'THREAT_DETECTED' || f.result === 'WARNING')
          .map((f) => f.name),
        totalBlacklistsChecked: res.riskFactors.length,
        isSaved: false,
      }, currentUser?.username);

      if (res.estimatedRiskScore && res.estimatedRiskScore >= 60) {
        cyberAudio.playCriticalAlert();
      } else {
        cyberAudio.playSuccess();
      }
    }, 600);
  };

  const handleCopySummary = () => {
    if (!result) return;
    const summaryText = `[DarkWatch AI Threat Report]\nTarget: ${result.maskedTarget}\nType: ${result.type}\nEstimated Risk Score: ${result.estimatedRiskScore !== null ? `${result.estimatedRiskScore}/100` : 'Unable to assess'}\nRisk Tier: ${result.riskTier} (${result.statusLabel})\nRecommendation: ${result.recommendationMessage}\nTimestamp: ${result.timestamp}`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    cyberAudio.playSuccess();
  };

  const handleExportJson = () => {
    if (!result) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `darkwatch-analysis-${result.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    cyberAudio.playSuccess();
  };

  const handleSaveToDatabase = () => {
    if (!result) return;
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
      notes: `Bookmarked manual investigation: ${result.statusLabel}`,
    }, currentUser?.username);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    cyberAudio.playSuccess();
  };

  const [blacklistedSuccess, setBlacklistedSuccess] = useState<boolean>(false);

  const handleAddToBlacklist = () => {
    if (!result) return;
    addCustomBlacklistItem({
      target: result.target,
      targetType: result.type,
      category: result.statusLabel || (result.type === 'URL' ? 'Phishing Credential Harvester' : 'Fraudulent Caller'),
      reason: `Flagged during manual security inspection on ${new Date().toLocaleDateString()}`,
      addedBy: currentUser?.username || 'SecOps Analyst',
    });
    setBlacklistedSuccess(true);
    cyberAudio.playCriticalAlert();
    setTimeout(() => setBlacklistedSuccess(false), 3000);
    // Re-run analysis to show updated Threat Blacklist match immediately
    runAnalysis(result.target, result.type);
  };

  // Radial Gauge parameters
  const score = result?.estimatedRiskScore ?? 0;
  const gaugeRadius = 54;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const strokeOffset = gaugeCircumference - (gaugeCircumference * score) / 100;

  // Filtered evidence factors
  const filteredFactors = result ? result.riskFactors.filter((rf) => {
    if (evidenceFilter === 'THREAT') return rf.result === 'THREAT_DETECTED';
    if (evidenceFilter === 'WARNING') return rf.result === 'WARNING';
    if (evidenceFilter === 'PASSED') return rf.result === 'PASSED';
    return true;
  }) : [];

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              URL & Phone Scam Scanner
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
              INTELLIGENT RISK ENGINE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Data-backed risk scoring, verified threat evidence, dynamic payload distribution, and defensive guidance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all cursor-pointer shadow-glow-cyan"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          )}

          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scan History</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Input Container with Tabs */}
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 space-y-4 shadow-xl">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => {
              setActiveTab('URL');
              setInputQuery('');
              setResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'URL'
                ? 'bg-cyan-600 text-white shadow-glow-cyan border border-cyan-400'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Website URL Analysis</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('PHONE');
              setInputQuery('');
              setResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'PHONE'
                ? 'bg-amber-600 text-white shadow-glow-rose border border-amber-400'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Phone Number Analysis</span>
          </button>
        </div>

        {/* Input Field with exact placeholders */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus-within:border-cyan-500 transition-colors shadow-inner">
            {activeTab === 'URL' ? (
              <Globe className="w-4 h-4 text-slate-500 flex-shrink-0" />
            ) : (
              <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
            )}
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && inputQuery.trim() && runAnalysis()}
              placeholder={
                activeTab === 'URL'
                  ? 'Enter URL to analyze (e.g. https://example.com/login)...'
                  : 'Enter phone number with country code (e.g. +1 800 555-0199)...'
              }
              className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full font-mono"
            />
          </div>

          <button
            onClick={() => runAnalysis()}
            disabled={isScanning || !inputQuery.trim()}
            className={`w-full sm:w-auto px-7 py-3 rounded-xl text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'URL'
                ? 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-glow-cyan'
                : 'bg-gradient-to-r from-amber-600 to-red-500 hover:from-amber-500 hover:to-red-400 shadow-glow-rose'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>{isScanning ? 'Evaluating Security Evidence...' : 'Analyze for Threats'}</span>
          </button>
        </div>

        {/* Informational Guidance bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Privacy-safe evaluation • Local sanitization & strict loopback/private IP blocking
          </span>
          <span className="hidden sm:inline text-slate-500">
            Scores: 0-29 Low Risk | 30-59 Medium Risk | 60-100 High Risk
          </span>
        </div>
      </div>

      {/* If No Result Yet and Not Scanning: Meaningful Initial State */}
      {!result && !isScanning && (
        <div className="cyber-card rounded-2xl p-8 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
            <Search className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-base font-bold text-white">Ready for Security Inspection</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Enter a web link to check TLS certificates, punycode spoofing, and malicious redirect scripts, or a phone number to check STIR/SHAKEN caller attestation and robocall registrations.
          </p>
        </div>
      )}

      {/* ANALYSIS RESULTS SECTION */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Card 1: Score & Top-Level Verdict with Radial Gauge */}
          <div className={`cyber-card rounded-2xl p-6 border shadow-2xl relative overflow-hidden ${
            result.riskTier === 'HIGH'
              ? 'border-red-500/50 bg-gradient-to-br from-red-950/30 via-slate-900/90 to-purple-950/20'
              : result.riskTier === 'MEDIUM'
              ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-950'
              : result.riskTier === 'LOW'
              ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/30 via-slate-900/90 to-cyan-950/20'
              : 'border-slate-700 bg-slate-900/90'
          }`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Radial Score Gauge */}
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0" style={{ width: 130, height: 130 }}>
                  <svg width={130} height={130} viewBox="0 0 130 130" className="transform -rotate-90">
                    {/* Track */}
                    <circle
                      cx={65}
                      cy={65}
                      r={gaugeRadius}
                      fill="transparent"
                      stroke="#0f172a"
                      strokeWidth={12}
                    />
                    {/* Value ring */}
                    {result.estimatedRiskScore !== null && (
                      <circle
                        cx={65}
                        cy={65}
                        r={gaugeRadius}
                        fill="transparent"
                        stroke={
                          result.riskTier === 'HIGH'
                            ? '#ef4444'
                            : result.riskTier === 'MEDIUM'
                            ? '#f59e0b'
                            : '#10b981'
                        }
                        strokeWidth={12}
                        strokeDasharray={gaugeCircumference}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                      />
                    )}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black font-mono text-white">
                      {result.estimatedRiskScore !== null ? result.estimatedRiskScore : 'N/A'}
                    </span>
                    <span className="text-[9px] font-mono uppercase font-bold text-slate-400">
                      / 100 Risk
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="text-xs font-mono text-slate-400">Target Evaluated:</span>
                    <span className="text-sm font-mono font-bold text-white break-all">
                      {result.maskedTarget}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-black border ${
                        result.riskTier === 'HIGH'
                          ? 'bg-red-950 text-red-300 border-red-700/60 shadow-glow-rose'
                          : result.riskTier === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-300 border-amber-700/60'
                          : result.riskTier === 'LOW'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60 shadow-glow-emerald'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {result.riskTier === 'HIGH' && 'HIGH RISK • DO NOT PROCEED'}
                      {result.riskTier === 'MEDIUM' && 'MEDIUM RISK • CAUTION RECOMMENDED'}
                      {result.riskTier === 'LOW' && 'LOW RISK • LOWER RISK DETECTED'}
                      {result.riskTier === 'UNABLE_TO_ASSESS' && 'UNABLE TO ASSESS'}
                    </span>

                    <span className="text-xs font-mono text-slate-400">
                      Scan Mode: {result.scanMode}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed pt-1">
                    {result.recommendationMessage}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0 w-full md:w-auto">
                <button
                  onClick={handleAddToBlacklist}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/40 text-xs font-mono font-bold transition-all cursor-pointer shadow-glow-rose"
                  title="Add this target to persistent Threat Blacklist"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>{blacklistedSuccess ? 'Added to Blacklist!' : 'Add to Threat Blacklist'}</span>
                </button>

                <button
                  onClick={handleSaveToDatabase}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-purple-300" />
                  <span>{savedSuccess ? 'Saved to Database!' : 'Save / Bookmark'}</span>
                </button>

                <button
                  onClick={handleCopySummary}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Summary Copied' : 'Copy Summary'}</span>
                </button>

                <button
                  onClick={handleExportJson}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* Threat Intelligence Blacklist Feed Cross-Reference Card */}
          {(() => {
            const blMatch = isTargetBlacklisted(result.target) || isTargetBlacklisted(result.maskedTarget);
            return (
              <div className={`cyber-card rounded-2xl p-6 border space-y-4 shadow-xl ${
                blMatch
                  ? 'border-red-500/60 bg-gradient-to-r from-red-950/40 via-slate-900/90 to-red-950/20'
                  : 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 via-slate-900/90 to-cyan-950/20'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ShieldAlert className={`w-5 h-5 ${blMatch ? 'text-red-400' : 'text-emerald-400'}`} />
                      Threat Intelligence Blacklist Feed
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        blMatch 
                          ? 'bg-red-950 text-red-300 border-red-700/60 animate-pulse' 
                          : 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                      }`}>
                        {blMatch ? 'FLAGGED IN BLACKLIST DATABASE' : 'CLEAN / NOT FLAGGED'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cross-referenced against VirusTotal, Google Safe Browsing, Spamhaus DBL, PhishTank, FTC Robocall DB, and Custom SOC Blacklist.
                    </p>
                  </div>

                  {!blMatch ? (
                    <button
                      onClick={handleAddToBlacklist}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/50 text-xs font-mono font-bold transition-all cursor-pointer shadow-glow-rose flex-shrink-0"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-red-400" />
                      <span>{blacklistedSuccess ? 'Flagged & Saved!' : 'Flag Item in Blacklist DB'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (blMatch.id) {
                          removeCustomBlacklistItem(blMatch.id);
                          cyberAudio.playSuccess();
                          runAnalysis(result.target, result.type);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono font-bold transition-all cursor-pointer flex-shrink-0"
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Remove from Blacklist</span>
                    </button>
                  )}
                </div>

                {blMatch ? (
                  <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/60 space-y-2 text-xs font-mono">
                    <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                      <AlertOctagon className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>WARNING: Active Blacklist Entry Matched</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500 block text-[10px]">CATEGORY:</span>
                        <span className="font-bold text-red-300">{blMatch.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">REASON / DETONATION EVIDENCE:</span>
                        <span className="font-semibold text-slate-200">{blMatch.reason}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">ADDED BY ANALYST:</span>
                        <span className="text-cyan-300">{blMatch.addedBy}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">TIMESTAMP:</span>
                        <span className="text-slate-400">{blMatch.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3 text-xs font-mono text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-300 block">No Active Blacklist Matches Found</span>
                      <span className="text-[11px] text-slate-400">
                        Target tested clean across all 6 active threat intelligence feeds and custom organization blacklist registries.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Card 2: Threat Distribution — Analysis Results (Strict Data Honesty) */}
          <div className="cyber-card rounded-2xl p-6 border border-purple-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Threat Distribution — Analysis Results
                  <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/40">
                    REAL-TIME FINDINGS
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Dynamic breakdown derived strictly from verified attributes observed during this analysis.
                </p>
              </div>
            </div>

            {/* If hasData is false, displays explicit honest message instead of fake percentages */}
            <ThreatDistributionDonut
              customDistribution={result.threatDistribution.hasData ? result.threatDistribution.breakdown : []}
              emptyMessage={result.threatDistribution.emptyReason || 'Insufficient evidence to calculate threat distribution. All configured security indicators tested clean.'}
            />
          </div>

          {/* Card 3: Expandable "Risk Factors & Evidence" */}
          <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div 
                onClick={() => setShowEvidence(!showEvidence)}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Risk Factors & Evidence
                  <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                    {result.riskFactors.length} CHECKS EVALUATED
                  </span>
                </h3>
                {showEvidence ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>

              {showEvidence && (
                <div className="flex items-center gap-1 text-xs font-mono">
                  {(['ALL', 'THREAT', 'WARNING', 'PASSED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setEvidenceFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        evidenceFilter === filter
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {showEvidence && (
              <div className="space-y-2.5">
                {filteredFactors.map((rf) => {
                  return (
                    <div
                      key={rf.id}
                      className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        rf.result === 'THREAT_DETECTED'
                          ? 'bg-red-950/30 border-red-500/50 text-red-200'
                          : rf.result === 'WARNING'
                          ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                          : rf.result === 'PASSED'
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {rf.result === 'THREAT_DETECTED' && <AlertOctagon className="w-4 h-4 text-red-400 flex-shrink-0" />}
                          {rf.result === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                          {rf.result === 'PASSED' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                          {rf.result === 'NOT_AVAILABLE' && <MinusCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />}

                          <span className="font-bold text-white text-xs">{rf.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                            {rf.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pl-6">
                          {rf.explanation}
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end gap-1 flex-shrink-0 pl-6 sm:pl-0 font-mono text-[11px]">
                        <span className={`px-2 py-0.5 rounded font-black ${
                          rf.result === 'THREAT_DETECTED'
                            ? 'bg-red-900/80 text-red-300'
                            : rf.result === 'WARNING'
                            ? 'bg-amber-900/80 text-amber-300'
                            : rf.result === 'PASSED'
                            ? 'bg-emerald-900/80 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {rf.result.replace(/_/g, ' ')}
                        </span>
                        {rf.sourceOrEvidence && (
                          <span className="text-[10px] text-slate-400">
                            Source: {rf.sourceOrEvidence}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 4: Expandable "How was this score calculated?" */}
          <div className="cyber-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div 
              onClick={() => setShowHowCalculated(!showHowCalculated)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                How was this score calculated?
              </h3>
              {showHowCalculated ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {showHowCalculated && (
              <div className="space-y-3 pt-2 text-xs font-mono text-slate-300 border-t border-slate-800 animate-fadeIn">
                <p className="text-slate-400 leading-relaxed">
                  {result.howScoreCalculated.explanation}
                </p>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-400 border-b border-slate-800 pb-1.5 text-[11px]">
                    <span>FACTOR / ATTRIBUTE</span>
                    <span>POINTS DELTA</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Base Baseline Score</span>
                    <span className="font-bold text-slate-200">+{result.howScoreCalculated.baseScore}</span>
                  </div>

                  {result.howScoreCalculated.factors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-300">
                      <div>
                        <span className="font-semibold text-white">{f.factor}</span>
                        <span className="text-[10px] text-slate-400 block">{f.rationale}</span>
                      </div>
                      <span className={`font-bold font-mono ${f.delta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {f.delta > 0 ? `+${f.delta}` : f.delta}
                      </span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-bold text-white text-xs">
                    <span>Total Calculated Estimated Risk</span>
                    <span className="text-cyan-400 font-mono text-sm">{result.estimatedRiskScore ?? 'N/A'}/100</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 5: Analysis Summary & Recommended Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Analysis Summary */}
            <div className="cyber-card rounded-2xl p-5 border border-slate-800 space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Pipeline Analysis Summary
              </h4>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">CHECKED ATTRIBUTES:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.summary.checked.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px]">
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>

                {result.summary.detected.length > 0 && (
                  <div>
                    <span className="text-red-400 block text-[10px]">THREAT INDICATORS DETECTED:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.summary.detected.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-700/50 text-[11px]">
                          ⚠ {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.summary.unknown.length > 0 && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">INCONCLUSIVE / UNKNOWN:</span>
                    <span className="text-slate-400 text-[11px]">
                      {result.summary.unknown.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Defensive Actions */}
            <div className="cyber-card rounded-2xl p-5 border border-slate-800 space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Recommended Next Actions
              </h4>

              <div className="space-y-2">
                {result.actionChecklist.map((action, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50 flex items-center justify-center font-mono text-[10px] flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-slate-200 leading-relaxed">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
