import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CorridorBackground } from "@/components/CorridorBackground";
import { FONT } from "@/constants/typography";
import {
  computeStats,
  detectClusters,
  formatRelative,
  getRecords,
  riskColor,
  seedIfEmpty,
  subscribe,
  type ClusterAlert,
  type DiagnosisRecord,
  type DiseaseStats,
} from "@/lib/diseaseMap";

const NAGPUR_CENTER: [number, number] = [21.1458, 79.0882];
const ZOOM = 10;

let leafletPromise: Promise<any> | null = null;

function ensureLeaflet(): Promise<any> {
  if (Platform.OS !== "web") return Promise.reject(new Error("web only"));
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    const head = document.head;
    if (!document.querySelector("link[data-leaflet]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute("data-leaflet", "true");
      head.appendChild(link);
    }
    if (!document.querySelector("style[data-dermai-map]")) {
      const style = document.createElement("style");
      style.setAttribute("data-dermai-map", "true");
      style.textContent = `
        @keyframes dermai-pulse {
          0%   { transform: scale(0.8); opacity: 0.85; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .dermai-cluster-pulse {
          border-radius: 50%;
          background: rgba(192,57,43,0.5);
          width: 80px; height: 80px;
          animation: dermai-pulse 1.8s ease-out infinite;
          pointer-events: none;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(15,26,36,0.92);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 6px;
          font-family: 'DM Mono', ui-monospace, monospace;
          font-size: 11px;
        }
        .leaflet-popup-tip { background: rgba(15,26,36,0.92); }
        .leaflet-popup-close-button { color: rgba(255,255,255,0.6) !important; }
        .leaflet-container { background: #060d14; outline: none; }
      `;
      head.appendChild(style);
    }
    const existing = document.querySelector(
      "script[data-leaflet]",
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).L));
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.setAttribute("data-leaflet", "true");
    s.onload = () => resolve((window as any).L);
    s.onerror = reject;
    head.appendChild(s);
  });
  return leafletPromise;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [ready, setReady] = useState(false);

  // Slide-up entrance
  const slide = useRef(new Animated.Value(40)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slide, fade]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await seedIfEmpty();
      const r = await getRecords();
      if (mounted) {
        setRecords(r);
        setReady(true);
      }
    })();
    const off = subscribe((r) => mounted && setRecords(r));
    return () => {
      mounted = false;
      off();
    };
  }, []);

  const clusters = useMemo(() => detectClusters(records), [records]);
  const stats = useMemo(() => computeStats(records), [records]);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset =
    Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={styles.root}>
      <CorridorBackground />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(6,13,20,0.55)" },
        ]}
      />

      <Animated.View
        style={[
          styles.sheet,
          {
            opacity: fade,
            transform: [{ translateY: slide }],
            paddingTop: topInset + 12,
            paddingBottom: bottomInset + 12,
          },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={14}>
            <Feather name="x" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.topTitle}>HERD IMMUNITY MAP</Text>
          <View style={{ width: 22 }} />
        </View>

        <ClusterBanner clusters={clusters} />

        <View style={styles.mapWrap}>
          {Platform.OS === "web" ? (
            <LeafletMap records={records} clusters={clusters} ready={ready} />
          ) : (
            <NativeMapFallback records={records} clusters={clusters} />
          )}
        </View>

        <StatsStrip stats={stats} />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------

function ClusterBanner({ clusters }: { clusters: ClusterAlert[] }) {
  if (clusters.length === 0) return null;
  const c = clusters[0];
  return (
    <View style={styles.banner}>
      <Feather name="alert-triangle" size={14} color="#fff" />
      <Text style={styles.bannerText}>
        CLUSTER DETECTED · {c.condition.toUpperCase()} · {c.village.toUpperCase()} ·{" "}
        {c.count} CASES IN {c.windowHours}H
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------

interface LeafletMapProps {
  records: DiagnosisRecord[];
  clusters: ClusterAlert[];
  ready: boolean;
}

function LeafletMap({ records, clusters, ready }: LeafletMapProps) {
  const containerRef = useRef<View | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Init map once
  useEffect(() => {
    if (Platform.OS !== "web") return;
    let cancelled = false;
    ensureLeaflet()
      .then((L: any) => {
        if (cancelled) return;
        const node =
          (containerRef.current as any)?._nativeTag !== undefined
            ? null
            : (containerRef.current as unknown as HTMLDivElement | null);
        // RN-web View renders as div; ref returns the actual DOM node
        const dom = (node ?? containerRef.current) as unknown as HTMLDivElement;
        if (!dom || mapRef.current) return;
        const map = L.map(dom, {
          zoomControl: true,
          attributionControl: false,
        }).setView(NAGPUR_CENTER, ZOOM);
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          {
            attribution: "&copy; OpenStreetMap, &copy; CartoDB",
            subdomains: "abcd",
            maxZoom: 19,
          },
        ).addTo(map);
        mapRef.current = map;
        layerRef.current = L.layerGroup().addTo(map);
        // Force a resize once mounted (RN-web sometimes lays out a tick later)
        setTimeout(() => map.invalidateSize(), 60);
      })
      .catch((e) => setError(e?.message ?? "Map failed to load"));
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-render markers + clusters whenever data changes
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!ready) return;
    const L = (window as any).L;
    if (!L || !mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();

    for (const r of records) {
      const marker = L.circleMarker([r.lat, r.lon], {
        radius: 8,
        color: riskColor(r.risk),
        weight: 2,
        fillColor: riskColor(r.risk),
        fillOpacity: 0.55,
      });
      const html = `
        <div style="font-family:'DM Mono',monospace;line-height:1.55">
          <div style="font-size:10px;letter-spacing:1.6px;color:rgba(255,255,255,0.55)">DIAGNOSIS · ANON</div>
          <div style="font-family:'Libre Baskerville',serif;font-size:14px;color:#fff;margin-top:4px">${escapeHtml(r.condition)}</div>
          <div style="margin-top:6px;font-size:10px;color:rgba(255,255,255,0.7)">FITZ ${r.fitzpatrick} · RISK ${r.risk}</div>
          <div style="margin-top:2px;font-size:10px;color:rgba(255,255,255,0.55)">${formatRelative(r.date)} · ${escapeHtml(r.village)}</div>
        </div>`;
      marker.bindPopup(html);
      marker.addTo(layerRef.current);
    }

    for (const c of clusters) {
      // Static halo
      L.circle([c.lat, c.lon], {
        radius: 4500,
        color: "#C0392B",
        weight: 1,
        fillColor: "#C0392B",
        fillOpacity: 0.12,
      }).addTo(layerRef.current);
      // CSS pulse marker overlay
      const pulse = L.divIcon({
        className: "",
        html: '<div class="dermai-cluster-pulse"></div>',
        iconSize: [80, 80],
        iconAnchor: [40, 40],
      });
      L.marker([c.lat, c.lon], { icon: pulse, interactive: false }).addTo(
        layerRef.current,
      );
    }
  }, [records, clusters, ready]);

  if (error) {
    return (
      <View style={[styles.mapInner, styles.mapError]}>
        <Feather name="wifi-off" size={20} color="rgba(255,255,255,0.6)" />
        <Text style={styles.errText}>Map tiles unreachable · {error}</Text>
      </View>
    );
  }

  return <View ref={containerRef as any} style={styles.mapInner} />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------

function NativeMapFallback({
  records,
  clusters,
}: {
  records: DiagnosisRecord[];
  clusters: ClusterAlert[];
}) {
  return (
    <ScrollView
      style={styles.mapInner}
      contentContainerStyle={{ padding: 14, gap: 8 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.fallbackHint}>
        NAGPUR DISTRICT · {records.length} ANONYMISED RECORDS
      </Text>
      {clusters.map((c) => (
        <View key={c.village + c.condition} style={styles.clusterRow}>
          <View style={styles.clusterDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.clusterTitle}>
              CLUSTER · {c.village.toUpperCase()}
            </Text>
            <Text style={styles.clusterSub}>
              {c.condition} · {c.count} cases / {c.windowHours}h
            </Text>
          </View>
        </View>
      ))}
      {records.map((r) => (
        <View key={r.id} style={styles.recordRow}>
          <View
            style={[styles.recordDot, { backgroundColor: riskColor(r.risk) }]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.recordTitle}>
              {r.condition} · {r.village}
            </Text>
            <Text style={styles.recordSub}>
              FITZ {r.fitzpatrick} · {r.risk} · {formatRelative(r.date)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------

function StatsStrip({ stats }: { stats: DiseaseStats }) {
  return (
    <View style={styles.statsStrip}>
      <Stat label="THIS MONTH" value={String(stats.totalThisMonth)} />
      <Stat
        label="ACTIVE CLUSTERS"
        value={String(stats.activeClusters)}
        accent={stats.activeClusters > 0 ? "#C0392B" : undefined}
      />
      <Stat label="MOST COMMON" value={stats.mostCommonCondition ?? "—"} />
      <Stat label="MOST AFFECTED" value={stats.mostAffectedVillage ?? "—"} />
    </View>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[styles.statValue, accent ? { color: accent } : null]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#060d14" },
  sheet: { flex: 1, paddingHorizontal: 14 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingBottom: 10,
  },
  topTitle: {
    fontFamily: FONT.monoMedium,
    fontSize: 11,
    letterSpacing: 3.5,
    color: "#fff",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(192,57,43,0.92)",
    borderRadius: 8,
    marginBottom: 8,
  },
  bannerText: {
    flex: 1,
    fontFamily: FONT.monoMedium,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: "#fff",
  },
  mapWrap: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(6,13,20,0.6)",
  },
  mapInner: { flex: 1, width: "100%", height: "100%" },
  mapError: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  errText: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  statsStrip: {
    marginTop: 10,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 12,
  },
  statCell: { flex: 1, gap: 4 },
  statLabel: {
    fontFamily: FONT.mono,
    fontSize: 8.5,
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.5)",
  },
  statValue: {
    fontFamily: FONT.serifBold,
    fontSize: 13,
    color: "#fff",
  },
  fallbackHint: {
    fontFamily: FONT.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 6,
  },
  clusterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(192,57,43,0.18)",
    borderWidth: 1,
    borderColor: "rgba(192,57,43,0.5)",
  },
  clusterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#C0392B",
  },
  clusterTitle: {
    fontFamily: FONT.monoMedium,
    fontSize: 10.5,
    letterSpacing: 1.6,
    color: "#fff",
  },
  clusterSub: {
    fontFamily: FONT.serif,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  recordDot: { width: 10, height: 10, borderRadius: 5 },
  recordTitle: {
    fontFamily: FONT.serifBold,
    fontSize: 12.5,
    color: "#fff",
  },
  recordSub: {
    fontFamily: FONT.mono,
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },
});
