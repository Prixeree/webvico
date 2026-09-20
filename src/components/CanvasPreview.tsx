import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useGradeStore } from '../store/gradeStore';
import { WebGLRenderer } from '../lib/webgl/renderer';
import { SampleVideoGenerator } from '../lib/video/sampleVideo';

interface CanvasPreviewProps {
  isSampleMode: boolean;
  onResetToUpload: () => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({ isSampleMode, onResetToUpload }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fadeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sampleGenRef = useRef<SampleVideoGenerator | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const [isLooping, setIsLooping] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState<number>(0);

  // Store subscriptions
  const params = useGradeStore((s) => s.params);
  const activeLut = useGradeStore((s) => s.activeLut);
  const videoSrc = useGradeStore((s) => s.videoSrc);
  const splitX = useGradeStore((s) => s.splitX);
  const showOriginal = useGradeStore((s) => s.showOriginal);
  const setVideoElement = useGradeStore((s) => s.setVideoElement);
  const setSplitX = useGradeStore((s) => s.setSplitX);

  const prevLutRef = useRef(activeLut);

  // Initialize WebGL Renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const renderer = new WebGLRenderer(canvasRef.current);
      rendererRef.current = renderer;
    } catch (err) {
      console.error('Failed to initialize WebGL2:', err);
    }

    const sampleGen = new SampleVideoGenerator(1280, 720);
    sampleGenRef.current = sampleGen;

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  // Deliberate motion moment: Smooth crossfade on the canvas when LUT changes
  useEffect(() => {
    if (!rendererRef.current) return;

    // If activeLut has changed and canvas exists, perform crossfade
    if (canvasRef.current && fadeCanvasRef.current && prevLutRef.current !== activeLut) {
      const mainCanvas = canvasRef.current;
      const fadeCanvas = fadeCanvasRef.current;

      // Copy current frame to fade canvas
      fadeCanvas.width = mainCanvas.width;
      fadeCanvas.height = mainCanvas.height;
      const ctx = fadeCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(mainCanvas, 0, 0);
        setFadeOpacity(1);

        // Transition opacity from 1 to 0
        requestAnimationFrame(() => {
          setFadeOpacity(0);
        });
      }
    }

    prevLutRef.current = activeLut;

    if (activeLut) {
      rendererRef.current.setLut(activeLut.size, activeLut.data);
    } else {
      rendererRef.current.setLut(0, null);
    }
  }, [activeLut]);

  // Set video element ref in store
  useEffect(() => {
    if (videoRef.current) {
      setVideoElement(videoRef.current);
    }
  }, [setVideoElement]);

  // Render loop
  useEffect(() => {
    const loop = () => {
      if (rendererRef.current) {
        if (isSampleMode && sampleGenRef.current) {
          rendererRef.current.updateVideoFrame(sampleGenRef.current.getSource());
        } else if (videoRef.current && videoRef.current.readyState >= 2) {
          rendererRef.current.updateVideoFrame(videoRef.current);
        }

        rendererRef.current.render(params, { splitX, showOriginal });
      }
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [params, splitX, showOriginal, isSampleMode]);

  // Playback handlers
  const togglePlay = useCallback(() => {
    if (isSampleMode && sampleGenRef.current) {
      if (isPlaying) {
        sampleGenRef.current.pause();
        setIsPlaying(false);
      } else {
        sampleGenRef.current.play();
        setIsPlaying(true);
      }
    } else if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isSampleMode, isPlaying]);

  // Video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isSampleMode) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setDuration(video.duration || 15);
      if (canvasRef.current && rendererRef.current) {
        rendererRef.current.setSize(video.videoWidth || 1280, video.videoHeight || 720);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [isSampleMode, videoSrc]);

  // Sample generator loop events
  useEffect(() => {
    if (!isSampleMode || !sampleGenRef.current) return;
    const sample = sampleGenRef.current;

    sample.on('timeupdate', () => setCurrentTime(sample.currentTime));
    sample.on('play', () => setIsPlaying(true));
    sample.on('pause', () => setIsPlaying(false));

    if (canvasRef.current && rendererRef.current) {
      rendererRef.current.setSize(1280, 720);
    }
    sample.play();
    setIsPlaying(true);

    return () => {
      sample.pause();
    };
  }, [isSampleMode]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const targetTime = (val / 100) * duration;
    setCurrentTime(targetTime);

    if (isSampleMode && sampleGenRef.current) {
      sampleGenRef.current.seek(targetTime);
    } else if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  // Keyboard shortcut: Space to play/pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePlay]);

  // Split Divider mouse drag
  const handleMouseDown = () => setIsDraggingSplit(true);
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingSplit || !canvasRef.current || splitX < 0) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const clampedX = Math.max(rect.left, Math.min(e.clientX, rect.right));
      const newX = (clampedX - rect.left) / rect.width;
      setSplitX(newX);
    },
    [isDraggingSplit, splitX, setSplitX]
  );
  const handleMouseUp = () => setIsDraggingSplit(false);

  useEffect(() => {
    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplit, handleMouseMove]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="relative flex-1 flex flex-col h-full bg-[#15161A] overflow-hidden select-none">
      {/* Hidden Video Source Element */}
      <video
        ref={videoRef}
        src={videoSrc || undefined}
        crossOrigin="anonymous"
        playsInline
        loop={isLooping}
        muted={isMuted}
        className="hidden"
      />

      {/* Centerpiece Canvas Viewport */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden bg-[#15161A]">
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full rounded-[2px] object-contain border border-white/[0.04]"
        />

        {/* Crossfade Overlay Canvas for smooth LUT transition */}
        <canvas
          ref={fadeCanvasRef}
          style={{
            opacity: fadeOpacity,
            transition: 'opacity 350ms cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="absolute max-h-full max-w-full rounded-[2px] object-contain pointer-events-none"
        />

        {/* Draggable Split Divider Line */}
        {splitX >= 0 && (
          <div
            onMouseDown={handleMouseDown}
            style={{ left: `${splitX * 100}%` }}
            className="absolute top-4 bottom-4 w-6 -ml-3 cursor-ew-resize flex items-center justify-center z-30 group"
          >
            <div className="h-full w-px bg-white group-hover:bg-[#5FB3A8]" />
            <div className="absolute w-5 h-5 rounded-[2px] bg-[#1C1E24] border border-white/[0.2] text-[9px] font-mono font-medium flex items-center justify-center text-[#E8E6E1]">
              VS
            </div>
          </div>
        )}

        {/* Before / After Badges */}
        {splitX >= 0 && (
          <>
            <div className="absolute top-6 left-6 px-2 py-0.5 text-[10px] font-mono tracking-wider text-zinc-400 bg-[#1C1E24] border border-white/[0.08] rounded-[2px] pointer-events-none">
              BEFORE
            </div>
            <div className="absolute top-6 right-6 px-2 py-0.5 text-[10px] font-mono tracking-wider text-[#5FB3A8] bg-[#1C1E24] border border-[#5FB3A8]/40 rounded-[2px] pointer-events-none">
              AFTER
            </div>
          </>
        )}

        {/* Hold-to-compare overlay badge */}
        {showOriginal && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1 text-[11px] font-mono text-[#D9822B] bg-[#1C1E24] border border-[#D9822B]/50 rounded-[2px]">
            ORIGINAL FOOTAGE (HOLD)
          </div>
        )}
      </div>

      {/* Playback Controls Toolbar */}
      <div className="h-10 bg-[#1C1E24] border-t border-white/[0.08] px-3 flex items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-7 h-7 rounded-[2px] flex items-center justify-center text-zinc-400 hover:text-[#E8E6E1] hover:bg-white/[0.04] transition-colors"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            onClick={() => {
              if (isSampleMode && sampleGenRef.current) sampleGenRef.current.seek(0);
              else if (videoRef.current) videoRef.current.currentTime = 0;
            }}
            className="w-7 h-7 rounded-[2px] flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
            title="Rewind"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <span className="font-mono tabular-nums text-[11px] text-zinc-400 min-w-[75px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex-1 max-w-xl mx-2">
          <input
            type="range"
            min={0}
            max={100}
            step={0.01}
            value={duration > 0 ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-7 h-7 rounded-[2px] flex items-center justify-center transition-colors ${
              isMuted ? 'text-[#D9822B]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`px-1.5 py-0.5 text-[10px] font-mono rounded-[2px] border transition-colors ${
              isLooping
                ? 'text-[#5FB3A8] border-[#5FB3A8]/40 bg-[#5FB3A8]/10'
                : 'text-zinc-500 border-white/[0.08] hover:text-zinc-300'
            }`}
            title="Toggle Loop"
          >
            LOOP
          </button>

          <button
            onClick={onResetToUpload}
            className="text-[11px] text-zinc-400 hover:text-[#E8E6E1] px-2 py-1 rounded-[2px] hover:bg-white/[0.04] transition-colors"
            title="Switch Footage"
          >
            Change
          </button>
        </div>
      </div>
    </div>
  );
};
