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

  // Store subscriptions
  const params = useGradeStore((s) => s.params);
  const activeLut = useGradeStore((s) => s.activeLut);
  const videoSrc = useGradeStore((s) => s.videoSrc);
  const splitX = useGradeStore((s) => s.splitX);
  const showOriginal = useGradeStore((s) => s.showOriginal);
  const setVideoElement = useGradeStore((s) => s.setVideoElement);
  const setSplitX = useGradeStore((s) => s.setSplitX);

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

  // Update LUT in renderer when changed
  useEffect(() => {
    if (!rendererRef.current) return;
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
    <div className="relative flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden select-none">
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
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden bg-radial from-zinc-900 to-zinc-950">
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full rounded shadow-2xl object-contain"
        />

        {/* Draggable Split Divider Line */}
        {splitX >= 0 && (
          <div
            onMouseDown={handleMouseDown}
            style={{ left: `${splitX * 100}%` }}
            className="absolute top-4 bottom-4 w-6 -ml-3 cursor-ew-resize flex items-center justify-center z-30 group"
          >
            <div className="h-full w-0.5 bg-white shadow-[0_0_10px_rgba(0,242,254,0.8)] group-hover:bg-cyan-300" />
            <div className="absolute w-6 h-6 rounded-full bg-zinc-900 border-2 border-white text-[9px] font-mono font-bold flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:border-cyan-400 group-hover:text-cyan-300 transition-transform">
              VS
            </div>
          </div>
        )}

        {/* Before / After Badges */}
        {splitX >= 0 && (
          <>
            <div className="absolute top-6 left-6 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider text-zinc-400 bg-zinc-900/80 border border-zinc-800 rounded backdrop-blur pointer-events-none">
              BEFORE
            </div>
            <div className="absolute top-6 right-6 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider text-cyan-300 bg-zinc-900/80 border border-cyan-800/60 rounded backdrop-blur pointer-events-none shadow-[0_0_12px_rgba(0,242,254,0.2)]">
              AFTER
            </div>
          </>
        )}

        {/* Hold-to-compare overlay badge */}
        {showOriginal && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1 text-[11px] font-mono font-bold tracking-widest text-amber-300 bg-zinc-900/90 border border-amber-500/50 rounded-full backdrop-blur shadow-lg">
            ORIGINAL (HOLD TO COMPARE)
          </div>
        )}
      </div>

      {/* Playback Controls Toolbar */}
      <div className="h-12 bg-zinc-900/90 border-t border-zinc-800/80 px-4 flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={() => {
              if (isSampleMode && sampleGenRef.current) sampleGenRef.current.seek(0);
              else if (videoRef.current) videoRef.current.currentTime = 0;
            }}
            className="w-8 h-8 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Rewind to start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-xs text-zinc-400 min-w-[85px]">
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
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              isMuted ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
              isLooping
                ? 'text-cyan-300 border-cyan-800 bg-cyan-950/40'
                : 'text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
            title="Toggle Loop"
          >
            LOOP
          </button>

          <button
            onClick={onResetToUpload}
            className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
            title="Switch Footage"
          >
            Change Video
          </button>
        </div>
      </div>
    </div>
  );
};
