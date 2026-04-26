import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";

interface Props {
  children: React.ReactNode;
  tint?: "light" | "warm";
  style?: ViewStyle | ViewStyle[];
}

export function GlassCard({ children, tint = "light", style }: Props) {
  const bg =
    tint === "warm" ? "rgba(255,244,243,0.94)" : "rgba(255,255,255,0.93)";
  const border =
    tint === "warm" ? "rgba(192,57,43,0.22)" : "rgba(255,255,255,0.85)";
  return (
    <View style={[styles.shadowWrap, style]}>
      {Platform.OS !== "android" ? (
        <BlurView intensity={26} tint="light" style={[styles.card, { borderColor: border }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} />
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          {children}
        </BlurView>
      ) : (
        <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 28 },
    shadowRadius: 60,
    elevation: 18,
    borderRadius: 22,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: "hidden",
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  handleWrap: { alignItems: "center", marginBottom: 6 },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(15,26,36,0.18)",
  },
});
