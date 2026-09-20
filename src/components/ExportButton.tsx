import React, { useState } from 'react';
import { useGradeStore } from '../store/gradeStore';
import { CanvasRecorder } from '../lib/export/recordCanvas';

export const ExportButton: React.FC = () => {
  const videoElement = useGradeStore((s) => s.videoElement);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recorderInstance] = useState(() => new CanvasRecorder());

  const handleExport = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      alert('Canvas viewport not found');
      return;
    }

    if (!videoElement) {
      alert('No video loaded');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      await recorderInstance.startRecording(canvas, videoElement, {
        onProgress: (p) => setProgress(p),
        onComplete: (url) => {
          setIsExporting(false);
          const a = document.createElement('a');
          a.href = url;
          a.download = `graded_video_${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        },
        onError: (err) => {
          setIsExporting(false);
          alert(`Export failed: ${err.message}`);
        }
      });
    } catch (err: any) {
      setIsExporting(false);
      alert(`Could not start export: ${err.message}`);
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="px-3 py-1 text-xs font-normal text-[#15161A] bg-[#E8E6E1] hover:brightness-95 disabled:opacity-40 rounded-[2px] border border-white/[0.1] transition-all cursor-pointer"
        title="Export graded video via MediaRecorder"
      >
        {isExporting ? `Exporting ${progress}%` : 'Export'}
      </button>

      {/* Exporting Modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-[#15161A]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xs bg-[#1C1E24] border border-white/[0.08] rounded-[2px] p-4 flex flex-col gap-3">
            <div>
              <h3 className="text-xs font-medium text-[#E8E6E1] uppercase tracking-wider">
                Rendering Video
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Recording canvas stream with audio...
              </p>
            </div>

            <div className="w-full h-1 bg-[#15161A] rounded-[1px] overflow-hidden">
              <div
                className="h-full bg-[#5FB3A8] transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono tabular-nums text-zinc-400">
              <span>Progress</span>
              <span className="text-[#5FB3A8]">{progress}%</span>
            </div>

            <button
              onClick={() => {
                recorderInstance.stopRecording();
                setIsExporting(false);
              }}
              className="py-1 px-2.5 text-xs text-zinc-400 hover:text-[#E8E6E1] bg-[#15161A] border border-white/[0.08] rounded-[2px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};
