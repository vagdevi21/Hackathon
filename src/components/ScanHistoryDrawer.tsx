/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Upgraded Search & Scan History Hub
 * Elegant Slide-out Forensics Drawer with Saved Bookmarks, Filter Pills, and Persistent Database
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Trash2, 
  ExternalLink, 
  Link2, 
  Phone, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Copy, 
  Check, 
  Download,
  Filter,
  ArrowRight,
  Database,
  RefreshCw,
  Sparkles,
  Calendar,
  Globe,
  Bookmark,
  Star,
  CheckCircle2,
  BookmarkCheck
} from 'lucide-react';
import { 
  getScanHistory, 
  deleteScanHistoryItem, 
  clearAllScanHistory, 
  toggleSaveScanHistoryItem,
  ScanHistoryRecord 
} from '../utils/scan-history-store';
import { cyberAudio } from '../utils/cyber-audio';

interface ScanHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecord?: (record: ScanHistoryRecord) => void;
}

export const ScanHistoryDrawer: React.FC<ScanHistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectRecord,
}) => {
  const [historyList, setHistoryList] = useState<ScanHistoryRecord[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'SAVED' | 'URL' | 'PHONE' | 'CRITICAL' | 'SAFE'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadHistory = () => {
    setHistoryList(getScanHistory());
  };

  useEffect(() => {
    loadHistory();
    const handleUpdate = () => loadHistory();
    window.addEventListener('darkwatch_history_updated', handleUpdate);
    return () => window.removeEventListener('darkwatch_history_updated', handleUpdate);
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = historyList.filter((item) => {
    if (filterType === 'SAVED' && !item.isSaved) return false;
    if (filterType === 'URL' && item.targetType !== 'URL') return false;
    if (filterType === 'PHONE' && item.targetType !== 'PHONE') return false;
    if (filterType === 'CRITICAL' && item.verdict !== 'CRITICAL_SCAM' && item.verdict !== 'HIGH_RISK') return false;
    if (filterType === 'SAFE' && item.verdict !== 'VERIFIED_SAFE') return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.query.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.summary.toLowerCase().includes(term) ||
      item.verdict.toLowerCase().includes(term)
    );
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    cyberAudio.playSuccess();
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleToggleSave = (id: string) => {
    toggleSaveScanHistoryItem(id);
    cyberAudio.playSuccess();
    loadHistory();
  };

  const handleExportJson = () => {
    cyberAudio.playSuccess();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(historyList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `darkwatch-forensic-history-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteItem = (id: string) => {
    deleteScanHistoryItem(id);
    cyberAudio.playWarning();
  };

  const handleClearAll = () => {
    clearAllScanHistory();
    setHistoryList([]);
    cyberAudio.playWarning();
  };

  const totalSearches = historyList.length;
  const savedCount = historyList.filter((x) => x.isSaved).length;
  const criticalCount = historyList.filter((x) => x.verdict === 'CRITICAL_SCAM' || x.verdict === 'HIGH_RISK').length;
  const safeCount = historyList.filter((x) => x.verdict === 'VERIFIED_SAFE').length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-xl bg-[#070b1a] border-l border-cyan-500/40 shadow-2xl flex flex-col text-slate-100">
          
          {/* Drawer Top Header */}
          <div className="p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-glow-cyan">
                <History className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>Search & Forensic Database</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                    {totalSearches} LOGGED
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Persistent Search History & Bookmarked Threat Records
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close history drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/70 text-xs font-mono">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Total Logs</span>
              <span className="text-lg font-black text-white">{totalSearches}</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-950/50 border border-purple-800/60 text-center">
              <span className="text-[10px] text-purple-300 block font-semibold">Saved</span>
              <span className="text-lg font-black text-purple-400">{savedCount}</span>
            </div>
            <div className="p-2 rounded-xl bg-red-950/50 border border-red-900/60 text-center">
              <span className="text-[10px] text-red-300 block font-semibold">High Risk</span>
              <span className="text-lg font-black text-red-400">{criticalCount}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-900/60 text-center">
              <span className="text-[10px] text-emerald-300 block font-semibold">Verified Safe</span>
              <span className="text-lg font-black text-emerald-400">{safeCount}</span>
            </div>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div className="p-4 space-y-3 border-b border-slate-800 bg-slate-900/40">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus-within:border-cyan-400 transition-colors">
              <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search URLs, phone numbers, or categories..."
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full font-mono"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-slate-500 hover:text-white text-xs font-mono cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                    filterType === 'ALL'
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({historyList.length})
                </button>
                <button
                  onClick={() => setFilterType('SAVED')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                    filterType === 'SAVED'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-slate-900 text-purple-300 hover:text-white'
                  }`}
                >
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Saved ({savedCount})</span>
                </button>
                <button
                  onClick={() => setFilterType('URL')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                    filterType === 'URL'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                  <span>Links</span>
                </button>
                <button
                  onClick={() => setFilterType('PHONE')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                    filterType === 'PHONE'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-3 h-3" />
                  <span>Phones</span>
                </button>
                <button
                  onClick={() => setFilterType('CRITICAL')}
                  className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                    filterType === 'CRITICAL'
                      ? 'bg-red-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Scams
                </button>
                <button
                  onClick={() => setFilterType('SAFE')}
                  className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                    filterType === 'SAFE'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Safe
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportJson}
                  title="Export History JSON"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>

                <button
                  onClick={handleClearAll}
                  title="Clear All History"
                  className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/40 text-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Records List View */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Database className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-400">
                  No scan history matching selected filter
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Execute URL or Phone scans on the Dashboard or Scanner Hub to build your forensics database.
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const isCrit = item.verdict === 'CRITICAL_SCAM' || item.verdict === 'HIGH_RISK';
                const isSafe = item.verdict === 'VERIFIED_SAFE';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all hover:border-cyan-400/60 space-y-3 ${
                      isCrit
                        ? 'bg-red-950/20 border-red-900/40'
                        : isSafe
                        ? 'bg-emerald-950/20 border-emerald-900/40'
                        : 'bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    {/* Top Row: Type, Target Query, Bookmark Star & Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg text-xs ${
                          item.targetType === 'URL'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {item.targetType === 'URL' ? <Link2 className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          {item.targetType} SCAN • {item.id}
                        </span>
                        {item.isSaved && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-900/60 text-purple-300 border border-purple-700/60 flex items-center gap-1">
                            <BookmarkCheck className="w-2.5 h-2.5" />
                            SAVED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Bookmark / Save Toggle Button */}
                        <button
                          onClick={() => handleToggleSave(item.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.isSaved
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-600/50'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400'
                          }`}
                          title={item.isSaved ? 'Bookmarked in persistent database (click to unsave)' : 'Save / Bookmark to persistent database'}
                        >
                          <Star className={`w-3.5 h-3.5 ${item.isSaved ? 'fill-amber-400' : ''}`} />
                        </button>

                        <button
                          onClick={() => handleCopy(item.query, item.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy query text"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Query string display */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-xs text-white break-all select-all">
                      {item.query}
                    </div>

                    {/* Verdict & Risk Rating */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-black border ${
                          isCrit
                            ? 'bg-red-950 text-red-400 border-red-700/60 shadow-glow-rose'
                            : isSafe
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-700/60 shadow-glow-emerald'
                            : 'bg-amber-950 text-amber-400 border-amber-700/60'
                        }`}>
                          {item.scamRating}/100 • {item.verdict.replace(/_/g, ' ')}
                        </span>

                        <span className="text-xs text-slate-300 font-semibold truncate max-w-[160px]">
                          {item.category}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.timestamp}
                      </span>
                    </div>

                    {/* Flagged Blacklists if any */}
                    {item.blacklistsFlagged && item.blacklistsFlagged.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1 text-[10px] font-mono">
                        <span className="text-red-400 font-bold">Blacklists:</span>
                        {item.blacklistsFlagged.map((bl, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-800/50 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-red-400 inline" />
                            {bl}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Notes if available */}
                    {item.notes && (
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-300 font-mono">
                        <span className="text-purple-400 font-bold">Analyst Notes: </span>
                        {item.notes}
                      </div>
                    )}

                    {/* Action button to load into scanner */}
                    {onSelectRecord && (
                      <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                        <button
                          onClick={() => {
                            onSelectRecord(item);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Re-Load into Scanner</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
