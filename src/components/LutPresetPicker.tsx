import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useGradeStore } from '../store/gradeStore';
import { parseCubeFile } from '../lib/lut/parseCubeFile';

interface Preset {
  id: string;
  name: string;
  url: string;
}

const PRESETS: Preset[] = [
  { id: 'neutral', name: 'None / Neutral', url: './luts/identity.cube' },
  { id: 'warm_film', name: 'Warm Film', url: './luts/warm_film.cube' },
  { id: 'teal_orange', name: 'Teal & Orange', url: './luts/teal_orange.cube' },
  { id: 'black_white', name: 'Black & White', url: './luts/black_white.cube' },
  { id: 'bleach_bypass', name: 'Bleach Bypass', url: './luts/bleach_bypass.cube' }
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
      // Per spec: Selecting one sets the 3D LUT texture and resets manual sliders to neutral
      resetParams();
    } catch (err) {
      console.error('Failed to load LUT preset:', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-200">
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">LUT Presets</h3>
        </div>
        {activeLut && (
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
            {activeLut.name} ({activeLut.size}³)
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset) => {
          const isActive = selectedId === preset.id;
          const isLoading = loadingId === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              disabled={isLoading}
              className={`flex items-center justify-between px-3 py-2 text-xs rounded border text-left transition-all ${
                isActive
                  ? 'border-cyan-500/80 bg-cyan-950/30 text-cyan-300 shadow-[0_0_10px_rgba(0,242,254,0.1)]'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 hover:border-zinc-700'
              }`}
            >
              <span className="truncate">{isLoading ? 'Loading...' : preset.name}</span>
              {isActive && <Check className="w-3 h-3 text-cyan-400 shrink-0 ml-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
