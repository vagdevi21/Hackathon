/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Global Threat Heatmap Canvas Component
 */

import React, { useRef, useEffect, useState } from 'react';
import { Flame, Shield, MapPin, ZoomIn, Sliders, Globe2, Radio, Activity } from 'lucide-react';

interface HeatPoint {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  intensity: number; // 0.1 to 1.0
  vector: string;
  attacksCount: number;
  radius: number;
}

export const GlobalThreatHeatmap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [intensityFilter, setIntensityFilter] = useState<number>(0.8);
  const [selectedPoint, setSelectedPoint] = useState<HeatPoint | null>(null);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'BOTNET' | 'EXPLOIT' | 'TOR'>('ALL');

  // Heatmap hotspot cluster origins across the globe
  const heatPoints: HeatPoint[] = [
    { id: 'HP-1', name: 'Frankfurt Tor Cluster', country: 'Germany', lat: 50.1109, lng: 8.6821, intensity: 0.95, vector: 'Tor Exit Node Relay', attacksCount: 4210, radius: 45 },
    { id: 'HP-2', name: 'Eastern Seaboard SYN Sweep', country: 'United States', lat: 40.7128, lng: -74.006, intensity: 0.88, vector: 'DNS Tunneling & Exploit Probe', attacksCount: 3840, radius: 40 },
    { id: 'HP-3', name: 'Bengaluru IoT Botnet', country: 'India', lat: 12.9716, lng: 77.5946, intensity: 0.92, vector: 'Distributed Port Scan Burst', attacksCount: 5120, radius: 42 },
    { id: 'HP-4', name: 'Singapore C2 Beacon Hub', country: 'Singapore', lat: 1.3521, lng: 103.8198, intensity: 0.78, vector: 'Cobalt Strike Memory Injection', attacksCount: 1980, radius: 36 },
    { id: 'HP-5', name: 'São Paulo Egress Scan', country: 'Brazil', lat: -23.5505, lng: -46.6333, intensity: 0.72, vector: 'Cloud S3 Policy Hijack', attacksCount: 1650, radius: 32 },
    { id: 'HP-6', name: 'Amsterdam Rapid Reset Array', country: 'Netherlands', lat: 52.3676, lng: 4.9041, intensity: 0.85, vector: 'HTTP/2 Stream Exhaustion', attacksCount: 3400, radius: 38 },
    { id: 'HP-7', name: 'Tokyo Fast-Flux Resolver', country: 'Japan', lat: 35.6762, lng: 139.6503, intensity: 0.65, vector: 'Dynamic DNS C2 Flux', attacksCount: 1420, radius: 30 },
    { id: 'HP-8', name: 'Sydney Perimeter Scanner', country: 'Australia', lat: -33.8688, lng: 151.2093, intensity: 0.58, vector: 'SMB / RDP Credential Probe', attacksCount: 980, radius: 26 },
  ];

  // Helper to convert lat/lng to canvas coordinates
  const projectCoordinates = (lat: number, lng: number, width: number, height: number) => {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let pulseStep = 0;

    const render = () => {
      pulseStep += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Draw stylized background continent patches
      ctx.fillStyle = '#080d24';
      ctx.fillRect(0, 0, width, height);

      // Grid coordinate lines
      ctx.strokeStyle = 'rgba(30, 45, 90, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 6]);

      for (let x = 0; x < width; x += width / 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += height / 6) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw each heat spot with radial gradient intensity
      heatPoints.forEach((hp) => {
        const coords = projectCoordinates(hp.lat, hp.lng, width, height);
        const dynamicRadius = hp.radius * intensityFilter * (1 + 0.12 * Math.sin(pulseStep + hp.lat));

        // Radial gradient: white-hot center -> red -> orange -> transparent violet
        const gradient = ctx.createRadialGradient(
          coords.x,
          coords.y,
          0,
          coords.x,
          coords.y,
          dynamicRadius
        );

        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(0.2, 'rgba(239, 68, 68, 0.85)');
        gradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.55)');
        gradient.addColorStop(0.8, 'rgba(139, 92, 246, 0.25)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, dynamicRadius, 0, Math.PI * 2);
        ctx.fill();

        // Glowing center core point
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Expanding outer ripple wave
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const ripple = (dynamicRadius * 1.3) % (hp.radius * 1.5);
        ctx.arc(coords.x, coords.y, ripple, 0, Math.PI * 2);
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensityFilter]);

  return (
    <div className="cyber-card rounded-2xl p-5 border border-purple-900/40 relative overflow-hidden space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Global Threat Density Heatmap
              <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950/80 border border-red-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                CANVAS ENGINE 60 FPS
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Multi-scale heat dispersion mapping volumetric adversary payloads and distributed botnet nodes.
            </p>
          </div>
        </div>

        {/* Heat Intensity Slider */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-mono">Heat Gain:</span>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={intensityFilter}
            onChange={(e) => setIntensityFilter(parseFloat(e.target.value))}
            className="w-24 accent-purple-500 cursor-pointer"
          />
          <span className="text-cyan-300 font-mono font-bold">{Math.round(intensityFilter * 100)}%</span>
        </div>
      </div>

      {/* Canvas World Heatmap Viewport */}
      <div className="relative w-full aspect-[2/1] min-h-[260px] sm:min-h-[340px] bg-[#070b1c] rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-full select-none"
        />

        {/* Floating Top-Right Legend */}
        <div className="absolute top-3 right-3 bg-slate-950/85 border border-slate-800 px-3 py-2 rounded-xl backdrop-blur-md text-[11px] font-mono space-y-1 hidden sm:block">
          <span className="text-slate-300 font-bold block mb-1">Density Intensity</span>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-2 rounded bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500" />
            <span className="text-slate-400">Low ➔ Critical</span>
          </div>
        </div>

        {/* Floating Bottom Live Attack Telemetry Counter */}
        <div className="absolute bottom-3 left-3 bg-slate-950/85 border border-slate-800 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-red-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Active Vectors: <strong>22,600 / min</strong>
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-cyan-400 hidden sm:inline">
            Heat Clusters: <strong>8 Primary Geo-Hubs</strong>
          </span>
        </div>
      </div>

      {/* Cluster Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {heatPoints.slice(0, 4).map((hp) => (
          <div
            key={hp.id}
            onClick={() => setSelectedPoint(hp)}
            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{hp.country}</h4>
              <span className="text-[10px] font-mono text-slate-400 block truncate">{hp.vector}</span>
            </div>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-900/40">
              {hp.attacksCount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
