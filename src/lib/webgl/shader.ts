/**
 * WebGL 2.0 Vertex Shader
 * Fullscreen quad with normalized UV coordinates.
 */
export const vertexShaderSource = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

/**
 * WebGL 2.0 Fragment Shader
 * High-performance color grading pipeline:
 * Exposure -> White Balance (Temp & Tint) -> Contrast -> Saturation -> Shadows/Highlights RGB Split Toning -> 3D LUT Lookup -> Split/Original View
 */
export const fragmentShaderSource = `#version 300 es
precision highp float;
precision highp sampler3D;

in vec2 v_texCoord;
out vec4 outColor;

// Video & LUT textures
uniform sampler2D u_video;
uniform sampler3D u_lut;
uniform float u_lut_size;
uniform bool u_lut_active;

// Grading uniforms (ranges -1.0 to 1.0, shadows/highlights -0.3 to 0.3)
uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_temperature;
uniform float u_tint;
uniform vec3 u_shadows_rgb;
uniform vec3 u_highlights_rgb;

// Comparison & View modes
uniform float u_split_x;        // -1.0 = off, 0.0 to 1.0 = divider position
uniform bool u_show_original;   // Hold-to-compare override

// Rec.709 Luminance coefficients
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

// Apply Exposure adjustment (-1.0 to 1.0 maps to -2.0 to +2.0 EV stops)
vec3 applyExposure(vec3 color, float expVal) {
  return color * pow(2.0, expVal * 2.0);
}

// Apply White Balance (Temperature: Amber/Blue, Tint: Magenta/Green)
vec3 applyWhiteBalance(vec3 color, float temp, float tint) {
  vec3 shift = vec3(
    temp * 0.35 + tint * 0.15,
    -abs(temp) * 0.08 - tint * 0.25,
    -temp * 0.45 + tint * 0.10
  );
  return color + shift;
}

// Apply Midpoint Contrast (-1.0 to 1.0 maps to factor 0.0 to 2.0)
vec3 applyContrast(vec3 color, float contrast) {
  float factor = contrast + 1.0;
  return clamp((color - 0.5) * factor + 0.5, 0.0, 1.0);
}

// Apply Saturation (-1.0 to 1.0 maps to factor 0.0 to 2.0)
vec3 applySaturation(vec3 color, float sat) {
  float factor = sat + 1.0;
  float luma = dot(color, LUMA);
  return clamp(mix(vec3(luma), color, factor), 0.0, 1.0);
}

// Apply Split Toning (Shadows & Highlights RGB tinting)
vec3 applySplitToning(vec3 color, vec3 shadowsTint, vec3 highlightsTint) {
  float luma = dot(color, LUMA);
  float shadowWeight = pow(clamp(1.0 - luma, 0.0, 1.0), 2.0);
  float highlightWeight = pow(clamp(luma, 0.0, 1.0), 2.0);

  vec3 tinted = color + (shadowsTint * shadowWeight) + (highlightsTint * highlightWeight);
  return clamp(tinted, 0.0, 1.0);
}

// Sample 3D LUT with half-texel offset correction
vec3 sample3DLUT(sampler3D lut, vec3 color, float size) {
  vec3 lutCoord = (clamp(color, 0.0, 1.0) * (size - 1.0) + 0.5) / size;
  return texture(lut, lutCoord).rgb;
}

void main() {
  vec4 src = texture(u_video, v_texCoord);
  vec3 originalColor = src.rgb;

  // 1. Hold-to-compare check: if true, immediately output original frame
  if (u_show_original) {
    outColor = vec4(originalColor, src.a);
    return;
  }

  // 2. Split-screen check: if enabled and before divider line, draw original or divider
  bool splitActive = (u_split_x >= 0.0 && u_split_x <= 1.0);
  if (splitActive) {
    float dist = abs(v_texCoord.x - u_split_x);
    if (dist < 0.002) {
      // Crisp glowing divider line
      outColor = vec4(1.0, 1.0, 1.0, 1.0);
      return;
    }
    if (v_texCoord.x < u_split_x) {
      // Left side: Before (original footage)
      outColor = vec4(originalColor, src.a);
      return;
    }
  }

  // 3. Color grading pipeline
  vec3 col = applyExposure(originalColor, u_exposure);
  col = applyWhiteBalance(col, u_temperature, u_tint);
  col = applyContrast(col, u_contrast);
  col = applySaturation(col, u_saturation);
  col = applySplitToning(col, u_shadows_rgb, u_highlights_rgb);

  // 4. 3D LUT Lookup (if active)
  if (u_lut_active) {
    col = sample3DLUT(u_lut, col, u_lut_size);
  }

  outColor = vec4(clamp(col, 0.0, 1.0), src.a);
}
`;
