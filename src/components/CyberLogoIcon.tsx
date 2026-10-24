/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Interactive Customizable Security Logo Insignia
 */

import React, { useState, useRef, useEffect } from 'react';
import { Shield, Eye, Lock, Radar, Cpu, Sparkles, Check, RefreshCw, Zap } from 'lucide-react';

export type InsigniaType = 'CYBER_EYE' | 'AEGIS_SHIELD' | 'QUANTUM_RADAR' | 'NEURAL_CORE' | 'ADAPTIVE_POSTURE';

interface CyberLogoIconProps {
  threatLevel?: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  unresolvedThreatCount?: number;
}

export const CyberLogoIcon: React.FC<CyberLogoIconProps> = ({ 
  threatLevel = 'ELEVATED',
  unresolvedThreatCount = 12 
}) => {
  const [insignia, setInsignia] = useState<InsigniaType>('CYBER_EYE');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // If adaptive posture is selected, determine the active visual representation based on threat load
  const isHighThreat = unresolvedThreatCount > 5;
  const effectiveInsignia = insignia === 'ADAPTIVE_POSTURE' 
    ? (isHighThreat ? 'CYBER_EYE' : 'AEGIS_SHIELD') 
    : insignia;

  const insigniaOptions: { id: InsigniaType; name: string; desc: string; icon: any; tag?: string }[] = [
    {
      id: 'CYBER_EYE',
      name: 'DarkWatch Cyber Eye',
      desc: 'Signature watchful eye with active cyber radar retina',
      icon: Eye,
      tag: 'Default',
    },
    {
      id: 'AEGIS_SHIELD',
      name: 'Aegis Zero-Trust Shield',
      desc: 'Armored cryptographic perimeter protection lock',
      icon: Shield,
    },
    {
      id: 'QUANTUM_RADAR',
      name: 'Sentinel 360° Radar Sweep',
      desc: 'High-frequency adversary beam scanner',
      icon: Radar,
    },
    {
      id: 'NEURAL_CORE',
      name: 'Neural AI Synapse',
      desc: 'Autonomous multi-signal threat correlation core',
      icon: Cpu,
    },
    {
      id: 'ADAPTIVE_POSTURE',
      name: 'Smart Adaptive Emblem',
      desc: 'Dynamically shifts symbol and aura based on live threat posture',
      icon: Zap,
      tag: 'AI-Dynamic',
    },
  ];

  return (
    <div ref={containerRef} className="relative">
      {/* Interactive Main Logo Badge */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-cyan-400 p-0.5 shadow-glow-purple flex items-center justify-center cursor-pointer transition-transform hover:scale-105 group"
        title="Click to customize DarkWatch AI Security Insignia & Dynamic Adaptation"
        aria-label="Customize DarkWatch AI Insignia"
      >
        <div className="w-full h-full bg-[#070b1a] rounded-[10px] flex items-center justify-center relative overflow-hidden">
          {/* Cyber scanline overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent opacity-40 animate-scanline pointer-events-none" />

          {/* Insignia Graphic Render */}
          {effectiveInsignia === 'CYBER_EYE' && (
            <div className="relative flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full border border-cyan-300 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </div>
              </div>
            </div>
          )}

          {effectiveInsignia === 'AEGIS_SHIELD' && (
            <div className="relative flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
          )}

          {effectiveInsignia === 'QUANTUM_RADAR' && (
            <div className="relative flex items-center justify-center">
              <Radar className="w-5 h-5 text-emerald-400 animate-spin-slow drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
          )}

          {effectiveInsignia === 'NEURAL_CORE' && (
            <div className="relative flex items-center justify-center">
              <Cpu className="w-5 h-5 text-pink-400 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            </div>
          )}
        </div>

        {/* Small corner gear/sparkle icon to hint interactivity */}
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-purple-600 border border-slate-900 rounded-full flex items-center justify-center text-[8px] text-cyan-300 shadow">
          ✦
        </span>
      </button>

      {/* Popover Customizer Menu */}
      {isOpen && (
        <div className="absolute left-0 top-12 z-50 w-72 bg-[#0a0f26] border border-purple-500/50 rounded-xl shadow-2xl p-3 text-xs animate-fadeIn backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> DarkWatch Security Emblem
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40">
              SWITCHER
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
            Select your preferred security symbol or enable Smart Adaptive mode to automatically adjust with live threat posture:
          </p>

          <div className="space-y-1.5">
            {insigniaOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = insignia === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setInsignia(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/70 border border-purple-500/60 text-white'
                      : 'hover:bg-slate-900 border border-transparent text-slate-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-800 text-purple-300'} mt-0.5 flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs flex items-center justify-between gap-1">
                      <span className="truncate">{opt.name}</span>
                      <div className="flex items-center gap-1">
                        {opt.tag && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                            {opt.tag}
                          </span>
                        )}
                        {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
