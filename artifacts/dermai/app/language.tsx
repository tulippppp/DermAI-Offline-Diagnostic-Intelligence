import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CorridorBackground } from "@/components/CorridorBackground";
import { PillButton } from "@/components/PillButton";
import { FONT } from "@/constants/typography";
import { useSession } from "@/context/SessionContext";
import { LANGUAGES, LangCode, speak, t } from "@/lib/bhashini";

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useSession();
  const current = (language ?? "en") as LangCode;

  const choose = (l: LangCode) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setLanguage(l);
    speak(t("select_language", l), l);
  };

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={styles.root}>
      <CorridorBackground />
      <View style={[styles.content, { paddingTop: topInset + 28, paddingBottom: bottomInset + 24 }]}>
        <View style={{ alignItems: "center", marginBottom: 22 }}>
          <Text style={styles.label}>STEP 0 · LANGUAGE</Text>
          <Text style={styles.title}>{t("select_language", current)}</Text>
          <Text style={styles.sub}>Bhashini handles every word the operator hears</Text>
        </View>

        <View style={styles.grid}>
          {LANGUAGES.map((l) => {
            const selected = current === l.code;
            return (
              <Pressable
                key={l.code}
                onPress={() => choose(l.code)}
                style={({ pressed }) => [
                  styles.card,
                  selected && styles.cardSelected,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.native, selected && { color: "#0f1a24" }]}>{l.native}</Text>
                <Text style={[styles.cardLabel, selected && { color: "rgba(15,26,36,0.7)" }]}>{l.label.toUpperCase()}</Text>
                {selected ? (
                  <View style={styles.tick}>
                    <Feather name="check" size={12} color="#fff" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: "auto", gap: 10 }}>
          <PillButton
            label="Continue"
            onPress={() => router.push("/patient")}
            disabled={!language}
          />
          <Text style={styles.hint}>The operator will hear every screen in this language</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#060d14" },
  content: { flex: 1, paddingHorizontal: 24 },
  label: {
    fontFamily: FONT.monoMedium,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 3,
    marginBottom: 10,
  },
  title: {
    fontFamily: FONT.serifBold,
    fontSize: 26,
    color: "#fff",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  sub: {
    fontFamily: FONT.serifItalic,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    columnGap: 12,
  },
  card: {
    width: "47%",
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "flex-start",
    overflow: "hidden",
  },
  cardSelected: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderColor: "#fff",
  },
  native: {
    fontFamily: FONT.serifBold,
    fontSize: 22,
    color: "#fff",
    marginBottom: 6,
  },
  cardLabel: {
    fontFamily: FONT.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.55)",
  },
  tick: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0f1a24",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontFamily: FONT.serifItalic,
    fontStyle: "italic",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
});
