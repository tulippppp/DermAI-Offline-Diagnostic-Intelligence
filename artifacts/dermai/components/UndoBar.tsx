import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { FONT } from "@/constants/typography";

interface Props {
  lastField: string | null;
  onUndo: () => void;
  tint?: "warm" | "neutral";
}

export function UndoBar({ lastField, onUndo, tint = "neutral" }: Props) {
  const enabled = !!lastField;
  const fg = tint === "warm" ? "#8B1A1A" : "#0f1a24";
  return (
    <View style={[styles.wrap, { borderColor: tint === "warm" ? "rgba(192,57,43,0.18)" : "rgba(15,26,36,0.10)" }]}>
      <Text style={[styles.label, { color: enabled ? fg : "rgba(15,26,36,0.4)" }]}>
        {enabled ? `Last: ${lastField}` : "Nothing to undo"}
      </Text>
      <Pressable
        onPress={() => {
          if (!enabled) return;
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onUndo();
        }}
        style={({ pressed }) => [
          styles.btn,
          { opacity: enabled ? (pressed ? 0.7 : 1) : 0.35 },
        ]}
      >
        <Feather name="corner-up-left" size={12} color="#C0392B" />
        <Text style={styles.btnText}>Undo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.02)",
    marginBottom: 14,
  },
  label: {
    fontFamily: FONT.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(192,57,43,0.10)",
  },
  btnText: {
    fontFamily: FONT.monoMedium,
    fontSize: 10,
    letterSpacing: 1.3,
    color: "#C0392B",
  },
});
