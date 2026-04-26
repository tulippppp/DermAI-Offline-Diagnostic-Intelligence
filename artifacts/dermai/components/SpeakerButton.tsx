import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

import { speak, t, LangCode } from "@/lib/bhashini";

interface Props {
  textKey?: string;
  text?: string;
  lang: LangCode;
  size?: "sm" | "md";
  variant?: "dark" | "warm";
}

export function SpeakerButton({ textKey, text, lang, size = "md", variant = "dark" }: Props) {
  const dim = size === "sm" ? 26 : 36;
  const ic = size === "sm" ? 14 : 18;
  const bg = variant === "warm" ? "rgba(192,57,43,0.12)" : "rgba(15,26,36,0.08)";
  const fg = variant === "warm" ? "#8B1A1A" : "#0f1a24";
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
        const out = text ?? (textKey ? t(textKey, lang) : "");
        if (out) speak(out, lang);
      }}
      style={({ pressed }) => [
        styles.btn,
        { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Feather name="volume-2" size={ic} color={fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: "center", justifyContent: "center" },
});
