import sharp from "sharp";

/**
 * Image feature extraction for skin-condition matching.
 *
 * Each image is reduced to a 192-dimensional Float32 vector composed of:
 *   - 64 floats : 8x8 grayscale "tile" (rough texture / shape signature)
 *   - 128 floats: HSV color histogram (8 hue × 4 sat × 4 val), L1-normalised
 *
 * Distance between two images is the L2 distance of their feature vectors,
 * with the tile contributing 60% and the histogram 40% of total weight.
 */

export const FEATURE_DIM = 192;
const TILE_DIM = 64;
const HIST_DIM = 128;
const TILE_WEIGHT = 0.6;
const HIST_WEIGHT = 0.4;

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  return [h, s, v];
}

export async function extractFeatures(buffer: Buffer): Promise<Float32Array> {
  const { data } = await sharp(buffer)
    .removeAlpha()
    .resize(32, 32, { fit: "cover" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 32x32 RGB → 8x8 grayscale tile (4x4 block-mean)
  const tile = new Float32Array(TILE_DIM);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let sum = 0;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
          const px = ((y * 4 + dy) * 32 + (x * 4 + dx)) * 3;
          const r = data[px] / 255;
          const g = data[px + 1] / 255;
          const b = data[px + 2] / 255;
          sum += 0.299 * r + 0.587 * g + 0.114 * b;
        }
      }
      tile[y * 8 + x] = sum / 16;
    }
  }

  // 8H × 4S × 4V HSV histogram, L1-normalised
  const hist = new Float32Array(HIST_DIM);
  for (let i = 0; i < 32 * 32; i++) {
    const r = data[i * 3] / 255;
    const g = data[i * 3 + 1] / 255;
    const b = data[i * 3 + 2] / 255;
    const [h, s, v] = rgbToHsv(r, g, b);
    const hb = Math.min(7, Math.floor(h * 8));
    const sb = Math.min(3, Math.floor(s * 4));
    const vb = Math.min(3, Math.floor(v * 4));
    hist[hb * 16 + sb * 4 + vb] += 1;
  }
  for (let i = 0; i < HIST_DIM; i++) hist[i] /= 1024;

  const out = new Float32Array(FEATURE_DIM);
  out.set(tile, 0);
  out.set(hist, TILE_DIM);
  return out;
}

/**
 * Weighted L2 distance between two feature vectors.
 * Lower = more similar.
 */
export function distance(a: Float32Array, b: Float32Array): number {
  let tile = 0;
  for (let i = 0; i < TILE_DIM; i++) {
    const d = a[i] - b[i];
    tile += d * d;
  }
  let hist = 0;
  for (let i = TILE_DIM; i < FEATURE_DIM; i++) {
    const d = a[i] - b[i];
    hist += d * d;
  }
  return TILE_WEIGHT * Math.sqrt(tile) + HIST_WEIGHT * Math.sqrt(hist);
}

export function encodeFeatures(f: Float32Array): string {
  return Buffer.from(f.buffer, f.byteOffset, f.byteLength).toString("base64");
}

export function decodeFeatures(s: string): Float32Array {
  const buf = Buffer.from(s, "base64");
  // Copy into a fresh, aligned buffer so Float32Array indexing works
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return new Float32Array(ab);
}
