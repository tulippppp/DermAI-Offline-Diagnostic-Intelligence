/**
 * Disease Map — anonymised diagnosis ledger + cluster detection.
 *
 * Records ONLY: condition, village (+ lat/lon), date, Fitzpatrick type, risk.
 * NEVER patient name, age, sex, weight, or any other PII.
 *
 * Persists to AsyncStorage (which is backed by localStorage on web).
 * Subscribers (e.g. the open Map screen) get pinged on every save so markers
 * refresh in real time.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import type { DiagnosisResult, FitzType, Risk } from "./fitzpatrick";

export interface VillageCoord {
  name: string;
  lat: number;
  lon: number;
}

export const VILLAGES: VillageCoord[] = [
  { name: "Bhandara", lat: 21.1667, lon: 79.65 },
  { name: "Wardha", lat: 20.7453, lon: 78.6022 },
  { name: "Tumsar", lat: 21.3833, lon: 79.7333 },
  { name: "Pauni", lat: 20.7833, lon: 79.6333 },
  { name: "Lakhandur", lat: 21.25, lon: 79.9 },
  { name: "Mohadi", lat: 21.1167, lon: 79.9333 },
  { name: "Nagpur", lat: 21.1458, lon: 79.0882 },
  { name: "Kamptee", lat: 21.2167, lon: 79.1833 },
  { name: "Hingna", lat: 21.05, lon: 78.95 },
  { name: "Katol", lat: 21.2667, lon: 78.5833 },
  { name: "Narkhed", lat: 21.45, lon: 78.5833 },
  { name: "Savner", lat: 21.35, lon: 79.05 },
  { name: "Ramtek", lat: 21.3833, lon: 79.3167 },
  { name: "Parseoni", lat: 21.3167, lon: 79.2 },
  { name: "Mouda", lat: 21.25, lon: 79.2833 },
  { name: "Kalmeshwar", lat: 21.2167, lon: 78.9333 },
  { name: "Kuhi", lat: 21.0667, lon: 79.2667 },
  { name: "Butibori", lat: 21.0167, lon: 79.0 },
  { name: "Umred", lat: 20.85, lon: 79.3167 },
  { name: "Bhiwapur", lat: 20.95, lon: 79.5 },
];

const VILLAGE_INDEX: Record<string, VillageCoord> = VILLAGES.reduce(
  (acc, v) => {
    acc[v.name.toLowerCase()] = v;
    return acc;
  },
  {} as Record<string, VillageCoord>,
);

export function lookupVillage(name: string): VillageCoord | null {
  if (!name) return null;
  return VILLAGE_INDEX[name.trim().toLowerCase()] ?? null;
}

export interface DiagnosisRecord {
  id: string;
  condition: string;
  village: string;
  date: string; // ISO
  fitzpatrick: FitzType;
  risk: Risk;
  lat: number;
  lon: number;
}

export interface ClusterAlert {
  village: string;
  condition: string;
  count: number;
  lat: number;
  lon: number;
  windowHours: number;
}

export interface DiseaseStats {
  totalThisMonth: number;
  activeClusters: number;
  mostCommonCondition: string | null;
  mostAffectedVillage: string | null;
}

const STORAGE_KEY = "dermai.disease_map.records.v1";
const SEED_FLAG_KEY = "dermai.disease_map.seeded.v1";
const CLUSTER_WINDOW_HOURS = 72;
const CLUSTER_THRESHOLD = 3;

type Listener = (records: DiagnosisRecord[]) => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(records: DiagnosisRecord[]) {
  for (const fn of listeners) fn(records);
}

let CACHE: DiagnosisRecord[] | null = null;

export async function getRecords(): Promise<DiagnosisRecord[]> {
  if (CACHE) return CACHE;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    CACHE = raw ? (JSON.parse(raw) as DiagnosisRecord[]) : [];
  } catch {
    CACHE = [];
  }
  return CACHE;
}

async function persist(records: DiagnosisRecord[]): Promise<void> {
  CACHE = records;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
  notify(records);
}

function genId(): string {
  return `dx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Append a single anonymised diagnosis record. Resolves the village's lat/lon
 * via the lookup table, falling back to the Nagpur centroid if unknown.
 */
export async function recordDiagnosis(
  diagnosis: DiagnosisResult,
  villageName: string,
): Promise<DiagnosisRecord> {
  const v = lookupVillage(villageName) ?? lookupVillage("Nagpur")!;
  const rec: DiagnosisRecord = {
    id: genId(),
    condition: diagnosis.condition,
    village: v.name,
    date: new Date().toISOString(),
    fitzpatrick: diagnosis.fitzpatrick,
    risk: diagnosis.risk,
    lat: v.lat,
    lon: v.lon,
  };
  const all = await getRecords();
  const next = [rec, ...all];
  await persist(next);
  return rec;
}

export function detectClusters(records: DiagnosisRecord[]): ClusterAlert[] {
  const now = Date.now();
  const cutoff = now - CLUSTER_WINDOW_HOURS * 60 * 60 * 1000;
  const buckets = new Map<string, DiagnosisRecord[]>();
  for (const r of records) {
    const t = Date.parse(r.date);
    if (Number.isNaN(t) || t < cutoff) continue;
    const key = `${r.village}|||${r.condition}`;
    const arr = buckets.get(key) ?? [];
    arr.push(r);
    buckets.set(key, arr);
  }
  const out: ClusterAlert[] = [];
  for (const [key, arr] of buckets) {
    if (arr.length < CLUSTER_THRESHOLD) continue;
    const [village, condition] = key.split("|||");
    const v = lookupVillage(village);
    if (!v) continue;
    out.push({
      village,
      condition,
      count: arr.length,
      lat: v.lat,
      lon: v.lon,
      windowHours: CLUSTER_WINDOW_HOURS,
    });
  }
  // Sort biggest first
  out.sort((a, b) => b.count - a.count);
  return out;
}

export function computeStats(records: DiagnosisRecord[]): DiseaseStats {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const thisMonth = records.filter((r) => Date.parse(r.date) >= monthStart);

  const conditionCounts = new Map<string, number>();
  const villageCounts = new Map<string, number>();
  for (const r of records) {
    conditionCounts.set(r.condition, (conditionCounts.get(r.condition) ?? 0) + 1);
    villageCounts.set(r.village, (villageCounts.get(r.village) ?? 0) + 1);
  }
  const top = (m: Map<string, number>): string | null => {
    let best: string | null = null;
    let bestN = 0;
    for (const [k, v] of m) if (v > bestN) { bestN = v; best = k; }
    return best;
  };

  return {
    totalThisMonth: thisMonth.length,
    activeClusters: detectClusters(records).length,
    mostCommonCondition: top(conditionCounts),
    mostAffectedVillage: top(villageCounts),
  };
}

export function riskColor(r: Risk): string {
  if (r === "HIGH") return "#C0392B";
  if (r === "MEDIUM") return "#B8860B";
  return "#2E7D52";
}

// ---------------------------------------------------------------------------
// Seed data — first-load demo records, including a deliberate Scabies cluster
// in Bhandara (3 cases inside the last 48h) so the cluster banner fires
// immediately on first open.
// ---------------------------------------------------------------------------

const FITZ_CHOICES: FitzType[] = ["IV", "V", "V", "V", "VI", "VI"];
const SCATTER_CONDITIONS: { c: string; r: Risk }[] = [
  { c: "Eczema", r: "MEDIUM" },
  { c: "Tinea Ringworm", r: "LOW" },
  { c: "Vitiligo", r: "MEDIUM" },
  { c: "Dermatitis", r: "MEDIUM" },
  { c: "Scabies", r: "HIGH" },
];

function buildSeed(): DiagnosisRecord[] {
  const out: DiagnosisRecord[] = [];
  const now = Date.now();

  // 3 Scabies cases in Bhandara within last 48h → triggers cluster banner.
  // (The brief mentioned leprosy; our trained dataset's highest-contagion class
  //  is Scabies, so we use it as the cluster condition for an authentic demo.)
  const bhandara = lookupVillage("Bhandara")!;
  const scabiesHours = [4, 17, 39];
  for (const h of scabiesHours) {
    out.push({
      id: genId(),
      condition: "Scabies",
      village: bhandara.name,
      date: new Date(now - h * 3600 * 1000).toISOString(),
      fitzpatrick: "V",
      risk: "HIGH",
      lat: bhandara.lat,
      lon: bhandara.lon,
    });
  }

  // 12 scattered records across other villages, last 25 days
  const scatterVillages = VILLAGES.filter((v) => v.name !== "Bhandara");
  for (let i = 0; i < 12; i++) {
    const v = scatterVillages[i % scatterVillages.length];
    const cond = SCATTER_CONDITIONS[i % SCATTER_CONDITIONS.length];
    const ageDays = 1 + (i * 2 + 1);
    out.push({
      id: genId(),
      condition: cond.c,
      village: v.name,
      date: new Date(now - ageDays * 86400 * 1000).toISOString(),
      fitzpatrick: FITZ_CHOICES[i % FITZ_CHOICES.length],
      risk: cond.r,
      lat: v.lat,
      lon: v.lon,
    });
  }

  return out;
}

/**
 * If no records exist yet, seed 15 demo records (3 of which form the Bhandara
 * Scabies cluster). Idempotent — only seeds once per device.
 */
export async function seedIfEmpty(): Promise<void> {
  try {
    const flagged = await AsyncStorage.getItem(SEED_FLAG_KEY);
    if (flagged) return;
    const existing = await getRecords();
    if (existing.length > 0) {
      await AsyncStorage.setItem(SEED_FLAG_KEY, "1");
      return;
    }
    await persist(buildSeed());
    await AsyncStorage.setItem(SEED_FLAG_KEY, "1");
  } catch {}
}

export function formatRelative(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return `${months}mo ago`;
}
