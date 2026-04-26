import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { FONT } from "@/constants/typography";

import type { Risk } from "@/lib/fitzpatrick";

const COLOR: Record<Risk, string> = {
  HIGH: "#C0392B",
  MEDIUM: "#B8860B",
  LOW: "#2E7D52",
};

export function RiskBadge({ risk, size = "md" }: { risk: Risk; size?: "sm" | "md" }) {
  const bg = COLOR[risk];
  return (
    <View
      style={[
        styles.pill,
        size === "sm" ? styles.sm : styles.md,
        { backgroundColor: bg },
      ]}
    >
      <Text style={[styles.text, size === "sm" && { fontSize: 9 }]}>{risk}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: 999, alignItems: "center", justifyContent: "center" },
  sm: { paddingHorizontal: 8, paddingVertical: 3 },
  md: { paddingHorizontal: 12, paddingVertical: 5 },
  text: {
    fontFamily: FONT.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: "#fff",
  },
});
