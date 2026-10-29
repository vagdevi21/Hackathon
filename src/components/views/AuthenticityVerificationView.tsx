/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Authenticity, Scam & Threat Verification Center
 * 
 * 3 Verification Modes:
 * 1. Website / URL Verification
 * 2. Phone Number / Spam & Scam Risk Check (India +91 First)
 * 3. Document / Exam Paper Verification
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Phone, 
  Globe, 
  FileText, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  XCircle, 
  Info, 
  Lock, 
  Upload, 
  FileCheck2, 
  Sparkles, 
  Search, 
  ShieldAlert, 
  ArrowRight, 
  ExternalLink, 
  Clock, 
  Copy, 
  Check, 
  AlertOctagon,
  HelpCircle,
  Hash,
  Award,
  RefreshCw
} from 'lucide-react';
import { 
  PhoneVerificationResult, 
  UrlVerificationResult, 
  DocumentVerificationResult,
  PhoneRiskStatus,
  DocumentVerificationStatus,
  SharedClassification
} from '../../server/verification/types';
import { cyberAudio } from '../../utils/cyber-audio';

interface AuthenticityVerificationViewProps {
  onBackToDashboard?: () => void;
  currentUser?: any;
}

export const AuthenticityVerificationView: React.FC<AuthenticityVerificationViewProps> = ({
  onBackToDashboard,
  currentUser,
}) => {
  const [activeMode, setActiveMode] = useState<'PHONE' | 'URL' | 'DOCUMENT'>('PHONE');

  // Phone Verification State (India +91 First)
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [phoneNumberInput, setPhoneNumberInput] = useState<string>('');
  const [isPhoneVerifying, setIsPhoneVerifying] = useState<boolean>(false);
  const [phoneResult, setPhoneResult] = useState<PhoneVerificationResult | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // URL Verification State
  const [urlInput, setUrlInput] = useState<string>('');
  const [isUrlVerifying, setIsUrlVerifying] = useState<boolean>(false);
  const [urlResult, setUrlResult] = useState<UrlVerificationResult | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Document / Exam Paper State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [claimedIssuer, setClaimedIssuer] = useState<string>('');
  const [claimedExamId, setClaimedExamId] = useState<string>('');
  const [extractedTextHint, setExtractedTextHint] = useState<string>('');
  const [isDocVerifying, setIsDocVerifying] = useState<boolean>(false);
  const [docResult, setDocResult] = useState<DocumentVerificationResult | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  // Provider configuration status
  const [providersInfo, setProvidersInfo] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/verification/providers')
      .then((res) => res.json())
      .then((data) => setProvidersInfo(data))
      .catch(() => {});
  }, []);

  // 1. Phone Verification Handler
  const handleVerifyPhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumberInput.trim()) return;

    setIsPhoneVerifying(true);
    setPhoneError(null);
    cyberAudio.playScan();

    try {
      const res = await fetch('/api/verification/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumberInput.trim(),
          countryCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error || 'Failed to verify phone number');
        cyberAudio.playCriticalAlert();
      } else {
        setPhoneResult(data);
        if (data.sharedClassification === 'MALICIOUS_FRAUD_CONFIRMED' || data.sharedClassification === 'SUSPICIOUS') {
          cyberAudio.playCriticalAlert();
        } else {
          cyberAudio.playSuccess();
        }
      }
    } catch (err: any) {
      setPhoneError(err.message || 'Verification network service unavailable.');
      cyberAudio.playCriticalAlert();
    } finally {
      setIsPhoneVerifying(false);
    }
  };

  // 2. URL Verification Handler
  const handleVerifyUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setIsUrlVerifying(true);
    setUrlError(null);
    cyberAudio.playScan();

    try {
      const res = await fetch('/api/verification/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setUrlError(data.error || 'Failed to verify URL');
        cyberAudio.playCriticalAlert();
      } else {
        setUrlResult(data);
        if (data.sharedClassification === 'MALICIOUS_FRAUD_CONFIRMED' || data.sharedClassification === 'SUSPICIOUS') {
          cyberAudio.playCriticalAlert();
        } else {
          cyberAudio.playSuccess();
        }
      }
    } catch (err: any) {
      setUrlError(err.message || 'Verification network service unavailable.');
      cyberAudio.playCriticalAlert();
    } finally {
      setIsUrlVerifying(false);
    }
  };

  // 3. Document / Exam Paper Verification Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDocResult(null);
      setDocError(null);

      // Auto-populate hint if file name hints at sample or exam
      const name = file.name.toLowerCase();
      if (name.includes('sample') || name.includes('mock') || name.includes('model')) {
        setExtractedTextHint((prev) => prev || 'Sample Question Paper for Practice Only');
      }
      if (name.includes('cbse')) {
        setClaimedIssuer((prev) => prev || 'Central Board of Secondary Education');
      }
    }
  };

  const handleVerifyDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setDocError('Please select a PDF, PNG, or JPG document to verify.');
      return;
    }

    setIsDocVerifying(true);
    setDocError(null);
    cyberAudio.playScan();

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const res = await fetch('/api/verification/document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: selectedFile.name,
              fileBase64: base64String,
              mimeType: selectedFile.type || 'application/pdf',
              claimedIssuer: claimedIssuer.trim() || undefined,
              claimedExamId: claimedExamId.trim() || undefined,
              extractedTextHint: extractedTextHint.trim() || undefined,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            setDocError(data.error || 'Document verification failed.');
            cyberAudio.playCriticalAlert();
          } else {
            setDocResult(data);
            if (data.verificationStatus === 'OFFICIALLY VERIFIED' || data.verificationStatus === 'SAMPLE / PRACTICE DOCUMENT') {
              cyberAudio.playSuccess();
            } else {
              cyberAudio.playCriticalAlert();
            }
          }
        } catch (inner: any) {
          setDocError(inner.message || 'Network error processing document.');
          cyberAudio.playCriticalAlert();
        } finally {
          setIsDocVerifying(false);
        }
      };

      reader.onerror = () => {
        setDocError('Failed to read file locally.');
        setIsDocVerifying(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      setDocError(err.message || 'File processing error.');
      setIsDocVerifying(false);
    }
  };

  const handleCopySummary = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    cyberAudio.playSuccess();
  };

  // Helper for Shared Classification Badge
  const renderSharedBadge = (classification: SharedClassification) => {
    switch (classification) {
      case 'AUTHENTICITY_VERIFIED':
        return (
          <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 shadow-glow-emerald flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            AUTHENTICITY VERIFIED
          </span>
        );
      case 'VALID_INPUT':
        return (
          <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-glow-cyan flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-cyan-400" />
            VALID FORMAT (UNVERIFIED REP)
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/60 shadow-glow-amber flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            SUSPICIOUS — REVIEW REQUIRED
          </span>
        );
      case 'MALICIOUS_FRAUD_CONFIRMED':
        return (
          <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/60 shadow-glow-rose flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            MALICIOUS / FRAUD DETECTED
          </span>
        );
      case 'CHECK_UNAVAILABLE':
        return (
          <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-900 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-slate-400" />
            CHECK UNAVAILABLE
          </span>
        );
      case 'UNVERIFIED':
      default:
        return (
          <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/60 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
            UNVERIFIED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Card */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#090d21] via-[#0d1433] to-[#090d21] border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                VERIFICATION CENTER
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-purple-300 bg-purple-950/70 border border-purple-700/50">
                ZERO-TRUST TRIAGE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-darkwatch font-bold text-white tracking-tight" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
              Authenticity, Scam & Threat Verification Center
            </h1>
            <p className="text-sm text-cyan-300/90 max-w-2xl font-sans">
              Evidence-based verification for Indian & international telecom caller IDs (+91 first), destination URLs with SSRF protection, and official examination papers & academic certificates.
            </p>
          </div>

          {/* Quick Provider Status Indicators */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1.5 min-w-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">DoT / ITU-T Numbering:</span>
              <span className="text-emerald-400 font-bold">Active (+91)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">RFC 3986 & SSRF Guard:</span>
              <span className="text-cyan-400 font-bold">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">SHA-256 Doc Fingerprint:</span>
              <span className="text-purple-400 font-bold">Active</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
              <span className="text-slate-500">Live External Feeds:</span>
              <span className="text-amber-400 font-semibold">Honest Fallback Active</span>
            </div>
          </div>
        </div>

        {/* 3 Verification Mode Tabs */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-800/80 pt-6">
          <button
            onClick={() => {
              setActiveMode('PHONE');
              cyberAudio.playClick();
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              activeMode === 'PHONE'
                ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-400 text-white shadow-glow-cyan'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className={`p-2.5 rounded-xl border ${
              activeMode === 'PHONE' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <span>Phone Scam Check</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-600/40">+91 First</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Format, Patterns & Spam Risk</p>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveMode('URL');
              cyberAudio.playClick();
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              activeMode === 'URL'
                ? 'bg-gradient-to-r from-purple-950/80 to-pink-950/80 border-purple-400 text-white shadow-glow-purple'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className={`p-2.5 rounded-xl border ${
              activeMode === 'URL' ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Website / URL Verify</div>
              <p className="text-xs text-slate-400 mt-0.5">SSRF, Lookalike & Syntax</p>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveMode('DOCUMENT');
              cyberAudio.playClick();
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              activeMode === 'DOCUMENT'
                ? 'bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border-emerald-400 text-white shadow-glow-emerald'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className={`p-2.5 rounded-xl border ${
              activeMode === 'DOCUMENT' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <span>Document / Exam Paper</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-600/40">PDF/Img</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Sample vs Official Authority</p>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: PHONE NUMBER VERIFICATION (+91 INDIA FIRST) */}
      {/* ========================================================================= */}
      {activeMode === 'PHONE' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#090d21] border border-cyan-500/30 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-cyan-400" />
                  <span>Phone Number / Spam & Scam Risk Check</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Supports Indian DoT national numbering rules (+91 default) with E.164 normalization, repetitive pattern detection, and privacy masking.
                </p>
              </div>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-700/50 self-start sm:self-auto">
                INDIA (+91) DEFAULT
              </span>
            </div>

            <form onSubmit={handleVerifyPhone} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 font-mono">
                    Country Prefix:
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                  >
                    <option value="+91">🇮🇳 India (+91) - Default</option>
                    <option value="+1">🇺🇸 United States (+1)</option>
                    <option value="+44">🇬🇧 United Kingdom (+44)</option>
                    <option value="+971">🇦🇪 UAE (+971)</option>
                    <option value="+65">🇸🇬 Singapore (+65)</option>
                    <option value="+61">🇦🇺 Australia (+61)</option>
                  </select>
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-xs font-semibold text-slate-300 font-mono flex items-center justify-between">
                    <span>Subscriber / Mobile Number:</span>
                    <span className="text-[10px] text-slate-400">e.g. 98765 43210</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value)}
                      placeholder={countryCode === '+91' ? 'Enter 10-digit Indian mobile (e.g., 9876543210)...' : 'Enter phone number with digits...'}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-cyan-400 outline-none pr-32"
                    />
                    <button
                      type="submit"
                      disabled={isPhoneVerifying || !phoneNumberInput.trim()}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-glow-cyan"
                    >
                      {isPhoneVerifying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons for Indian Security Testing */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono">
                <span className="text-slate-400">Quick Test Samples:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+91');
                    setPhoneNumberInput('98765 43210');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  Sequential Pattern (+91 9876543210)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+91');
                    setPhoneNumberInput('99999 99999');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  Repeated Digits (+91 9999999999)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+91');
                    setPhoneNumberInput('98490 12345');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  Valid Mobile (+91 9849012345)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+91');
                    setPhoneNumberInput('12345');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  Invalid Length (+91 12345)
                </button>
              </div>
            </form>

            {phoneError && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-rose-300 text-xs font-mono flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{phoneError}</span>
              </div>
            )}
          </div>

          {/* Phone Result Card */}
          {phoneResult && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#090d21] border border-cyan-500/40 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    TELECOM RISK EVALUATION RESULT
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xl sm:text-2xl font-mono font-bold text-white">
                      {phoneResult.maskedNumber}
                    </span>
                    {phoneResult.e164Format && (
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        E.164: {phoneResult.e164Format}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {renderSharedBadge(phoneResult.sharedClassification)}
                  <button
                    onClick={() => handleCopySummary(`[DarkWatch AI Phone Verification]\nNumber: ${phoneResult.maskedNumber}\nStatus: ${phoneResult.reputationStatus}\nPlan: ${phoneResult.numberingPlan}\nExplanation: ${phoneResult.explanation}`)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Copy Report"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Status & Evidence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Country & Plan</span>
                  <p className="text-sm font-bold text-white">{phoneResult.countryName} ({phoneResult.countryCode})</p>
                  <p className="text-xs font-mono text-cyan-300">{phoneResult.numberingPlan}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Reputation Status</span>
                  <p className="text-sm font-bold text-amber-300">{phoneResult.reputationStatus}</p>
                  <p className="text-xs font-mono text-slate-400">{phoneResult.lineTypeDetected}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Risk Score Assessment</span>
                  <p className="text-sm font-bold text-white">
                    {phoneResult.riskScore !== null ? `${phoneResult.riskScore} / 100` : 'Unrated (Format Valid)'}
                  </p>
                  <p className="text-xs font-mono text-slate-400">
                    {phoneResult.riskScore !== null ? 'Algorithmically Scored' : 'Assignment Unverified'}
                  </p>
                </div>
              </div>

              {/* Explanation Box */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
                  <Info className="w-4 h-4" />
                  <span>ASSESSMENT RATIONALE & DETAILS</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {phoneResult.explanation}
                </p>
              </div>

              {/* Detailed Evidence Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider">
                  Verification Evidence Checklist ({phoneResult.evidence.length} Indicators)
                </h3>
                <div className="space-y-2">
                  {phoneResult.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs"
                    >
                      {ev.status === 'PASSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : ev.status === 'FLAGGED' ? (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      ) : ev.status === 'WARNING' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono">{ev.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{ev.sourceChecked}</span>
                        </div>
                        <p className="text-slate-300">{ev.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Recommendations */}
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 space-y-2 text-xs">
                <span className="font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  RECOMMENDED ANALYST ACTIONS & CALL ADVISORY
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {phoneResult.safetyRecommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Limitations Notice */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-300">Disclaimer & Technical Limitations: </span>
                  {phoneResult.limitations.join(' ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: WEBSITE / URL VERIFICATION */}
      {/* ========================================================================= */}
      {activeMode === 'URL' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#090d21] border border-purple-500/30 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  <span>Website / Destination URL Verification</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluates RFC 3986 syntax, enforces strict SSRF loopback & cloud metadata protection, and detects punycode homograph lookalikes.
                </p>
              </div>
              <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-3 py-1 rounded-xl border border-purple-700/50 self-start sm:self-auto">
                SSRF GUARD ACTIVE
              </span>
            </div>

            <form onSubmit={handleVerifyUrl} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 font-mono">
                  Destination URL to inspect:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://secure-login.example.com/account or domain..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-purple-400 outline-none pr-32"
                  />
                  <button
                    type="submit"
                    disabled={isUrlVerifying || !urlInput.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-glow-purple"
                  >
                    {isUrlVerifying ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Verify URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preset Test URLs */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono">
                <span className="text-slate-400">Quick Test Cases:</span>
                <button
                  type="button"
                  onClick={() => setUrlInput('https://wellsfargo-verify.top/login.html')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  Phishing Lookalike (.top)
                </button>
                <button
                  type="button"
                  onClick={() => setUrlInput('http://169.254.169.254/latest/meta-data/')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  SSRF Cloud Metadata
                </button>
                <button
                  type="button"
                  onClick={() => setUrlInput('http://127.0.0.1:8080/admin')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  SSRF Loopback (127.0.0.1)
                </button>
                <button
                  type="button"
                  onClick={() => setUrlInput('https://cbse.gov.in')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  Official Institutional URL
                </button>
              </div>
            </form>

            {urlError && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-rose-300 text-xs font-mono flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{urlError}</span>
              </div>
            )}
          </div>

          {/* URL Result Card */}
          {urlResult && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#090d21] border border-purple-500/40 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    URL SECURITY & INTEGRITY VERIFICATION
                  </span>
                  <div className="text-lg sm:text-xl font-mono font-bold text-white break-all">
                    {urlResult.normalizedUrl || urlResult.inputUrl}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {renderSharedBadge(urlResult.sharedClassification)}
                </div>
              </div>

              {/* SSRF Block Alert Banner */}
              {urlResult.isSsrfBlocked && (
                <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500 text-rose-200 text-xs font-mono flex items-center gap-3">
                  <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold">SSRF SECURITY POLICY ENFORCEMENT: </span>
                    {urlResult.ssrfBlockReason || 'Internal network / metadata IP target blocked.'}
                  </div>
                </div>
              )}

              {/* Rationale */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold">
                  <Info className="w-4 h-4" />
                  <span>ANALYSIS FINDINGS</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {urlResult.explanation}
                </p>
              </div>

              {/* Evidence Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider">
                  Security Evidence Checklist ({urlResult.evidence.length} Indicators)
                </h3>
                <div className="space-y-2">
                  {urlResult.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs"
                    >
                      {ev.status === 'PASSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : ev.status === 'FLAGGED' ? (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono">{ev.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{ev.sourceChecked}</span>
                        </div>
                        <p className="text-slate-300">{ev.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: DOCUMENT / EXAM PAPER VERIFICATION */}
      {/* ========================================================================= */}
      {activeMode === 'DOCUMENT' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#090d21] border border-emerald-500/30 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>Document & Exam Paper Verification</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Validates PDF, PNG, and JPG question papers, distinguishes legitimate mock/practice model papers from live exams, and compares cryptographic fingerprints against institutional records.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-700/50 self-start sm:self-auto">
                MAX 15MB • PDF / PNG / JPG
              </span>
            </div>

            <form onSubmit={handleVerifyDocument} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Upload Zone */}
                <div className="p-6 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 transition-colors flex flex-col items-center justify-center text-center space-y-3 cursor-pointer">
                  <Upload className="w-8 h-8 text-emerald-400 animate-pulse" />
                  <div className="space-y-1">
                    <label htmlFor="doc-upload" className="text-xs font-mono font-bold text-white cursor-pointer hover:underline">
                      {selectedFile ? selectedFile.name : 'Choose or Drop Document File'}
                    </label>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB • ${selectedFile.type || 'Unknown'}` : 'PDF, PNG, or JPG (Max 15MB)'}
                    </p>
                  </div>
                  <input
                    id="doc-upload"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Metadata Claims Inputs */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 font-mono">
                      Claimed Examination / Document Code:
                    </label>
                    <input
                      type="text"
                      value={claimedExamId}
                      onChange={(e) => setClaimedExamId(e.target.value)}
                      placeholder="e.g. CBSE-MATH-2026-041 or GATE-CS-2026..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 font-mono">
                      Claimed Issuing Organization:
                    </label>
                    <input
                      type="text"
                      value={claimedIssuer}
                      onChange={(e) => setClaimedIssuer(e.target.value)}
                      placeholder="e.g. Central Board of Secondary Education (CBSE)..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 font-mono">
                      Document Text / Watermark Hint (Optional):
                    </label>
                    <input
                      type="text"
                      value={extractedTextHint}
                      onChange={(e) => setExtractedTextHint(e.target.value)}
                      placeholder="e.g. 'Sample Question Paper for Practice Only'..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>Registered Official Registry: 2 official exam papers cataloged</span>
                </div>

                <button
                  type="submit"
                  disabled={isDocVerifying || !selectedFile}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-glow-emerald"
                >
                  {isDocVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Document...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      <span>Perform Authenticity Inspection</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {docError && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-rose-300 text-xs font-mono flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{docError}</span>
              </div>
            )}
          </div>

          {/* Document Verification Result */}
          {docResult && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#090d21] border border-emerald-500/40 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    DOCUMENT AUTHENTICITY REPORT
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg sm:text-xl font-mono font-bold text-white break-all">
                      {docResult.fileName}
                    </span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {(docResult.fileSizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {docResult.verificationStatus === 'OFFICIALLY VERIFIED' ? (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500 shadow-glow-emerald flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-400" />
                      OFFICIALLY VERIFIED
                    </span>
                  ) : docResult.verificationStatus === 'SAMPLE / PRACTICE DOCUMENT' ? (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-glow-cyan flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      SAMPLE / PRACTICE DOCUMENT
                    </span>
                  ) : docResult.verificationStatus === 'CONFIRMED MISMATCH' ? (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500 shadow-glow-rose flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      CONFIRMED MISMATCH
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      {docResult.verificationStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Sample Document Honest Clarification Notice */}
              {docResult.isSampleOrPractice && (
                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 text-cyan-200 text-xs font-sans space-y-1">
                  <span className="font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-400" />
                    EDUCATIONAL PRACTICE NOTICE
                  </span>
                  <p>
                    This document is explicitly identified as a <strong>Sample or Practice Question Paper</strong>. It is designed for student preparation and must NOT be classified as fake or forged merely because it differs from live examination papers.
                  </p>
                </div>
              )}

              {/* Cryptographic SHA-256 Fingerprint */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-purple-400" />
                    Cryptographic SHA-256 Fingerprint:
                  </span>
                  <button
                    onClick={() => handleCopySummary(docResult.sha256Hash)}
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Hash</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-white bg-slate-900 p-2.5 rounded-xl border border-slate-800 break-all select-all">
                  {docResult.sha256Hash}
                </div>
              </div>

              {/* Rationale */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                  <Info className="w-4 h-4" />
                  <span>VERIFICATION SUMMARY</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {docResult.explanation}
                </p>
              </div>

              {/* Evidence Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider">
                  Verification Evidence Checklist ({docResult.evidence.length} Indicators)
                </h3>
                <div className="space-y-2">
                  {docResult.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs"
                    >
                      {ev.status === 'PASSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : ev.status === 'FLAGGED' ? (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono">{ev.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{ev.sourceChecked}</span>
                        </div>
                        <p className="text-slate-300">{ev.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
