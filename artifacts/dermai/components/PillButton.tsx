import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { FONT } from "@/constants/typography";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "dark";
  pulse?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PillButton({ label, onPress, variant = "primary", pulse, disabled, style }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse) return;
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, [pulse, scale]);

  const bg =
    variant === "primary" ? "#ffffff" : variant === "dark" ? "#0f1a24" : "rgba(255,255,255,0.08)";
  const fg = variant === "dark" || variant === "ghost" ? "#ffffff" : "#0f1a24";
  const border =
    variant === "ghost" ? "rgba(255,255,255,0.35)" : "transparent";

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={() => {
          if (disabled) return;
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          onPress();
        }}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.row}>
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  label: {
    fontFamily: FONT.serifBold,
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
