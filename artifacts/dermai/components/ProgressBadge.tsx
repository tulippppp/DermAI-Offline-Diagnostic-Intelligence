import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { FONT } from "@/constants/typography";

export function ProgressBadge({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.pill}>
        <Text style={styles.text}>STEP {step} OF {total}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", marginBottom: 14 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  text: {
    fontFamily: FONT.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: "rgba(255,255,255,0.85)",
  },
});
