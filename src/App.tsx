import React, { useState } from 'react';
import { useGradeStore } from './store/gradeStore';
import { UploadScreen } from './components/UploadScreen';
import { CanvasPreview } from './components/CanvasPreview';
import { GradingPanel } from './components/GradingPanel';
import { LutPresetPicker } from './components/LutPresetPicker';
import { LutUpload } from './components/LutUpload';
import { AiColoristPanel } from './components/AiColoristPanel';
import { BeforeAfterToggle } from './components/BeforeAfterToggle';
import { ExportButton } from './components/ExportButton';

export const App: React.FC = () => {
  const videoSrc = useGradeStore((s) => s.videoSrc);
  const videoName = useGradeStore((s) => s.videoName);
  const setVideoSrc = useGradeStore((s) => s.setVideoSrc);

  const [isSampleMode, setIsSampleMode] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const handleLoadSample = () => {
    setIsSampleMode(true);
    setHasStarted(true);
    setVideoSrc(null, 'Synthetic Calibration Target');
  };

  const handleResetToUpload = () => {
    setHasStarted(false);
    setIsSampleMode(false);
    setVideoSrc(null, '');
  };

  const isVideoLoaded = (videoSrc !== null || isSampleMode) && hasStarted;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#15161A] text-[#E8E6E1] overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-11 border-b border-white/[0.08] bg-[#1C1E24] px-4 flex items-center justify-between gap-4 shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-[#E8E6E1] uppercase">
              webvico
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              color grader
            </span>
          </div>
        </div>

        {/* Clip Title Badge */}
        {isVideoLoaded && (
          <div className="hidden md:flex items-center gap-2 px-2 py-0.5 bg-[#15161A] border border-white/[0.08] rounded-[2px] text-xs font-mono text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5FB3A8]" />
            <span className="truncate max-w-[240px]">{videoName}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isVideoLoaded && <BeforeAfterToggle />}
          {isVideoLoaded && <ExportButton />}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Center Canvas Viewport */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#15161A]">
          {!isVideoLoaded ? (
            <UploadScreen onLoadSample={handleLoadSample} />
          ) : (
            <CanvasPreview
              isSampleMode={isSampleMode}
              onResetToUpload={handleResetToUpload}
            />
          )}
        </div>

        {/* Right Docked Inspector Sidebar */}
        {isVideoLoaded && (
          <aside className="w-80 border-l border-white/[0.08] bg-[#1C1E24] flex flex-col h-full shrink-0 z-30">
            <div className="h-9 border-b border-white/[0.08] px-3 flex items-center justify-between text-xs font-medium text-zinc-400">
              <span className="uppercase text-[11px] tracking-wider text-zinc-300">Inspector</span>
              <span className="text-[10px] font-mono text-zinc-500">WebGL2 3D LUT</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {/* AI Colorist Agent Panel */}
              <AiColoristPanel isSampleMode={isSampleMode} />

              {/* Manual Grading Sliders */}
              <GradingPanel />

              {/* 3D LUT Presets */}
              <LutPresetPicker />

              {/* Custom .CUBE Upload */}
              <LutUpload />
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};

export default App;
