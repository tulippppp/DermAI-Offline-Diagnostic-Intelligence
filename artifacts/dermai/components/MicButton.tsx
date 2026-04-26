import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

import { FONT } from "@/constants/typography";

interface Props {
  onTranscript: (text: string) => void;
  /** Sample phrases to mock-transcribe. */
  samples?: string[];
}

const DEFAULT_SAMPLES = [
  "Itchy patch on left arm for two weeks",
  "Burning sensation, dry scaly skin",
  "Started after fever, hypopigmented",
  "No pain, but spreading slowly",
];

/**
 * MicButton — uses Web Speech API on web, expo-speech-recognition stub on
 * native. Native voice transcription is mocked for the first build with a
 * realistic 1.6s delay producing a sample phrase.
 *
 * Production path:
 *   import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
 *   ExpoSpeechRecognitionModule.start({ lang: locale, interimResults: true });
 */
export function MicButton({ onTranscript, samples = DEFAULT_SAMPLES }: Props) {
  const [recording, setRecording] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const recRef = useRef<any>(null);

  useEffect(() => {
    if (!recording) return;
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, [recording, pulse]);

  const stop = () => {
    setRecording(false);
    try { recRef.current?.stop?.(); } catch {}
  };

  const start = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const r = new SR();
        r.continuous = false;
        r.interimResults = true;
        r.onresult = (ev: any) => {
          const text = Array.from(ev.results).map((res: any) => res[0].transcript).join(" ");
          onTranscript(text);
        };
        r.onend = () => setRecording(false);
        r.onerror = () => setRecording(false);
        recRef.current = r;
        setRecording(true);
        try { r.start(); } catch { setRecording(false); }
        return;
      }
    }

    // Native / fallback mock
    setRecording(true);
    setTimeout(() => {
      const phrase = samples[Math.floor(Math.random() * samples.length)];
      onTranscript(phrase);
      setRecording(false);
    }, 1600);
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable
          onPress={recording ? stop : start}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: recording ? "#C0392B" : "#0f1a24", opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name={recording ? "square" : "mic"} size={22} color="#fff" />
        </Pressable>
      </Animated.View>
      {recording ? <Text style={styles.status}>Listening…</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  btn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  status: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: "#C0392B",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
