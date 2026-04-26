export const FONT = {
  serif: "LibreBaskerville_400Regular",
  serifBold: "LibreBaskerville_700Bold",
  serifItalic: "LibreBaskerville_400Regular_Italic",
  mono: "DMMono_400Regular",
  monoMedium: "DMMono_500Medium",
};

export const TYPE = {
  display: { fontFamily: FONT.serifBold, fontSize: 32, letterSpacing: -0.6 },
  h1: { fontFamily: FONT.serifBold, fontSize: 22 },
  h2: { fontFamily: FONT.serifBold, fontSize: 20 },
  h3: { fontFamily: FONT.serifBold, fontSize: 17 },
  body: { fontFamily: FONT.serif, fontSize: 15, lineHeight: 22 },
  italic: { fontFamily: FONT.serifItalic, fontSize: 17, fontStyle: "italic" as const },
  label: { fontFamily: FONT.monoMedium, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase" as const },
  meta: { fontFamily: FONT.mono, fontSize: 10, letterSpacing: 2 },
};
