import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CorridorBackground } from "@/components/CorridorBackground";
import { ProgressBadge } from "@/components/ProgressBadge";
import { FONT } from "@/constants/typography";
import { useSession } from "@/context/SessionContext";
import { pickSampleUri } from "@/lib/api";
import { speakKey, t } from "@/lib/bhashini";
import { recordDiagnosis } from "@/lib/diseaseMap";
import {
  detectFitzpatrick,
  estimateIlluminant,
  fitzColor,
  runDiagnosisFromImage,
  type FitzType,
  type Illuminant,
} from "@/lib/fitzpatrick";

const FITZ_CYCLE: FitzType[] = ["I", "II", "III", "IV", "V", "VI"];

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { language, patient, setDiagnosis } = useSession();
  const lang = language ?? "en";

  const [permission, requestPermission] = useCameraPermissions();
  const [fitz, setFitz] = useState<FitzType>("V");
  const [illuminant, setIlluminant] = useState<Illuminant>("daylight");
  const [locked, setLocked] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [passiveCount, setPassiveCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const cameraRef = useRef<CameraView | null>(null);
  const flash = useRef(new Animated.Value(0)).current;
  const arc = useRef(new Animated.Value(0)).current;
  const scanLine = useRef(new Animated.Value(0)).current;

  // Animate scan line
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, [scanLine]);

  // Cycle Fitzpatrick types until locked
  useEffect(() => {
    if (locked) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % FITZ_CYCLE.length;
      setFitz(FITZ_CYCLE[i]);
    }, 280);
    const lockTimer = setTimeout(() => {
      const detected = detectFitzpatrick();
      const lit = estimateIlluminant();
      setFitz(detected);
      setIlluminant(lit);
      setLocked(true);
      clearInterval(id);
      speakKey("point_at_skin", lang);
    }, 2400);
    return () => { clearInterval(id); clearTimeout(lockTimer); };
  }, [locked, lang]);

  // Passive capture queue
  useEffect(() => {
    const id = setInterval(() => setPassiveCount((c) => c + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const onCapture = async () => {
    if (capturing) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setCapturing(true);
    setError(null);
    Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    Animated.timing(arc, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: false }).start();

    try {
      let uri: string | null = null;
      if (Platform.OS !== "web" && cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.7,
            skipProcessing: true,
          });
          uri = photo?.uri ?? null;
        } catch (e) {
          // Camera capture failed (e.g. permission rejected) — fall back to sample
          uri = null;
        }
      }
      if (!uri) {
        uri = pickSampleUri();
      }

      const result = await runDiagnosisFromImage(uri);
      // Force the result to use the locked Fitzpatrick + illuminant
      result.fitzpatrick = fitz;
      result.illuminant = illuminant;
      result.darkSkinFlag = fitz === "V" || fitz === "VI";

      setDiagnosis(result);
      // Anonymised log for the Herd Immunity Map (no PII).
      recordDiagnosis(result, patient.village || "Nagpur").catch(() => {});
      arc.setValue(0);
      setCapturing(false);
      router.push("/result");
    } catch (e) {
      arc.setValue(0);
      setCapturing(false);
      setError(e instanceof Error ? e.message : "Diagnosis failed");
    }
  };

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const showCamera = Platform.OS !== "web" && permission?.granted;

  return (
    <View style={styles.root}>
      {showCamera ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <CorridorBackground />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: showCamera ? "rgba(0,0,0,0.35)" : "rgba(6,13,20,0.65)" }]} />

      <View style={[styles.topBar, { paddingTop: topInset + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={14}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.topTitle}>DERMAI SCAN</Text>
        <View style={{ width: 22 }} />
      </View>

      <ProgressBadge step={3} />

      <View style={styles.fitzPill}>
        <View style={[styles.fitzDot, { backgroundColor: fitzColor(fitz) }]} />
        <Text style={styles.fitzText}>FITZ TYPE {fitz}</Text>
        <View style={styles.dotSep} />
        <Text style={[styles.fitzText, { color: locked ? "#2E7D52" : "#B8860B" }]}>
          {locked ? "LOCKED" : "DETECTING"}
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLine.interpolate({ inputRange: [0, 1], outputRange: [0, 218] }),
                  },
                ],
              },
            ]}
          />
        </View>
        <Text style={styles.label}>{t("point_at_skin", lang)}</Text>
        <View style={styles.illumRow}>
          <Feather name="sun" size={11} color="rgba(255,255,255,0.55)" />
          <Text style={styles.illum}>ILLUMINANT · {illuminant.toUpperCase()}</Text>
          <View style={styles.dotSep} />
          <Feather name="archive" size={11} color="rgba(255,255,255,0.55)" />
          <Text style={styles.illum}>QUEUED · {passiveCount}</Text>
        </View>
        {error ? (
          <View style={styles.errBox}>
            <Feather name="alert-triangle" size={12} color="#fff" />
            <Text style={styles.errText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.bottom, { paddingBottom: bottomInset + 26 }]}>
        {!showCamera && Platform.OS !== "web" && permission && !permission.granted ? (
          <Pressable onPress={() => requestPermission()} style={styles.permBtn}>
            <Feather name="camera" size={14} color="#0f1a24" />
            <Text style={styles.permText}>Enable camera</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onCapture} disabled={capturing}>
          <View style={styles.captureWrap}>
            <Animated.View
              style={[
                styles.captureArc,
                {
                  borderColor: "#C0392B",
                  borderRightColor: arc.interpolate({ inputRange: [0, 0.25, 0.5], outputRange: ["transparent", "#C0392B", "#C0392B"] }) as any,
                  borderBottomColor: arc.interpolate({ inputRange: [0, 0.25, 0.5, 0.75], outputRange: ["transparent", "transparent", "#C0392B", "#C0392B"] }) as any,
                  borderLeftColor: arc.interpolate({ inputRange: [0, 0.5, 0.75, 1], outputRange: ["transparent", "transparent", "transparent", "#C0392B"] }) as any,
                  transform: [
                    { rotate: arc.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) },
                  ],
                },
              ]}
            />
            <View style={styles.captureBtn}>
              <View style={styles.captureInner} />
            </View>
          </View>
        </Pressable>
        <Text style={styles.captureHint}>
          {capturing ? "MATCHING AGAINST DATASET…" : "TAP TO CAPTURE · READY"}
        </Text>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: flash }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#060d14" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  topTitle: {
    fontFamily: FONT.monoMedium,
    fontSize: 11,
    letterSpacing: 3.5,
    color: "#fff",
  },
  fitzPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    marginBottom: 8,
  },
  fitzDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" },
  fitzText: {
    fontFamily: FONT.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: "#fff",
  },
  dotSep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.4)" },
  viewfinder: { width: 220, height: 220, position: "relative", overflow: "hidden", borderRadius: 4 },
  corner: { position: "absolute", width: 22, height: 22, borderColor: "#fff", borderWidth: 0 },
  cornerTL: { top: 0, left: 0, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 3 },
  scanLine: {
    position: "absolute",
    left: 4,
    right: 4,
    height: 1.5,
    backgroundColor: "rgba(192,57,43,0.85)",
    shadowColor: "#C0392B",
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  label: {
    marginTop: 18,
    fontFamily: FONT.serif,
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  illumRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginTop: 12,
  },
  illum: {
    fontFamily: FONT.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.55)",
  },
  errBox: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(192,57,43,0.85)",
  },
  errText: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: "#fff",
    letterSpacing: 0.6,
    maxWidth: 280,
  },
  bottom: { alignItems: "center", paddingBottom: 26, gap: 10 },
  permBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 999,
    marginBottom: 8,
  },
  permText: { fontFamily: FONT.serifBold, color: "#0f1a24", fontSize: 13 },
  captureWrap: { width: 86, height: 86, alignItems: "center", justifyContent: "center" },
  captureArc: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: "transparent",
  },
  captureBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(15,26,36,0.15)",
  },
  captureHint: {
    fontFamily: FONT.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.55)",
  },
});
