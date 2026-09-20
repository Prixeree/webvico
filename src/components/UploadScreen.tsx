import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
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
    <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center select-none bg-[#15161A]">
      <div
        {...getRootProps()}
        className={`w-full max-w-md p-10 border transition-colors cursor-pointer flex flex-col items-center gap-3 rounded-[2px] ${
          isDragActive
            ? 'border-[#5FB3A8] bg-[#5FB3A8]/5'
            : 'border-white/[0.08] bg-[#1C1E24] hover:border-white/[0.15]'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-sm font-medium text-[#E8E6E1]">
            Drop video footage here
          </h2>
          <p className="text-xs text-zinc-400">
            MP4, WebM, MOV or OGG
          </p>
        </div>
        <button
          type="button"
          className="mt-2 px-3 py-1.5 text-xs text-zinc-300 bg-[#15161A] border border-white/[0.08] rounded-[2px] hover:text-[#E8E6E1] hover:border-white/[0.15] transition-colors"
        >
          Select Video File
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="text-[11px] font-mono text-zinc-500">OR</span>
      </div>

      <button
        onClick={onLoadSample}
        className="mt-3 px-3 py-1.5 text-xs text-[#5FB3A8] bg-[#5FB3A8]/10 border border-[#5FB3A8]/30 rounded-[2px] hover:bg-[#5FB3A8]/20 transition-colors cursor-pointer"
      >
        Load Test Footage (Macbeth Chart & Gradients)
      </button>
    </div>
  );
};
