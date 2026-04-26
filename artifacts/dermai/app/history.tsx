import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CorridorBackground } from "@/components/CorridorBackground";
import { GlassCard } from "@/components/GlassCard";
import { MicButton } from "@/components/MicButton";
import { PillButton } from "@/components/PillButton";
import { ProgressBadge } from "@/components/ProgressBadge";
import { SpeakerButton } from "@/components/SpeakerButton";
import { UndoBar } from "@/components/UndoBar";
import { FONT } from "@/constants/typography";
import { useSession } from "@/context/SessionContext";
import { speakKey, t } from "@/lib/bhashini";

const QUESTION_KEYS = [
  "question_1",
  "question_2",
  "question_3",
  "question_4",
  "question_5",
  "question_6",
  "question_7",
] as const;

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { language, history, setHistoryAt, undoStack, undoLast } = useSession();
  const lang = language ?? "en";
  const [idx, setIdx] = useState(0);
  const [describe, setDescribe] = useState<string>("");
  const slide = React.useRef(new Animated.Value(0)).current;

  const current = QUESTION_KEYS[idx];
  const lastUndo = undoStack[undoStack.length - 1]?.field ?? null;

  useEffect(() => {
    Animated.timing(slide, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    speakKey(current, lang);
  }, [idx, current, lang, slide]);

  useEffect(() => {
    const ans = history[idx];
    setDescribe(typeof ans === "string" && ans !== "yes" && ans !== "no" ? ans : "");
  }, [idx, history]);

  const choose = (val: "yes" | "no") => {
    setHistoryAt(idx, val);
  };

  const isAnswered = useMemo(() => !!history[idx], [history, idx]);

  const advance = () => {
    if (describe.trim()) setHistoryAt(idx, describe.trim());
    if (idx < QUESTION_KEYS.length - 1) {
      slide.setValue(0);
      setIdx(idx + 1);
    } else {
      router.push("/scan");
    }
  };

  const back = () => {
    if (idx > 0) {
      slide.setValue(0);
      setIdx(idx - 1);
    }
  };

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const answeredCount = history.filter(Boolean).length;

  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const opacity = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={styles.root}>
      <CorridorBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: bottomInset + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressBadge step={2} />

        <GlassCard tint="warm" style={{ maxWidth: 370, alignSelf: "center", width: "100%" }}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{t("patient_history", lang)}</Text>
              <SpeakerButton textKey="patient_history" lang={lang} size="sm" variant="warm" />
            </View>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Feather name="x" size={20} color="#8B1A1A" />
            </Pressable>
          </View>

          <UndoBar lastField={lastUndo} onUndo={undoLast} tint="warm" />

          <View style={styles.progRow}>
            <View style={styles.progTrack}>
              <View style={[styles.progFill, { width: `${(answeredCount / QUESTION_KEYS.length) * 100}%` }]} />
            </View>
            <Text style={styles.progText}>{idx + 1} / {QUESTION_KEYS.length}</Text>
          </View>

          <Animated.View style={{ transform: [{ translateX }], opacity, marginTop: 6 }}>
            <View style={styles.qHeader}>
              <Text style={styles.qNum}>Q{idx + 1}</Text>
              <SpeakerButton textKey={current} lang={lang} size="sm" variant="warm" />
            </View>
            <Text style={styles.qText}>{t(current, lang)}</Text>
          </Animated.View>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
            {(["yes", "no"] as const).map((v) => {
              const sel = history[idx] === v;
              return (
                <Pressable
                  key={v}
                  onPress={() => choose(v)}
                  style={({ pressed }) => [
                    styles.toggle,
                    sel && styles.toggleSel,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Feather name={v === "yes" ? "check" : "x"} size={14} color={sel ? "#fff" : "#8B1A1A"} />
                  <Text style={[styles.toggleText, sel && { color: "#fff" }]}>
                    {t(v, lang)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.orText}>OR DESCRIBE</Text>
          <TextInput
            value={describe}
            onChangeText={setDescribe}
            placeholder={t("describe", lang)}
            placeholderTextColor="rgba(139,26,26,0.35)"
            style={styles.textarea}
            multiline
          />

          <View style={styles.micRow}>
            <Text style={styles.micHint}>Voice answer</Text>
            <MicButton onTranscript={(text) => setDescribe(text)} />
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
            <Pressable
              onPress={back}
              disabled={idx === 0}
              style={({ pressed }) => [
                styles.secondary,
                idx === 0 && { opacity: 0.4 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Feather name="chevron-left" size={16} color="#8B1A1A" />
              <Text style={styles.secondaryText}>Back</Text>
            </Pressable>

            <Pressable
              onPress={advance}
              disabled={!isAnswered && !describe.trim()}
              style={({ pressed }) => [
                styles.primary,
                (!isAnswered && !describe.trim()) && { opacity: 0.4 },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.primaryText}>
                {idx === QUESTION_KEYS.length - 1 ? t("finish", lang) : t("next", lang)}
              </Text>
              <Feather name="chevron-right" size={16} color="#fff" />
            </Pressable>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#060d14" },
  scroll: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontFamily: FONT.serifBold, fontSize: 20, color: "#8B1A1A" },
  progRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  progTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(192,57,43,0.15)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progFill: { height: 4, backgroundColor: "#C0392B", borderRadius: 999 },
  progText: {
    fontFamily: FONT.monoMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#8B1A1A",
  },
  qHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  qNum: {
    fontFamily: FONT.monoMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: "#8B1A1A",
  },
  qText: {
    fontFamily: FONT.serifItalic,
    fontStyle: "italic",
    fontSize: 18,
    color: "#8B1A1A",
    marginTop: 8,
    lineHeight: 26,
  },
  toggle: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "rgba(192,57,43,0.3)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,244,243,0.6)",
  },
  toggleSel: { backgroundColor: "#8B1A1A", borderColor: "#8B1A1A" },
  toggleText: {
    fontFamily: FONT.serifBold,
    fontSize: 14,
    color: "#8B1A1A",
  },
  orText: {
    fontFamily: FONT.monoMedium,
    fontSize: 9,
    letterSpacing: 2.4,
    color: "rgba(139,26,26,0.55)",
    marginTop: 16,
    marginBottom: 6,
  },
  textarea: {
    minHeight: 70,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(192,57,43,0.25)",
    backgroundColor: "rgba(255,255,255,0.55)",
    padding: 12,
    fontFamily: FONT.serif,
    fontSize: 14,
    color: "#0f1a24",
    textAlignVertical: "top",
  },
  micRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  micHint: {
    fontFamily: FONT.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    color: "rgba(139,26,26,0.55)",
    textTransform: "uppercase",
  },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 18,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139,26,26,0.3)",
    backgroundColor: "rgba(255,244,243,0.6)",
  },
  secondaryText: {
    fontFamily: FONT.serifBold,
    fontSize: 14,
    color: "#8B1A1A",
  },
  primary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#0f1a24",
  },
  primaryText: {
    fontFamily: FONT.serifBold,
    fontSize: 14,
    color: "#fff",
    letterSpacing: 0.4,
  },
});
