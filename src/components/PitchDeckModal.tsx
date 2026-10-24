/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Interactive Pitch Deck Presentation Viewer (Team SYNORA)
 */

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Presentation, Shield, Users, CheckCircle, Sparkles, Layers, Cpu } from 'lucide-react';
import { PITCH_SLIDES, TEAM_MEMBERS } from '../data/mock-security-data';

interface PitchDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PitchDeckModal: React.FC<PitchDeckModalProps> = ({ isOpen, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  if (!isOpen) return null;

  const slide = PITCH_SLIDES[currentSlideIndex];

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : PITCH_SLIDES.length - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev < PITCH_SLIDES.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-[#080d22] border border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Presentation className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold font-mono text-purple-300">
              DarkWatch AI Pitch Deck • Team SYNORA
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 font-bold">
              Slide {currentSlideIndex + 1} of {PITCH_SLIDES.length}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Stage Presentation Canvas */}
        <div className="p-6 sm:p-10 flex-1 overflow-y-auto flex flex-col justify-between relative bg-gradient-to-br from-[#0c122e] via-[#070b1c] to-[#050713]">
          {/* Cyber ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Slide Header */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400">
                {slide.number} • {slide.category}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {slide.title}
            </h2>

            <p className="text-sm sm:text-base text-cyan-300 font-medium">
              {slide.subtitle}
            </p>
          </div>

          {/* Slide Body Highlights */}
          <div className="my-6 relative z-10 space-y-3">
            {slide.highlights.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* Team Synora Credits on Title / Slide 01 */}
          {currentSlideIndex === 0 && (
            <div className="mt-4 p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 relative z-10">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                <Users className="w-4 h-4" /> Team SYNORA Roster
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {TEAM_MEMBERS.map((m) => (
                  <div key={m.name} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                    <span className="font-bold text-xs text-white block">{m.name}</span>
                    <span className="text-[10px] text-slate-400 leading-tight block">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slide Navigation Controls */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between relative z-10">
            <button
              onClick={handlePrev}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1.5">
              {PITCH_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlideIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentSlideIndex === i ? 'w-6 bg-purple-500' : 'bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-glow-purple"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
