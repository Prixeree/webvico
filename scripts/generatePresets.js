import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateCubeString } from '../src/lut/cubeParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, '..', 'public', 'luts');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const SIZE = 17; // Standard compact 3D LUT size (17x17x17 = 4913 samples)

function clamp(v, min = 0, max = 1) {
  return Math.min(Math.max(v, min), max);
}

// 1. Identity (Passthrough)
const identity = generateCubeString('Identity', SIZE, (r, g, b) => [r, g, b]);
fs.writeFileSync(path.join(outDir, 'identity.cube'), identity);

// 2. Warm Film: Golden warmth, lifted blacks, subtle film roll-off
const warmFilm = generateCubeString('Warm Film', SIZE, (r, g, b) => {
  let nr = r * 0.95 + 0.05;
  let ng = g * 0.92 + 0.03;
  let nb = b * 0.82 + 0.01;

  nr = Math.pow(nr, 0.9) * 1.08;
  ng = Math.pow(ng, 0.95) * 1.02;
  nb = Math.pow(nb, 1.15) * 0.88;

  return [clamp(nr), clamp(ng), clamp(nb)];
});
fs.writeFileSync(path.join(outDir, 'warm_film.cube'), warmFilm);

// 3. Teal & Orange: Cool/cyan shadows, warm/orange highlights & skin
const tealOrange = generateCubeString('Teal & Orange', SIZE, (r, g, b) => {
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const shadowWeight = Math.pow(1.0 - luma, 1.8);
  const highlightWeight = Math.pow(luma, 1.5);

  let nr = r + highlightWeight * 0.25 - shadowWeight * 0.15;
  let ng = g + highlightWeight * 0.08 + shadowWeight * 0.06;
  let nb = b - highlightWeight * 0.22 + shadowWeight * 0.28;

  nr = (nr - 0.5) * 1.15 + 0.5;
  ng = (ng - 0.5) * 1.12 + 0.5;
  nb = (nb - 0.5) * 1.10 + 0.5;

  return [clamp(nr), clamp(ng), clamp(nb)];
});
fs.writeFileSync(path.join(outDir, 'teal_orange.cube'), tealOrange);

// 4. Black & White: High contrast film noir monochrome
const blackWhite = generateCubeString('Black & White', SIZE, (r, g, b) => {
  let luma = 0.299 * r + 0.587 * g + 0.114 * b;
  let val = Math.pow(luma, 1.25);
  val = (val - 0.5) * 1.35 + 0.5;
  val = clamp(val);
  return [val, val, val];
});
fs.writeFileSync(path.join(outDir, 'black_white.cube'), blackWhite);

// 5. Bleach Bypass: Desaturated, crushed shadows, high contrast, silver retention
const bleachBypass = generateCubeString('Bleach Bypass', SIZE, (r, g, b) => {
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const desatR = r * 0.4 + luma * 0.6;
  const desatG = g * 0.4 + luma * 0.6;
  const desatB = b * 0.4 + luma * 0.6;

  const blend = (base, l) => (base < 0.5) ? (2.0 * base * l) : (1.0 - 2.0 * (1.0 - base) * (1.0 - l));

  let nr = blend(desatR, luma);
  let ng = blend(desatG, luma);
  let nb = blend(desatB, luma);
  nb *= 1.05;

  return [clamp(nr), clamp(ng), clamp(nb)];
});
fs.writeFileSync(path.join(outDir, 'bleach_bypass.cube'), bleachBypass);

console.log('Successfully generated 5 preset .cube files in public/luts/');
