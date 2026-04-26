import { Image, Platform } from "react-native";

const sampleSources: Record<string, any> = {
  Dermatitis: require("@/assets/samples/dermatitis.jpg"),
  Eczema: require("@/assets/samples/eczema.jpg"),
  Scabies: require("@/assets/samples/scabies.jpg"),
  "Tinea Ringworm": require("@/assets/samples/tinea_ringworm.jpg"),
  Vitiligo: require("@/assets/samples/vitiligo.jpg"),
};

export const SAMPLE_KEYS = Object.keys(sampleSources);

/**
 * Resolve the dev / production API base URL.
 * The Expo dev script exports EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN, which is
 * the same proxy host that fronts the API server at the /api path prefix.
 */
function apiBase(): string {
  const dom = (process.env as any).EXPO_PUBLIC_DOMAIN as string | undefined;
  if (dom) return `https://${dom}/api`;
  // Fallback for local dev outside Replit
  return Platform.OS === "web" ? "/api" : "http://localhost:8080/api";
}

export interface ServerVerdict {
  condition: string;
  confidence: number;
  topMatches: { cls: string; file: string; dist: number }[];
  classScores: Record<string, number>;
  totalReferenceImages: number;
  durationMs: number;
}

export async function diagnoseImage(uri: string): Promise<ServerVerdict> {
  const fd = new FormData();

  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const blob = await res.blob();
    fd.append("image", blob, "scan.jpg");
  } else {
    fd.append("image", {
      uri,
      name: "scan.jpg",
      type: "image/jpeg",
    } as any);
  }

  const r = await fetch(`${apiBase()}/diagnose`, {
    method: "POST",
    body: fd,
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Diagnose request failed (${r.status}): ${text}`);
  }
  return (await r.json()) as ServerVerdict;
}

/** For web demo: pick a random bundled dataset sample and return its asset URI. */
export function pickSampleUri(): string {
  const keys = SAMPLE_KEYS;
  const k = keys[Math.floor(Math.random() * keys.length)];
  const src = sampleSources[k];
  const resolved = Image.resolveAssetSource(src);
  return resolved.uri;
}
