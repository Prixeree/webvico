export interface GradeParams {
  exposure: number;       // -1.0 to 1.0
  contrast: number;       // -1.0 to 1.0
  saturation: number;     // -1.0 to 1.0
  temperature: number;    // -1.0 to 1.0
  tint: number;           // -1.0 to 1.0
  shadows_rgb: [number, number, number];    // each -0.3 to 0.3
  highlights_rgb: [number, number, number]; // each -0.3 to 0.3
}

export interface AgentResponse {
  look_name: string;
  mood_analysis: string;
  params: GradeParams;
  reasoning: string;
}

export type AiProvider = 'anthropic' | 'openai' | 'google';

export const DEFAULT_GRADE_PARAMS: GradeParams = {
  exposure: 0.0,
  contrast: 0.0,
  saturation: 0.0,
  temperature: 0.0,
  tint: 0.0,
  shadows_rgb: [0.0, 0.0, 0.0],
  highlights_rgb: [0.0, 0.0, 0.0]
};
