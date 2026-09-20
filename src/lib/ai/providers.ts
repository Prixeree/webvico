import { AgentResponse, AiProvider, DEFAULT_GRADE_PARAMS, GradeParams } from './types';

/**
 * Extracts and parses JSON from raw LLM text output.
 */
function cleanAndParseJSON(rawText: string): AgentResponse {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // Find the first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(cleaned);

  // Validate and clamp params
  const p = parsed.params || {};
  const clamp = (v: number | undefined, min: number, max: number, def: number) => {
    if (typeof v !== 'number' || isNaN(v)) return def;
    return Math.max(min, Math.min(max, v));
  };

  const params: GradeParams = {
    exposure: clamp(p.exposure, -1.0, 1.0, DEFAULT_GRADE_PARAMS.exposure),
    contrast: clamp(p.contrast, -1.0, 1.0, DEFAULT_GRADE_PARAMS.contrast),
    saturation: clamp(p.saturation, -1.0, 1.0, DEFAULT_GRADE_PARAMS.saturation),
    temperature: clamp(p.temperature, -1.0, 1.0, DEFAULT_GRADE_PARAMS.temperature),
    tint: clamp(p.tint, -1.0, 1.0, DEFAULT_GRADE_PARAMS.tint),
    shadows_rgb: [
      clamp(p.shadows_rgb?.[0], -0.3, 0.3, 0),
      clamp(p.shadows_rgb?.[1], -0.3, 0.3, 0),
      clamp(p.shadows_rgb?.[2], -0.3, 0.3, 0)
    ],
    highlights_rgb: [
      clamp(p.highlights_rgb?.[0], -0.3, 0.3, 0),
      clamp(p.highlights_rgb?.[1], -0.3, 0.3, 0),
      clamp(p.highlights_rgb?.[2], -0.3, 0.3, 0)
    ]
  };

  return {
    look_name: parsed.look_name || 'Custom AI Grade',
    mood_analysis: parsed.mood_analysis || 'AI color grade applied.',
    params,
    reasoning: parsed.reasoning || 'Balanced color values for optimal visual impact.'
  };
}

/**
 * Call Anthropic Claude Messages API (native fetch)
 */
async function callAnthropic(apiKey: string, base64Images: string[], prompt: string): Promise<AgentResponse> {
  const content: Array<any> = [
    { type: 'text', text: prompt }
  ];

  for (const b64 of base64Images) {
    // Strip data:image/...;base64, prefix if present
    const rawData = b64.replace(/^data:image\/[a-z]+;base64,/, '');
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: rawData
      }
    });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        { role: 'user', content }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const textOutput = data.content?.[0]?.text || '';
  return cleanAndParseJSON(textOutput);
}

/**
 * Call OpenAI Chat Completions API (native fetch)
 */
async function callOpenAI(apiKey: string, base64Images: string[], prompt: string): Promise<AgentResponse> {
  const content: Array<any> = [
    { type: 'text', text: prompt }
  ];

  for (const b64 of base64Images) {
    const dataUri = b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`;
    content.push({
      type: 'image_url',
      image_url: { url: dataUri }
    });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const textOutput = data.choices?.[0]?.message?.content || '';
  return cleanAndParseJSON(textOutput);
}

/**
 * Call Google Gemini GenerateContent API (native fetch)
 */
async function callGemini(apiKey: string, base64Images: string[], prompt: string): Promise<AgentResponse> {
  const parts: Array<any> = [
    { text: prompt }
  ];

  for (const b64 of base64Images) {
    const rawData = b64.replace(/^data:image\/[a-z]+;base64,/, '');
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: rawData
      }
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        { parts }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return cleanAndParseJSON(textOutput);
}

/**
 * Unified provider dispatcher.
 */
export async function callAiColorist(
  provider: AiProvider,
  apiKey: string,
  base64Images: string[],
  prompt: string
): Promise<AgentResponse> {
  if (!apiKey) {
    throw new Error('API Key is required. Please provide a valid key in the AI panel.');
  }

  switch (provider) {
    case 'anthropic':
      return callAnthropic(apiKey, base64Images, prompt);
    case 'openai':
      return callOpenAI(apiKey, base64Images, prompt);
    case 'google':
      return callGemini(apiKey, base64Images, prompt);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
