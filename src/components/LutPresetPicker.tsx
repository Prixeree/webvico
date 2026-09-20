import React, { useState } from 'react';
import { useGradeStore } from '../store/gradeStore';
import { parseCubeFile } from '../lib/lut/parseCubeFile';

interface Preset {
  id: string;
  name: string;
  url: string;
  type: 'neutral' | 'warm' | 'cool';
}

const PRESETS: Preset[] = [
  { id: 'neutral', name: 'None / Neutral', url: './luts/identity.cube', type: 'neutral' },
  { id: 'warm_film', name: 'Warm Film', url: './luts/warm_film.cube', type: 'warm' },
  { id: 'teal_orange', name: 'Teal & Orange', url: './luts/teal_orange.cube', type: 'cool' },
  { id: 'black_white', name: 'Black & White', url: './luts/black_white.cube', type: 'neutral' },
  { id: 'bleach_bypass', name: 'Bleach Bypass', url: './luts/bleach_bypass.cube', type: 'cool' }
];

export const LutPresetPicker: React.FC = () => {
  const activeLut = useGradeStore((s) => s.activeLut);
  const setLut = useGradeStore((s) => s.setLut);
  const resetParams = useGradeStore((s) => s.resetParams);
  const [selectedId, setSelectedId] = useState<string>('neutral');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelectPreset = async (preset: Preset) => {
    if (preset.id === 'neutral') {
      setSelectedId('neutral');
      setLut(null);
      resetParams();
      return;
    }

    try {
      setLoadingId(preset.id);
      const res = await fetch(preset.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseCubeFile(text);

      setSelectedId(preset.id);
      setLut({
        name: preset.name,
        size: parsed.size,
        data: parsed.data
      });
      resetParams();
    } catch (err) {
      console.error('Failed to load LUT preset:', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-[#1C1E24] border border-white/[0.08] rounded-[2px]">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
        <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
          Presets
        </span>
        {activeLut && (
          <span className="text-[10px] font-mono text-[#5FB3A8] bg-[#5FB3A8]/10 border border-[#5FB3A8]/30 px-1.5 py-0.2 rounded-[2px]">
            {activeLut.name}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {PRESETS.map((preset) => {
          const isActive = selectedId === preset.id;
          const isLoading = loadingId === preset.id;

          const accentBorder =
            preset.type === 'warm'
              ? 'border-[#D9822B] text-[#D9822B] bg-[#D9822B]/10'
              : preset.type === 'cool'
              ? 'border-[#5FB3A8] text-[#5FB3A8] bg-[#5FB3A8]/10'
              : 'border-[#E8E6E1] text-[#E8E6E1] bg-white/[0.04]';

          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              disabled={isLoading}
              className={`px-2.5 py-1.5 text-xs rounded-[2px] border text-left transition-colors cursor-pointer ${
                isActive
                  ? accentBorder
                  : 'border-white/[0.08] bg-[#15161A] text-zinc-400 hover:text-[#E8E6E1] hover:border-white/[0.15]'
              }`}
            >
              <span className="truncate block">{isLoading ? 'Loading...' : preset.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
