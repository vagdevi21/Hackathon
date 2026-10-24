/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Scan History Dedicated View
 */

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  Star, 
  Globe, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Download,
  ExternalLink,
  User
} from 'lucide-react';
import { 
  ScanHistoryRecord, 
  getScanHistory, 
  deleteScanHistoryItem, 
  toggleSaveScanHistoryItem, 
  clearAllScanHistory,
  seedSampleScans 
} from '../../utils/scan-history-store';
import { cyberAudio } from '../../utils/cyber-audio';
import { UserProfile } from '../../utils/auth-store';

interface ScanHistoryViewProps {
  onNavigateToScan: (target: string, type: 'URL' | 'PHONE') => void;
  onBackToDashboard?: () => void;
  currentUser?: UserProfile | null;
}

export const ScanHistoryView: React.FC<ScanHistoryViewProps> = ({ 
  onNavigateToScan,
  onBackToDashboard,
  currentUser,
}) => {
  const [history, setHistory] = useState<ScanHistoryRecord[]>(() => getScanHistory(currentUser?.username));
  const [filterType, setFilterType] = useState<'ALL' | 'URL' | 'PHONE' | 'SAVED'>('ALL');
  const [search, setSearch] = useState<string>('');
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = () => {
      setHistory(getScanHistory(currentUser?.username));
    };
    window.addEventListener('darkwatch_history_updated', handleUpdate);
    return () => window.removeEventListener('darkwatch_history_updated', handleUpdate);
  }, [currentUser?.username]);

  const filteredHistory = history.filter((item) => {
    if (filterType === 'URL' && item.targetType !== 'URL') return false;
    if (filterType === 'PHONE' && item.targetType !== 'PHONE') return false;
    if (filterType === 'SAVED' && !item.isSaved) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.query.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `darkwatch-scan-history-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    cyberAudio.playSuccess();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Scan History & Investigation Records
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
              {history.length} RECORDS
            </span>
            {currentUser && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700/50 flex items-center gap-1">
                <User className="w-3 h-3 text-purple-400" />
                {currentUser.displayName || currentUser.username}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Persistent database archive of all analyzed URLs, phone numbers, threat ratings, and forensic evidence for {currentUser?.displayName || 'your account'}.
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

          {history.length > 0 && (
            <>
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer"
                title="Export scan history as JSON"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export JSON</span>
              </button>
              {showConfirmClear ? (
                <div className="flex items-center gap-2 animate-fadeIn">
                  <button
                    onClick={() => {
                      clearAllScanHistory(currentUser?.username);
                      setHistory([]);
                      setShowConfirmClear(false);
                      cyberAudio.playWarning();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-glow-rose"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Clear All</span>
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/40 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Clear All</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'URL', 'PHONE', 'SAVED'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-cyan-600 text-white border border-cyan-500 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {t === 'ALL' ? 'All Scans' : t === 'URL' ? 'URLs Only' : t === 'PHONE' ? 'Phones Only' : 'Bookmarked'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-72 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search query, category, notes..."
            className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full font-mono"
          />
        </div>
      </div>

      {/* List or Authentic Empty State */}
      {filteredHistory.length === 0 ? (
        <div className="cyber-card rounded-2xl p-10 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No scans performed yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              You haven't run any URL or phone number fraud evaluations yet. Enter a website link or caller number to inspect risk indicators and build your investigation archive.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToScan('', 'URL')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-mono text-xs font-bold transition-all shadow-glow-cyan cursor-pointer"
            >
              Start Your First Scan
            </button>
            <button
              onClick={() => {
                seedSampleScans();
                cyberAudio.playSuccess();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-mono text-xs font-bold transition-colors cursor-pointer"
            >
              Load Sample Scans
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
            const isCritical = item.scamRating >= 70;
            const isMedium = item.scamRating >= 30 && item.scamRating < 70;
            return (
              <div
                key={item.id}
                className="cyber-card rounded-2xl p-4 sm:p-5 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {item.targetType === 'URL' ? <Globe className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-black border ${
                      isCritical
                        ? 'bg-red-950 text-red-300 border-red-700/50'
                        : isMedium
                        ? 'bg-amber-950 text-amber-300 border-amber-700/50'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                    }`}>
                      RISK {item.scamRating}/100 • {item.verdict.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{item.timestamp}</span>
                    {item.isSaved && (
                      <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700/50 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-purple-300" />
                        Saved
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-sm font-bold text-white break-all">
                    {item.query}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-cyan-300">{item.category}</span> — {item.summary}
                  </p>

                  {item.blacklistsFlagged.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                      <span className="text-slate-500 font-semibold">Flagged On:</span>
                      {item.blacklistsFlagged.map((bl, i) => (
                        <span key={i} className="px-2 py-0.2 rounded bg-red-950/60 text-red-400 border border-red-800/40">
                          {bl}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                  <button
                    onClick={() => toggleSaveScanHistoryItem(item.id)}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      item.isSaved
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                    }`}
                    title={item.isSaved ? 'Remove Bookmark' : 'Bookmark Investigation'}
                  >
                    <Star className={`w-4 h-4 ${item.isSaved ? 'fill-amber-300' : ''}`} />
                  </button>

                  <button
                    onClick={() => onNavigateToScan(item.query, item.targetType)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    <span>Re-Analyze</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteScanHistoryItem(item.id)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
