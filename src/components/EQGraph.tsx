import React, { useRef, useEffect, useState } from 'react';
import { TargetCurve, DSPProfile, HeadphonePoint } from '../types';
import { generateLogFrequencies, computeProfileResponse, computeBiquadGainAtFreq } from '../utils/dspMath';

interface EQGraphProps {
  profile: DSPProfile;
  selectedFilterId: string | null;
  targetCurve: TargetCurve | null;
  measurementPoints: HeadphonePoint[] | null;
  showTarget: boolean;
  showMeasurement: boolean;
  showIndividualFilters: boolean;
  onFilterChange?: (filterId: string, newFreq: number, newGain: number) => void;
  onSelectFilter?: (filterId: string) => void;
}

export const EQGraph: React.FC<EQGraphProps> = ({
  profile,
  selectedFilterId,
  targetCurve,
  measurementPoints,
  showTarget,
  showMeasurement,
  showIndividualFilters,
  onFilterChange,
  onSelectFilter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredFilterId, setHoveredFilterId] = useState<string | null>(null);
  const [draggingFilterId, setDraggingFilterId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number; freq: number; gain: number } | null>(null);

  const MIN_FREQ = 20;
  const MAX_FREQ = 20000;
  const MIN_DB = -18;
  const MAX_DB = 18;

  // Log coordinate converters
  const freqToX = (freq: number, width: number, paddingLeft: number, graphWidth: number): number => {
    const logMin = Math.log10(MIN_FREQ);
    const logMax = Math.log10(MAX_FREQ);
    const logF = Math.log10(Math.max(MIN_FREQ, Math.min(MAX_FREQ, freq)));
    return paddingLeft + ((logF - logMin) / (logMax - logMin)) * graphWidth;
  };

  const xToFreq = (x: number, paddingLeft: number, graphWidth: number): number => {
    const logMin = Math.log10(MIN_FREQ);
    const logMax = Math.log10(MAX_FREQ);
    const ratio = Math.max(0, Math.min(1, (x - paddingLeft) / graphWidth));
    return Math.pow(10, logMin + ratio * (logMax - logMin));
  };

  const dbToY = (db: number, height: number, paddingTop: number, graphHeight: number): number => {
    const clampedDb = Math.max(MIN_DB, Math.min(MAX_DB, db));
    return paddingTop + ((MAX_DB - clampedDb) / (MAX_DB - MIN_DB)) * graphHeight;
  };

  const yToDb = (y: number, paddingTop: number, graphHeight: number): number => {
    const ratio = Math.max(0, Math.min(1, (y - paddingTop) / graphHeight));
    return MAX_DB - ratio * (MAX_DB - MIN_DB);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 35;
    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    // Clear background
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.lineWidth = 1;

    // Horizontal dB grid lines
    const dbSteps = [-12, -6, 0, 6, 12];
    dbSteps.forEach(db => {
      const y = dbToY(db, height, paddingTop, graphHeight);
      ctx.strokeStyle = db === 0 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = db === 0 ? '#94a3b8' : '#475569';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${db > 0 ? '+' : ''}${db} dB`, paddingLeft - 8, y + 3);
    });

    // Vertical Frequency grid lines
    const freqSteps = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    freqSteps.forEach(f => {
      const x = freqToX(f, width, paddingLeft, graphWidth);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, height - paddingBottom);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      const label = f >= 1000 ? `${f / 1000}k` : `${f}`;
      ctx.fillText(label, x, height - paddingBottom + 16);
    });

    // Render Measurement Curve (if enabled)
    if (showMeasurement && measurementPoints && measurementPoints.length > 0) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();

      // Normalize measurement relative to 1kHz = 0dB
      const refPoint = measurementPoints.find(p => p.freq === 1000) || measurementPoints[Math.floor(measurementPoints.length / 2)];
      const offset = refPoint ? refPoint.spl : 83.0;

      measurementPoints.forEach((p, idx) => {
        const x = freqToX(p.freq, width, paddingLeft, graphWidth);
        const y = dbToY(p.spl - offset, height, paddingTop, graphHeight);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Render Target Curve (if enabled)
    if (showTarget && targetCurve && targetCurve.points.length > 0) {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      targetCurve.points.forEach((p, idx) => {
        const x = freqToX(p.freq, width, paddingLeft, graphWidth);
        const y = dbToY(p.spl, height, paddingTop, graphHeight);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Render Individual Filter Curves (if enabled)
    if (showIndividualFilters) {
      const freqs = generateLogFrequencies(180, MIN_FREQ, MAX_FREQ);
      profile.filters.forEach(filter => {
        if (!filter.enabled) return;
        ctx.strokeStyle = filter.id === selectedFilterId ? '#d4af37' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = filter.id === selectedFilterId ? 1.5 : 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        freqs.forEach((f, idx) => {
          const gain = computeBiquadGainAtFreq(filter.type, filter.freq, filter.gain, filter.q, f);
          const x = freqToX(f, width, paddingLeft, graphWidth);
          const y = dbToY(gain, height, paddingTop, graphHeight);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Render Combined Profile Frequency Response Curve
    const freqs = generateLogFrequencies(300, MIN_FREQ, MAX_FREQ);
    const gains = computeProfileResponse(profile, freqs);

    // Gradient fill under curve
    const gradient = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.25)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

    ctx.beginPath();
    ctx.moveTo(paddingLeft, dbToY(profile.preampDb, height, paddingTop, graphHeight));
    freqs.forEach((f, idx) => {
      const x = freqToX(f, width, paddingLeft, graphWidth);
      const y = dbToY(gains[idx], height, paddingTop, graphHeight);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(width - paddingRight, dbToY(0, height, paddingTop, graphHeight));
    ctx.lineTo(paddingLeft, dbToY(0, height, paddingTop, graphHeight));
    ctx.fillStyle = gradient;
    ctx.fill();

    // Solid Combined Line in Aurelius Gold
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    freqs.forEach((f, idx) => {
      const x = freqToX(f, width, paddingLeft, graphWidth);
      const y = dbToY(gains[idx], height, paddingTop, graphHeight);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Render Interactive Filter Nodes
    profile.filters.forEach((filter, idx) => {
      if (!filter.enabled) return;
      const x = freqToX(filter.freq, width, paddingLeft, graphWidth);
      const y = dbToY(filter.gain + profile.preampDb, height, paddingTop, graphHeight);
      const isSelected = filter.id === selectedFilterId;
      const isHovered = filter.id === hoveredFilterId;

      // Glow effect for selected/hovered node
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(212, 175, 55, 0.35)' : 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#d4af37' : '#fef08a';
      ctx.strokeStyle = '#0a0a0c';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Node index number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${idx + 1}`, x, y - 8);
    });
  }, [profile, selectedFilterId, hoveredFilterId, targetCurve, measurementPoints, showTarget, showMeasurement, showIndividualFilters]);

  // Mouse drag & hover handling
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 35;
    const graphWidth = rect.width - paddingLeft - paddingRight;
    const graphHeight = rect.height - paddingTop - paddingBottom;

    // Find nearest filter within 15px radius
    let foundFilterId: string | null = null;
    profile.filters.forEach(f => {
      if (!f.enabled) return;
      const fx = freqToX(f.freq, rect.width, paddingLeft, graphWidth);
      const fy = dbToY(f.gain + profile.preampDb, rect.height, paddingTop, graphHeight);
      const dist = Math.hypot(x - fx, y - fy);
      if (dist <= 15) {
        foundFilterId = f.id;
      }
    });

    if (foundFilterId) {
      setDraggingFilterId(foundFilterId);
      if (onSelectFilter) onSelectFilter(foundFilterId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 35;
    const graphWidth = rect.width - paddingLeft - paddingRight;
    const graphHeight = rect.height - paddingTop - paddingBottom;

    const curFreq = Math.round(xToFreq(x, paddingLeft, graphWidth));
    const curDb = Math.round(yToDb(y, paddingTop, graphHeight) * 10) / 10;
    setMousePos({ x, y, freq: curFreq, gain: curDb });

    if (draggingFilterId && onFilterChange) {
      const newFreq = Math.max(20, Math.min(20000, curFreq));
      const newGain = Math.max(-18, Math.min(18, curDb - profile.preampDb));
      onFilterChange(draggingFilterId, newFreq, newGain);
      return;
    }

    // Hover detection
    let foundHover: string | null = null;
    profile.filters.forEach(f => {
      if (!f.enabled) return;
      const fx = freqToX(f.freq, rect.width, paddingLeft, graphWidth);
      const fy = dbToY(f.gain + profile.preampDb, rect.height, paddingTop, graphHeight);
      if (Math.hypot(x - fx, y - fy) <= 15) {
        foundHover = f.id;
      }
    });
    setHoveredFilterId(foundHover);
  };

  const handleMouseUp = () => {
    setDraggingFilterId(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-white/5 bg-[#0d0d0f] shadow-2xl select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setDraggingFilterId(null);
          setHoveredFilterId(null);
          setMousePos(null);
        }}
      />

      {/* Legend & Hover Cursor Overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-3 text-[10px] bg-[#151518]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 pointer-events-none">
        <span className="flex items-center gap-1.5 text-[#d4af37] font-semibold">
          <span className="w-2.5 h-0.5 bg-[#d4af37] inline-block rounded" />
          Combined EQ ({profile.name})
        </span>

        {showTarget && targetCurve && (
          <span className="flex items-center gap-1.5 text-purple-400 font-medium">
            <span className="w-2.5 h-0.5 bg-purple-400 border-b border-dashed inline-block" />
            Target: {targetCurve.name}
          </span>
        )}

        {showMeasurement && (
          <span className="flex items-center gap-1.5 text-amber-400 font-medium">
            <span className="w-2.5 h-0.5 bg-amber-400 border-b border-dashed inline-block" />
            Ref: G PRO X Wired
          </span>
        )}

        {mousePos && (
          <span className="font-mono text-slate-300 ml-2 pl-2 border-l border-white/10">
            {mousePos.freq >= 1000 ? `${(mousePos.freq / 1000).toFixed(2)} kHz` : `${mousePos.freq} Hz`} / {mousePos.gain > 0 ? '+' : ''}{mousePos.gain.toFixed(1)} dB
          </span>
        )}
      </div>
    </div>
  );
};
