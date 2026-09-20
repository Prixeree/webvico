/**
 * Custom .cube 3D LUT Parser (~50 lines, zero external dependencies).
 * Parses Adobe / DaVinci Resolve 3D LUT specifications.
 */
export interface ParsedCubeLUT {
  title: string;
  size: number;
  data: Float32Array; // RGBA packed (size^3 * 4)
}

export function parseCubeFile(content: string): ParsedCubeLUT {
  const lines = content.split(/\r?\n/);
  let title = 'Custom LUT';
  let size = 0;
  const rgbValues: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    const keyword = parts[0].toUpperCase();

    if (keyword === 'TITLE') {
      title = line.substring(5).trim().replace(/^["']|["']$/g, '');
    } else if (keyword === 'LUT_3D_SIZE') {
      size = parseInt(parts[1], 10);
    } else if (keyword === 'LUT_1D_SIZE') {
      throw new Error('1D LUTs are not supported. Please supply a 3D .cube LUT.');
    } else if (!isNaN(parseFloat(parts[0])) && parts.length >= 3) {
      rgbValues.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
    }
  }

  if (size === 0) {
    size = Math.round(Math.cbrt(rgbValues.length / 3));
  }

  const totalEntries = size * size * size;
  const rgbaData = new Float32Array(totalEntries * 4);

  for (let i = 0; i < totalEntries; i++) {
    rgbaData[i * 4 + 0] = rgbValues[i * 3 + 0] ?? 0;
    rgbaData[i * 4 + 1] = rgbValues[i * 3 + 1] ?? 0;
    rgbaData[i * 4 + 2] = rgbValues[i * 3 + 2] ?? 0;
    rgbaData[i * 4 + 3] = 1.0;
  }

  return { title, size, data: rgbaData };
}
