import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  decodeFeatures,
  distance,
  encodeFeatures,
  extractFeatures,
} from "./imageFeatures";
import { logger } from "./logger";

export interface DatasetItem {
  cls: string;
  file: string;
  features: Float32Array;
}

export interface NearestMatch {
  cls: string;
  file: string;
  dist: number;
}

export interface DiagnosisVerdict {
  condition: string;
  confidence: number;
  topMatches: NearestMatch[];
  classScores: Record<string, number>;
  totalReferenceImages: number;
}

const K = 11; // odd, k-NN majority vote
const CACHE_FILENAME = ".features.v1.json";
const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

let CACHE: DatasetItem[] | null = null;
let LOAD_PROMISE: Promise<DatasetItem[]> | null = null;

function findDatasetRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), "dataset/dataset_cleaned"),
    path.resolve(process.cwd(), "artifacts/api-server/dataset/dataset_cleaned"),
    path.resolve(process.cwd(), "../api-server/dataset/dataset_cleaned"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    "Could not locate dataset/dataset_cleaned in any expected location",
  );
}

async function buildIndex(root: string): Promise<DatasetItem[]> {
  const out: DatasetItem[] = [];
  const classes = await readdir(root, { withFileTypes: true });
  for (const cls of classes) {
    if (!cls.isDirectory()) continue;
    const dir = path.join(root, cls.name);
    const files = await readdir(dir);
    for (const f of files) {
      const ext = path.extname(f).toLowerCase();
      if (!VALID_EXT.has(ext)) continue;
      const full = path.join(dir, f);
      try {
        const buf = await readFile(full);
        const features = await extractFeatures(buf);
        out.push({ cls: cls.name, file: f, features });
      } catch (e) {
        logger.warn({ err: e, file: full }, "Skipping unreadable image");
      }
    }
    logger.info(
      { cls: cls.name, total: out.filter((i) => i.cls === cls.name).length },
      "Indexed class",
    );
  }
  return out;
}

async function readCache(cachePath: string): Promise<DatasetItem[] | null> {
  try {
    const raw = await readFile(cachePath, "utf8");
    const parsed = JSON.parse(raw) as {
      items: { cls: string; file: string; features: string }[];
    };
    return parsed.items.map((i) => ({
      cls: i.cls,
      file: i.file,
      features: decodeFeatures(i.features),
    }));
  } catch {
    return null;
  }
}

async function writeCache(
  cachePath: string,
  items: DatasetItem[],
): Promise<void> {
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(
    cachePath,
    JSON.stringify({
      version: 1,
      items: items.map((i) => ({
        cls: i.cls,
        file: i.file,
        features: encodeFeatures(i.features),
      })),
    }),
  );
}

export async function loadIndex(): Promise<DatasetItem[]> {
  if (CACHE) return CACHE;
  if (LOAD_PROMISE) return LOAD_PROMISE;
  LOAD_PROMISE = (async () => {
    const root = findDatasetRoot();
    const cachePath = path.join(root, CACHE_FILENAME);
    const cached = await readCache(cachePath);
    if (cached && cached.length > 0) {
      logger.info(
        { count: cached.length, cachePath },
        "Loaded diagnosis index from cache",
      );
      CACHE = cached;
      return cached;
    }
    logger.info({ root }, "Building diagnosis index from disk (first run)");
    const t0 = Date.now();
    const items = await buildIndex(root);
    await writeCache(cachePath, items);
    logger.info(
      { count: items.length, ms: Date.now() - t0 },
      "Built and cached diagnosis index",
    );
    CACHE = items;
    return items;
  })();
  return LOAD_PROMISE;
}

export async function diagnose(
  imageBuffer: Buffer,
): Promise<DiagnosisVerdict> {
  const items = await loadIndex();
  const query = await extractFeatures(imageBuffer);

  // Compute distance to every dataset image
  const scored = items.map<NearestMatch>((it) => ({
    cls: it.cls,
    file: it.file,
    dist: distance(query, it.features),
  }));

  scored.sort((a, b) => a.dist - b.dist);
  const top = scored.slice(0, K);

  // Distance-weighted vote
  const classScores: Record<string, number> = {};
  for (const m of top) {
    const w = 1 / (1e-6 + m.dist);
    classScores[m.cls] = (classScores[m.cls] ?? 0) + w;
  }

  const ranked = Object.entries(classScores).sort((a, b) => b[1] - a[1]);
  const [winner, winnerScore] = ranked[0];
  const totalScore = ranked.reduce((s, [, v]) => s + v, 0);

  // Confidence = winner's share of total weighted votes (0..1)
  const share = winnerScore / totalScore;
  // Penalise by raw distance of best match — far-from-anything → lower confidence
  const bestDist = top[0].dist;
  const distPenalty = Math.max(0, Math.min(1, 1 - bestDist / 0.55));
  const confidence = Math.round(
    Math.min(99, Math.max(35, (share * 0.7 + distPenalty * 0.3) * 100)),
  );

  const normalisedScores: Record<string, number> = {};
  for (const [k, v] of Object.entries(classScores)) {
    normalisedScores[k] = Number(((v / totalScore) * 100).toFixed(1));
  }

  return {
    condition: winner,
    confidence,
    topMatches: top,
    classScores: normalisedScores,
    totalReferenceImages: items.length,
  };
}

export function getIndexStatus(): {
  loaded: boolean;
  count: number;
  classes: string[];
} {
  if (!CACHE) return { loaded: false, count: 0, classes: [] };
  const classes = Array.from(new Set(CACHE.map((i) => i.cls))).sort();
  return { loaded: true, count: CACHE.length, classes };
}
