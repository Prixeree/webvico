import React from 'react';
import { useGradeStore } from '../store/gradeStore';
import { DEFAULT_GRADE_PARAMS } from '../lib/ai/types';

export const GradingPanel: React.FC = () => {
  const params = useGradeStore((s) => s.params);
  const setParam = useGradeStore((s) => s.setParam);
  const resetParams = useGradeStore((s) => s.resetParams);

  const renderSlider = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (val: number) => void,
    onReset: () => void,
    formatVal: (val: number) => string,
    sliderType: 'cool' | 'warm' | 'neutral' = 'neutral'
  ) => (
    <div className="flex flex-col gap-1 py-0.5">
      <div className="flex items-center justify-between text-xs">
        <label
          onDoubleClick={onReset}
          className="text-zinc-300 font-normal cursor-pointer hover:text-[#E8E6E1] select-none"
          title="Double-click to reset"
        >
          {label}
        </label>
        <span className="font-mono tabular-nums text-[11px] text-[#E8E6E1]">
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
        className={`w-full ${
          sliderType === 'cool'
            ? 'slider-cool'
            : sliderType === 'warm'
            ? 'slider-warm'
            : ''
        }`}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-3 bg-[#1C1E24] border border-white/[0.08] rounded-[2px]">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
        <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
          Color Adjustments
        </span>
        <button
          onClick={resetParams}
          className="text-[11px] text-zinc-400 hover:text-[#E8E6E1] transition-colors"
          title="Reset all manual parameters"
        >
          Reset
        </button>
      </div>

      {/* Primary Corrections */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-mono text-zinc-500 uppercase">
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
          (v) => `${v >= 0 ? '+' : ''}${(v * 2.0).toFixed(2)} EV`,
          params.exposure >= 0 ? 'warm' : 'cool'
        )}

        {renderSlider(
          'Contrast',
          params.contrast,
          -1.0,
          1.0,
          0.02,
          (v) => setParam('contrast', v),
          () => setParam('contrast', DEFAULT_GRADE_PARAMS.contrast),
          (v) => (v + 1.0).toFixed(2),
          'neutral'
        )}

        {renderSlider(
          'Saturation',
          params.saturation,
          -1.0,
          1.0,
          0.02,
          (v) => setParam('saturation', v),
          () => setParam('saturation', DEFAULT_GRADE_PARAMS.saturation),
          (v) => `${Math.round((v + 1.0) * 100)}%`,
          'neutral'
        )}
      </div>

      {/* White Balance */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
        <span className="text-[10px] font-mono text-zinc-500 uppercase">
          Balance
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
          params.temperature >= 0 ? 'warm' : 'cool'
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
          params.tint >= 0 ? 'warm' : 'cool'
        )}
      </div>

      {/* Shadows RGB (Cool Accent: #5FB3A8) */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">
            Shadows Tint (Cool)
          </span>
          <span className="w-2 h-2 rounded-[1px] bg-[#5FB3A8]" title="Cool channel" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['R', 'G', 'B'].map((ch, i) => (
            <div key={`shadow-${ch}`} className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono tabular-nums">
                <span className="text-zinc-400">{ch}</span>
                <span className="text-[#5FB3A8]">{params.shadows_rgb[i].toFixed(2)}</span>
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
                className="w-full slider-cool"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Highlights RGB (Warm Accent: #D9822B) */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">
            Highlights Tint (Warm)
          </span>
          <span className="w-2 h-2 rounded-[1px] bg-[#D9822B]" title="Warm channel" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['R', 'G', 'B'].map((ch, i) => (
            <div key={`highlight-${ch}`} className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono tabular-nums">
                <span className="text-zinc-400">{ch}</span>
                <span className="text-[#D9822B]">{params.highlights_rgb[i].toFixed(2)}</span>
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
                className="w-full slider-warm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
