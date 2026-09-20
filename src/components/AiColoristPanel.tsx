import React, { useState } from 'react';
import { Bot, Key, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { useGradeStore } from '../store/gradeStore';
import { AiProvider } from '../lib/ai/types';
import { ANALYSIS_PROMPT, getRefinementPrompt } from '../lib/ai/prompts';
import { callAiColorist } from '../lib/ai/providers';

interface AiColoristPanelProps {
  isSampleMode: boolean;
}

export const AiColoristPanel: React.FC<AiColoristPanelProps> = ({ isSampleMode }) => {
  const aiProvider = useGradeStore((s) => s.aiProvider);
  const apiKey = useGradeStore((s) => s.apiKey);
  const isAiAnalyzing = useGradeStore((s) => s.isAiAnalyzing);
  const refineCount = useGradeStore((s) => s.refineCount);
  const lastAnalysis = useGradeStore((s) => s.lastAnalysis);
  const videoElement = useGradeStore((s) => s.videoElement);
  const params = useGradeStore((s) => s.params);

  const setAiProvider = useGradeStore((s) => s.setAiProvider);
  const setApiKey = useGradeStore((s) => s.setApiKey);
  const setIsAiAnalyzing = useGradeStore((s) => s.setIsAiAnalyzing);
  const setLastAnalysis = useGradeStore((s) => s.setLastAnalysis);
  const setParams = useGradeStore((s) => s.setParams);
  const incrementRefineCount = useGradeStore((s) => s.incrementRefineCount);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Extract 3-4 keyframes from video or active canvas.
   */
  const extractKeyframes = async (count: number = 3): Promise<string[]> => {
    const frames: string[] = [];
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    if (isSampleMode || !videoElement) {
      // Capture current viewport canvas
      const mainCanvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (mainCanvas) {
        ctx.drawImage(mainCanvas, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.8));
      }
      return frames;
    }

    const video = videoElement;
    const duration = video.duration || 10;
    const timestamps: number[] = [];
    for (let i = 1; i <= count; i++) {
      timestamps.push((duration / (count + 1)) * i);
    }
    const prevTime = video.currentTime;
    const wasPaused = video.paused;
    video.pause();

    for (const t of timestamps) {
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL('image/jpeg', 0.8));
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = t;
      });
    }

    video.currentTime = prevTime;
    if (!wasPaused) video.play().catch(() => {});

    return frames;
  };

  /**
   * Run Auto-Grade with the analysis prompt
   */
  const handleAutoGrade = async () => {
    if (!apiKey) {
      setErrorMessage('Please enter your API key first.');
      return;
    }

    setErrorMessage(null);
    setIsAiAnalyzing(true);

    try {
      const keyframes = await extractKeyframes(3);
      if (keyframes.length === 0) {
        throw new Error('Failed to extract footage keyframes.');
      }

      const response = await callAiColorist(aiProvider, apiKey, keyframes, ANALYSIS_PROMPT);

      setLastAnalysis(response);
      setParams(response.params);
    } catch (err: any) {
      console.error('Auto-Grade failed:', err);
      setErrorMessage(err.message || 'Auto-Grade request failed.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  /**
   * Run Refine with the refinement prompt (capped at 2 calls)
   */
  const handleRefine = async () => {
    if (!apiKey || refineCount >= 2) return;

    setErrorMessage(null);
    setIsAiAnalyzing(true);

    try {
      // Capture currently graded frame from WebGL canvas
      const mainCanvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!mainCanvas) throw new Error('Canvas not found');

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 640;
      tempCanvas.height = 360;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(mainCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
      const gradedFrame = tempCanvas.toDataURL('image/jpeg', 0.85);

      const prompt = getRefinementPrompt(params);
      const response = await callAiColorist(aiProvider, apiKey, [gradedFrame], prompt);

      setLastAnalysis(response);
      setParams(response.params);
      incrementRefineCount();
    } catch (err: any) {
      console.error('Refine failed:', err);
      setErrorMessage(err.message || 'Refinement request failed.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-lg">
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-2 text-zinc-200">
          <Bot className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">AI Colorist Agent</h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">BYOK (Session Only)</span>
      </div>

      {/* Provider & Key Configuration */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-zinc-400 w-16">Provider:</label>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as AiProvider)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
            <option value="openai">OpenAI (GPT-4o)</option>
            <option value="google">Google (Gemini 2.0 Flash)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] text-zinc-400 w-16 flex items-center gap-1">
            <Key className="w-3 h-3 text-zinc-500" />
            <span>Key:</span>
          </label>
          <input
            type="password"
            placeholder="Paste your API key..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 p-2 bg-rose-950/30 border border-rose-800/40 rounded text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span className="break-all">{errorMessage}</span>
        </div>
      )}

      {/* AI Analysis Display Card */}
      {lastAnalysis && (
        <div className="flex flex-col gap-2 p-3 bg-zinc-950/60 border border-cyan-900/40 rounded-lg shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase">
              LOOK: {lastAnalysis.look_name}
            </span>
            {refineCount > 0 && (
              <span className="text-[10px] font-mono text-zinc-500">
                Refined ({refineCount}/2)
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed italic">
            "{lastAnalysis.mood_analysis}"
          </p>
          <p className="text-[11px] text-zinc-400 leading-normal border-t border-zinc-800/60 pt-1.5">
            <strong className="text-zinc-300">Reasoning:</strong> {lastAnalysis.reasoning}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAutoGrade}
          disabled={isAiAnalyzing}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAiAnalyzing ? 'Analyzing Footage...' : 'Auto-Grade'}</span>
        </button>

        {lastAnalysis && (
          <button
            onClick={handleRefine}
            disabled={isAiAnalyzing || refineCount >= 2}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700 rounded transition-colors"
            title={refineCount >= 2 ? 'Refinement limit reached (2 max)' : 'Refine current color grade'}
          >
            <RefreshCw className={`w-3 h-3 ${isAiAnalyzing ? 'animate-spin' : ''}`} />
            <span>Refine ({2 - refineCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};
