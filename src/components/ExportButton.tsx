import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
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
      alert('Canvas viewport not found.');
      return;
    }

    if (!videoElement) {
      alert('No video element loaded to export.');
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
        className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 disabled:opacity-50 rounded shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all cursor-pointer"
        title="Export graded video via MediaRecorder"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{isExporting ? `Exporting ${progress}%` : 'Export Video'}</span>
      </button>

      {/* Exporting Modal Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 shadow-2xl">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Rendering Video</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Encoding canvas stream with audio...
              </p>
            </div>

            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Progress</span>
              <span className="text-cyan-300 font-bold">{progress}%</span>
            </div>

            <button
              onClick={() => {
                recorderInstance.stopRecording();
                setIsExporting(false);
              }}
              className="mt-2 py-1.5 px-3 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};
