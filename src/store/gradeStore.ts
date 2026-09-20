import { create } from 'zustand';
import { DEFAULT_GRADE_PARAMS, GradeParams, AgentResponse, AiProvider } from '../lib/ai/types';

export interface LutState {
  name: string;
  size: number;
  data: Float32Array | null;
}

export interface GradeStore {
  // Grading parameters
  params: GradeParams;
  setParam: <K extends keyof GradeParams>(key: K, value: GradeParams[K]) => void;
  setParams: (newParams: Partial<GradeParams>) => void;
  resetParams: () => void;

  // 3D LUT
  activeLut: LutState | null;
  setLut: (lut: LutState | null) => void;

  // Video element and playback
  videoElement: HTMLVideoElement | null;
  videoSrc: string | null;
  videoName: string;
  setVideoElement: (el: HTMLVideoElement | null) => void;
  setVideoSrc: (src: string | null, name?: string) => void;

  // View modes
  splitX: number; // -1 for off, 0.0 to 1.0 for divider
  showOriginal: boolean; // Hold to compare
  setSplitX: (x: number) => void;
  setShowOriginal: (show: boolean) => void;

  // AI Colorist Agent State
  aiProvider: AiProvider;
  apiKey: string;
  isAiAnalyzing: boolean;
  refineCount: number;
  lastAnalysis: AgentResponse | null;
  setAiProvider: (provider: AiProvider) => void;
  setApiKey: (key: string) => void;
  setIsAiAnalyzing: (analyzing: boolean) => void;
  setLastAnalysis: (analysis: AgentResponse | null) => void;
  incrementRefineCount: () => void;
  resetAiState: () => void;
}

// Read API key strictly from sessionStorage on initial load
const initialApiKey = typeof window !== 'undefined' ? sessionStorage.getItem('byok_key') || '' : '';

export const useGradeStore = create<GradeStore>((set) => ({
  params: { ...DEFAULT_GRADE_PARAMS },
  setParam: (key, value) =>
    set((state) => ({
      params: { ...state.params, [key]: value }
    })),
  setParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams }
    })),
  resetParams: () =>
    set(() => ({
      params: { ...DEFAULT_GRADE_PARAMS }
    })),

  activeLut: null,
  setLut: (lut) => set({ activeLut: lut }),

  videoElement: null,
  videoSrc: null,
  videoName: 'Synthetic Test Clip',
  setVideoElement: (el) => set({ videoElement: el }),
  setVideoSrc: (src, name = 'Uploaded Video') => set({ videoSrc: src, videoName: name }),

  splitX: -1.0,
  showOriginal: false,
  setSplitX: (x) => set({ splitX: x }),
  setShowOriginal: (show) => set({ showOriginal: show }),

  aiProvider: 'anthropic',
  apiKey: initialApiKey,
  isAiAnalyzing: false,
  refineCount: 0,
  lastAnalysis: null,

  setAiProvider: (provider) => set({ aiProvider: provider }),
  setApiKey: (key) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('byok_key', key);
    }
    set({ apiKey: key });
  },
  setIsAiAnalyzing: (analyzing) => set({ isAiAnalyzing: analyzing }),
  setLastAnalysis: (analysis) => set({ lastAnalysis: analysis }),
  incrementRefineCount: () => set((state) => ({ refineCount: state.refineCount + 1 })),
  resetAiState: () => set({ refineCount: 0, lastAnalysis: null })
}));
