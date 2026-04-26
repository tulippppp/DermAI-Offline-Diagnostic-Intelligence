import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CorridorBackground } from "@/components/CorridorBackground";
import { PillButton } from "@/components/PillButton";
import { FONT } from "@/constants/typography";
import { useSession } from "@/context/SessionContext";
import { t } from "@/lib/bhashini";

export default function LogoScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useSession();
  const lang = language ?? "en";

  const onStart = () => {
    if (language) router.push("/patient");
    else router.push("/language");
  };

  const onMap = () => router.push("/map");

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={styles.root}>
      <CorridorBackground />
      <View style={[styles.content, { paddingTop: topInset + 24, paddingBottom: bottomInset + 24 }]}>
        <View style={styles.center}>
          <Text style={styles.wordmark}>DermAI</Text>
          <Text style={styles.tagline}>{t("app_tagline", lang).toUpperCase()}</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>
            Built for rural India · Fitzpatrick V & VI · No internet required
          </Text>
        </View>
        <View style={styles.bottom}>
          <PillButton label={t("start_diagnosis", lang)} onPress={onStart} pulse />
          <Text style={styles.versionText}>OPERATOR BUILD v1.0 · OFFLINE FIRST</Text>
        </View>
      </View>

      <Pressable
        onPress={onMap}
        style={[styles.mapBtn, { bottom: bottomInset + 24 }]}
        hitSlop={8}
      >
        <Text style={styles.mapEmoji}>🗺️</Text>
        <Text style={styles.mapLabel}>Disease Map</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#060d14" },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  wordmark: {
    fontFamily: FONT.serifBold,
    fontSize: 44,
    color: "#fff",
    letterSpacing: -1.5,
    textShadowColor: "rgba(200,225,255,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  tagline: {
    fontFamily: FONT.monoMedium,
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 3.2,
    marginTop: 14,
  },
  divider: {
    width: 28,
    height: 1,
    backgroundColor: "rgba(200,225,255,0.4)",
    marginTop: 22,
    marginBottom: 18,
  },
  subtitle: {
    fontFamily: FONT.serifItalic,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  bottom: { alignItems: "center", gap: 18 },
  versionText: {
    fontFamily: FONT.mono,
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 2.5,
  },
  mapBtn: {
    position: "absolute",
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  mapEmoji: { fontSize: 13 },
  mapLabel: {
    fontFamily: FONT.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: "#0f1a24",
  },
});
