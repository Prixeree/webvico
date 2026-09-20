import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Sliders } from 'lucide-react';
import { useGradeStore } from '../store/gradeStore';
import { DEFAULT_GRADE_PARAMS } from '../lib/ai/types';

export const GradingPanel: React.FC = () => {
  const params = useGradeStore((s) => s.params);
  const setParam = useGradeStore((s) => s.setParam);
  const resetParams = useGradeStore((s) => s.resetParams);

  // Helper for single slider
  const renderSlider = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (val: number) => void,
    onReset: () => void,
    formatVal: (val: number) => string,
    trackStyle?: string
  ) => (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.1 }}
      className="flex flex-col gap-1.5 py-1"
    >
      <div className="flex items-center justify-between text-xs">
        <label
          onDoubleClick={onReset}
          className="text-zinc-300 font-medium cursor-pointer hover:text-cyan-400 select-none transition-colors"
          title="Double-click to reset"
        >
          {label}
        </label>
        <span className="font-mono text-[11px] text-cyan-300 min-w-[50px] text-right">
          {formatVal(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400 ${trackStyle || ''}`}
      />
    </motion.div>
  );

  return (
    <div className="flex flex-col gap-5 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-lg">
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-2 text-zinc-200">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Manual Grade</h3>
        </div>
        <button
          onClick={resetParams}
          className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
          title="Reset all manual parameters"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Primary Corrections */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
          Primary
        </span>

        {renderSlider(
          'Exposure',
          params.exposure,
          -1.0,
          1.0,
          0.02,
          (v) => setParam('exposure', v),
          () => setParam('exposure', DEFAULT_GRADE_PARAMS.exposure),
          (v) => `${v >= 0 ? '+' : ''}${(v * 2.0).toFixed(2)} EV`
        )}

        {renderSlider(
          'Contrast',
          params.contrast,
          -1.0,
          1.0,
          0.02,
          (v) => setParam('contrast', v),
          () => setParam('contrast', DEFAULT_GRADE_PARAMS.contrast),
          (v) => (v + 1.0).toFixed(2)
        )}

        {renderSlider(
          'Saturation',
          params.saturation,
          -1.0,
          1.0,
          0.02,
          (v) => setParam('saturation', v),
          () => setParam('saturation', DEFAULT_GRADE_PARAMS.saturation),
          (v) => `${Math.round((v + 1.0) * 100)}%`
        )}
      </div>

      {/* White Balance */}
      <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800/40">
        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
          White Balance
        </span>

        {renderSlider(
          'Temperature',
          params.temperature,
          -1.0,
          1.0,
          0.02,
          (v) => setParam('temperature', v),
          () => setParam('temperature', DEFAULT_GRADE_PARAMS.temperature),
          (v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)),
          'accent-amber-400'
        )}

        {renderSlider(
          'Tint',
          params.tint,
          -1.0,
          1.0,
          0.02,
          (v) => setParam('tint', v),
          () => setParam('tint', DEFAULT_GRADE_PARAMS.tint),
          (v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)),
          'accent-fuchsia-400'
        )}
      </div>

      {/* Split Toning: Shadows RGB */}
      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/40">
        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
          Shadows Tint (RGB)
        </span>
        <div className="grid grid-cols-3 gap-2">
          {['R', 'G', 'B'].map((ch, i) => (
            <div key={`shadow-${ch}`} className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className={i === 0 ? 'text-rose-400' : i === 1 ? 'text-emerald-400' : 'text-blue-400'}>
                  {ch}
                </span>
                <span className="text-zinc-400">{params.shadows_rgb[i].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={-0.3}
                max={0.3}
                step={0.01}
                value={params.shadows_rgb[i]}
                onChange={(e) => {
                  const updated = [...params.shadows_rgb] as [number, number, number];
                  updated[i] = parseFloat(e.target.value);
                  setParam('shadows_rgb', updated);
                }}
                className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-zinc-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Split Toning: Highlights RGB */}
      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/40">
        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
          Highlights Tint (RGB)
        </span>
        <div className="grid grid-cols-3 gap-2">
          {['R', 'G', 'B'].map((ch, i) => (
            <div key={`highlight-${ch}`} className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className={i === 0 ? 'text-rose-400' : i === 1 ? 'text-emerald-400' : 'text-blue-400'}>
                  {ch}
                </span>
                <span className="text-zinc-400">{params.highlights_rgb[i].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={-0.3}
                max={0.3}
                step={0.01}
                value={params.highlights_rgb[i]}
                onChange={(e) => {
                  const updated = [...params.highlights_rgb] as [number, number, number];
                  updated[i] = parseFloat(e.target.value);
                  setParam('highlights_rgb', updated);
                }}
                className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-zinc-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
