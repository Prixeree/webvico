import React, { useState } from 'react';
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

  const extractKeyframes = async (count: number = 3): Promise<string[]> => {
    const frames: string[] = [];
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    if (isSampleMode || !videoElement) {
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

  const handleAutoGrade = async () => {
    if (!apiKey) {
      setErrorMessage('API key required');
      return;
    }

    setErrorMessage(null);
    setIsAiAnalyzing(true);

    try {
      const keyframes = await extractKeyframes(3);
      if (keyframes.length === 0) {
        throw new Error('Failed to extract footage keyframes');
      }

      const response = await callAiColorist(aiProvider, apiKey, keyframes, ANALYSIS_PROMPT);
      setLastAnalysis(response);
      setParams(response.params);
    } catch (err: any) {
      console.error('Auto-Grade failed:', err);
      setErrorMessage(err.message || 'Auto-Grade failed');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleRefine = async () => {
    if (!apiKey || refineCount >= 2) return;

    setErrorMessage(null);
    setIsAiAnalyzing(true);

    try {
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
      setErrorMessage(err.message || 'Refinement failed');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-[#1C1E24] border border-white/[0.08] rounded-[2px]">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
        <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
          AI Colorist
        </span>
        <span className="text-[10px] font-mono text-zinc-500">Session Key</span>
      </div>

      {/* Provider & Key Configuration */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-zinc-400 w-14">Provider</label>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as AiProvider)}
            className="flex-1 bg-[#15161A] border border-white/[0.08] rounded-[2px] px-2 py-1 text-xs text-[#E8E6E1] focus:outline-none focus:border-[#5FB3A8]"
          >
            <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
            <option value="openai">OpenAI (GPT-4o)</option>
            <option value="google">Google (Gemini 2.5 Flash)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] text-zinc-400 w-14">API Key</label>
          <input
            type="password"
            placeholder="Paste key..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 bg-[#15161A] border border-white/[0.08] rounded-[2px] px-2 py-1 text-xs font-mono text-[#E8E6E1] placeholder:text-zinc-600 focus:outline-none focus:border-[#5FB3A8]"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-2 bg-rose-950/20 border border-rose-800/40 rounded-[2px] text-rose-300 text-xs font-mono">
          {errorMessage}
        </div>
      )}

      {/* AI Analysis Display Card */}
      {lastAnalysis && (
        <div className="flex flex-col gap-1.5 p-2.5 bg-[#15161A] border border-white/[0.08] rounded-[2px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-[#5FB3A8]">
              {lastAnalysis.look_name}
            </span>
            {refineCount > 0 && (
              <span className="text-[10px] font-mono text-zinc-500">
                Refine {refineCount}/2
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-300 leading-normal">
            {lastAnalysis.mood_analysis}
          </p>
          <p className="text-[11px] text-zinc-400 border-t border-white/[0.08] pt-1 mt-0.5">
            {lastAnalysis.reasoning}
          </p>
        </div>
      )}

      {/* Action Buttons: Teal for Auto-Grade, Amber for Refine */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAutoGrade}
          disabled={isAiAnalyzing}
          className="flex-1 py-1.5 px-2.5 text-xs font-medium text-[#15161A] bg-[#5FB3A8] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed rounded-[2px] transition-all cursor-pointer"
        >
          {isAiAnalyzing ? 'Analyzing...' : 'Auto-Grade'}
        </button>

        {lastAnalysis && (
          <button
            onClick={handleRefine}
            disabled={isAiAnalyzing || refineCount >= 2}
            className="py-1.5 px-2.5 text-xs font-medium text-[#D9822B] bg-[#D9822B]/10 hover:bg-[#D9822B]/20 disabled:opacity-40 disabled:cursor-not-allowed border border-[#D9822B]/40 rounded-[2px] transition-colors cursor-pointer"
            title={refineCount >= 2 ? 'Refine limit reached' : 'Refine current color grade'}
          >
            Refine ({2 - refineCount})
          </button>
        )}
      </div>
    </div>
  );
};
