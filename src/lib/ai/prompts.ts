import { GradeParams } from './types';

/**
 * Analysis prompt (verbatim from spec).
 */
export const ANALYSIS_PROMPT = `You are a professional film colorist. You will be shown reference frames from a video. Analyze the footage and propose a color grade.

Return ONLY valid JSON, no prose, no markdown fences, matching this exact shape:

{
  "look_name": "string — e.g. 'Teal & Orange Cinematic', 'Desaturated Thriller', 'Warm Nostalgic'",
  "mood_analysis": "string — 1-2 sentences on genre/mood read from the footage",
  "params": {
    "exposure": number,
    "contrast": number,
    "saturation": number,
    "temperature": number,
    "tint": number,
    "shadows_rgb": [number, number, number],
    "highlights_rgb": [number, number, number]
  },
  "reasoning": "string — 1-2 sentences on why these specific values"
}

exposure/contrast/saturation range -1.0 to 1.0. temperature -1.0 (cool) to 1.0 (warm). tint -1.0 (green) to 1.0 (magenta). shadows_rgb/highlights_rgb each channel -0.3 to 0.3.

Base every value on what you actually see in the frames — lighting, existing color cast, skin tones, genre cues. Do not default to generic values.`;

/**
 * Refinement prompt (verbatim from spec).
 */
export function getRefinementPrompt(previousParams: GradeParams): string {
  const previousParamsJson = JSON.stringify(previousParams, null, 2);
  return `You are the same professional colorist reviewing your own grade. Below is the frame after your color grade was applied, and the params you chose.

Previous params: ${previousParamsJson}

Critique this result against professional standards: skin tones, clipping in highlights/shadows, whether the mood lands. If it needs adjustment, return corrected JSON in the exact same shape as before with updated values. If it's already good, return the same params unchanged.

Return ONLY valid JSON, no prose, no markdown fences.`;
}
