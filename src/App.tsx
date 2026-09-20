import React, { useState } from 'react';
import { Sliders } from 'lucide-react';
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

  // If user dropped or selected a video file
  const isVideoLoaded = (videoSrc !== null || isSampleMode) && hasStarted;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090a0f] text-zinc-100 font-sans overflow-hidden select-none">
      {/* Top Professional Header */}
      <header className="h-12 border-b border-zinc-800/80 bg-zinc-950/80 px-4 flex items-center justify-between gap-4 shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 flex items-center justify-center shadow-[0_0_10px_rgba(0,242,254,0.4)]">
            <div className="w-2 h-2 bg-zinc-950 rounded-xs" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xs font-bold tracking-widest text-zinc-100 font-mono">
              CHROMATIC // AI
            </h1>
            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
              WebGL2 3D-LUT Engine
            </span>
          </div>
        </div>

        {/* Center Clip Badge */}
        {isVideoLoaded && (
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="truncate max-w-[220px]">{videoName}</span>
          </div>
        )}

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {isVideoLoaded && <BeforeAfterToggle />}
          {isVideoLoaded && <ExportButton />}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left / Center Viewport */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
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
          <aside className="w-84 border-l border-zinc-800/80 bg-zinc-950 flex flex-col h-full shrink-0 z-30 shadow-2xl">
            <div className="h-10 border-b border-zinc-800/80 px-4 flex items-center justify-between text-xs font-semibold text-zinc-400">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="tracking-wider uppercase">Color Inspector</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">RAW WebGL2</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
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
