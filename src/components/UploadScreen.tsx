import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Sparkles } from 'lucide-react';
import { useGradeStore } from '../store/gradeStore';

interface UploadScreenProps {
  onLoadSample: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onLoadSample }) => {
  const setVideoSrc = useGradeStore((s) => s.setVideoSrc);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setVideoSrc(url, file.name);
      }
    },
    [setVideoSrc]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.mov', '.ogg']
    },
    multiple: false
  });

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center select-none">
      <div
        {...getRootProps()}
        className={`w-full max-w-xl p-12 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center gap-4 ${
          isDragActive
            ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(0,242,254,0.15)]'
            : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-cyan-400 shadow-lg">
          <Upload className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
            Drop your video footage here
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Supports MP4, WebM, MOV & OGG (processed 100% locally in browser)
          </p>
        </div>
        <button
          type="button"
          className="mt-2 px-4 py-2 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors"
        >
          Select Video File
        </button>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">or</span>
      </div>

      <button
        onClick={onLoadSample}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 rounded-lg transition-all shadow-sm"
      >
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <span>Load Synthetic Test Footage (Macbeth Chart & Gradients)</span>
      </button>
    </div>
  );
};
