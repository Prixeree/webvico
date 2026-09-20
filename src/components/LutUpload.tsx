import React, { useRef, useState } from 'react';
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
      setStatus({ type: 'error', message: 'Invalid file. Expected .cube' });
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
        message: `${file.name} (${parsed.size}³)`
      });
    } catch (err: any) {
      console.error('Failed to parse .cube:', err);
      setStatus({ type: 'error', message: err.message || 'Failed to parse' });
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-2.5 bg-[#1C1E24] border border-white/[0.08] rounded-[2px]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".cube"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-1.5 px-2.5 text-xs font-normal text-zinc-300 bg-[#15161A] hover:text-[#E8E6E1] hover:border-white/[0.15] border border-white/[0.08] rounded-[2px] transition-colors cursor-pointer text-center"
      >
        Import .CUBE File
      </button>

      {status.type === 'success' && (
        <span className="text-[10px] font-mono text-[#5FB3A8] truncate block">
          {status.message}
        </span>
      )}

      {status.type === 'error' && (
        <span className="text-[10px] font-mono text-rose-400 truncate block">
          {status.message}
        </span>
      )}
    </div>
  );
};
