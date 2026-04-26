import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import { StyleSheet, View } from "react-native";

const VIDEO_SOURCE = require("@/assets/videos/corridor.mp4");

/**
 * Hospital corridor background.
 * Plays a looping, muted MP4 of a clinical corridor as the canvas of every
 * screen, with a subtle gradient + vignette overlay so foreground glass cards
 * and white text remain legible.
 */
export function CorridorBackground() {
  const player = useVideoPlayer(VIDEO_SOURCE, (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 1.0;
    p.play();
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      {/* Tinting layer — anchors the deep blue/grey palette over any video */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(6,13,20,0.45)" }]} />

      {/* Subtle top + bottom darkening so glass cards and CTAs read cleanly */}
      <LinearGradient
        colors={["rgba(6,13,20,0.55)", "rgba(6,13,20,0.05)", "rgba(6,13,20,0.7)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
