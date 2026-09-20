import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { useGradeStore } from '../store/gradeStore';
import { parseCubeFile } from '../lib/lut/parseCubeFile';

export const LutUpload: React.FC = () => {
  const setLut = useGradeStore((s) => s.setLut);
  const resetParams = useGradeStore((s) => s.resetParams);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({
    type: 'idle'
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.cube')) {
      setStatus({ type: 'error', message: 'Please select a valid .cube 3D LUT file.' });
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseCubeFile(text);

      setLut({
        name: parsed.title || file.name.replace(/\.cube$/i, ''),
        size: parsed.size,
        data: parsed.data
      });
      resetParams();

      setStatus({
        type: 'success',
        message: `Loaded "${file.name}" (${parsed.size}³)`
      });
    } catch (err: any) {
      console.error('Failed to parse .cube:', err);
      setStatus({ type: 'error', message: err.message || 'Failed to parse .cube file' });
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-lg">
      <input
        ref={fileInputRef}
        type="file"
        accept=".cube"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700/80 hover:text-white border border-zinc-700 rounded transition-colors"
      >
        <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
        <span>Import Custom .CUBE LUT</span>
      </button>

      {status.type === 'success' && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{status.message}</span>
        </div>
      )}

      {status.type === 'error' && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-mono">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{status.message}</span>
        </div>
      )}
    </div>
  );
};
