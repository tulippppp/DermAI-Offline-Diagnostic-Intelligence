import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CorridorBackground } from "@/components/CorridorBackground";
import { GlassCard } from "@/components/GlassCard";
import { PillButton } from "@/components/PillButton";
import { RiskBadge } from "@/components/RiskBadge";
import { SpeakerButton } from "@/components/SpeakerButton";
import { FONT } from "@/constants/typography";
import { useSession } from "@/context/SessionContext";
import { fitzColor, type DiagnosisResult } from "@/lib/fitzpatrick";
import { findNearestPHC } from "@/lib/phc";
import { sendReferralSMS } from "@/lib/sms";
import { speak, t } from "@/lib/bhashini";

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const { diagnosis, patient, language, reset } = useSession();
  const lang = language ?? "en";

  const [smsSent, setSmsSent] = useState<null | { id: string; sentAt: string }>(null);
  const [sending, setSending] = useState(false);

  const phc = useMemo(() => findNearestPHC(patient.village || "Selu"), [patient.village]);

  if (!diagnosis) {
    return (
      <View style={styles.root}>
        <CorridorBackground />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No diagnosis yet</Text>
          <PillButton label="Back to scan" onPress={() => router.replace("/scan")} />
        </View>
      </View>
    );
  }

  const onGenerate = async () => {
    setSending(true);
    const msg = `DermAI Referral · ${patient.fullName} (${patient.age}y) · ${diagnosis.condition} · Confidence ${diagnosis.confidence}% · Fitz ${diagnosis.fitzpatrick} · ${diagnosis.directive}`;
    const r = await sendReferralSMS(phc.contact, msg);
    setSmsSent({ id: r.messageId, sentAt: r.sentAt });
    setSending(false);
    speak(diagnosis.directive, lang);
  };

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={styles.root}>
      <CorridorBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: bottomInset + 30 },
        ]}
      >
        <View style={styles.headerStrip}>
          <Pressable onPress={() => router.replace("/scan")} hitSlop={12}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTxt}>DIAGNOSIS REPORT</Text>
          <Pressable onPress={() => { reset(); router.replace("/"); }} hitSlop={12}>
            <Feather name="refresh-ccw" size={18} color="#fff" />
          </Pressable>
        </View>

        <GlassCard tint="light" style={{ width: "100%", maxWidth: 370, alignSelf: "center" }}>
          {/* Header — condition + confidence */}
          <View style={styles.condRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.condLabel}>DIAGNOSIS</Text>
              <Text style={styles.condName}>{diagnosis.condition}</Text>
              <View style={styles.confRow}>
                <Text style={styles.confNum}>{diagnosis.confidence}%</Text>
                <Text style={styles.confLabel}>CONFIDENCE</Text>
                <View style={{ flex: 1 }} />
                <RiskBadge risk={diagnosis.risk} />
              </View>
            </View>
            <SpeakerButton text={`${diagnosis.condition} confidence ${diagnosis.confidence} percent`} lang={lang} />
          </View>

          <View style={{ height: 1, backgroundColor: "rgba(15,26,36,0.08)", marginVertical: 12 }} />

          {/* Signal grid */}
          <View style={styles.gridWrap}>
            <SignalCell title="Lesion Type" value={diagnosis.lesionType} />
            <SignalCell title="Contagion Risk" value={diagnosis.contagionRisk} pillRisk={diagnosis.contagionRisk as any} />
            <SignalCell
              title="Fitzpatrick"
              value={`Type ${diagnosis.fitzpatrick}`}
              swatch={fitzColor(diagnosis.fitzpatrick)}
            />
            <SignalCell title="RGB Reliability" value={`${diagnosis.rgbReliability}%`} />
          </View>

          {/* Tone uncertainty banner for V/VI */}
          {diagnosis.darkSkinFlag ? (
            <View style={styles.toneFlag}>
              <Feather name="alert-triangle" size={14} color="#8B1A1A" />
              <Text style={styles.toneFlagText}>
                Tone uncertainty {diagnosis.toneUncertainty}% — dark-skin pipeline engaged. RGB inflammation cues unreliable; haemoglobin channel used.
              </Text>
            </View>
          ) : null}

          {/* Directive */}
          <View style={styles.directiveBox}>
            <View style={styles.directiveHeader}>
              <Text style={styles.directiveLabel}>OPERATOR DIRECTIVE</Text>
              <SpeakerButton text={diagnosis.directive} lang={lang} size="sm" />
            </View>
            <Text style={styles.directiveText}>{diagnosis.directive}</Text>
          </View>

          {/* Patient summary */}
          <View style={styles.patientStrip}>
            <Text style={styles.patientName}>{patient.fullName}</Text>
            <Text style={styles.patientMeta}>
              {patient.age}y · {patient.sex} · {patient.weight}kg · {patient.village}
            </Text>
          </View>

          {/* PHC */}
          <View style={styles.phcBox}>
            <Feather name="map-pin" size={14} color="#0f1a24" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.phcLabel}>NEAREST PHC · NHA HFR</Text>
              <Text style={styles.phcName}>{phc.name}</Text>
              <Text style={styles.phcMeta}>{phc.code} · {phc.district}</Text>
            </View>
          </View>

          {/* Generate referral */}
          {smsSent ? (
            <View style={styles.smsOk}>
              <Feather name="check-circle" size={14} color="#2E7D52" />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={styles.smsOkText}>Referral sent via Fast2SMS</Text>
                <Text style={styles.smsOkMeta}>{smsSent.id} · {phc.contact}</Text>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={onGenerate}
              disabled={sending}
              style={({ pressed }) => [styles.genBtn, pressed && { opacity: 0.85 }, sending && { opacity: 0.6 }]}
            >
              <Feather name="send" size={14} color="#fff" />
              <Text style={styles.genBtnText}>{sending ? "Sending…" : t("generate_referral", lang)}</Text>
            </Pressable>
          )}
        </GlassCard>

        <View style={{ marginTop: 22, alignItems: "center" }}>
          <PillButton
            label="New Patient"
            onPress={() => { reset(); router.replace("/"); }}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </View>
  );
}

function SignalCell({
  title,
  value,
  swatch,
  pillRisk,
}: {
  title: string;
  value: string;
  swatch?: string;
  pillRisk?: "HIGH" | "MEDIUM" | "LOW";
}) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellTitle}>{title.toUpperCase()}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
        {swatch ? <View style={[styles.swatch, { backgroundColor: swatch }]} /> : null}
        {pillRisk ? <RiskBadge risk={pillRisk} size="sm" /> : <Text style={styles.cellValue}>{value}</Text>}
        {swatch ? <Text style={styles.cellValue}>{value}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#060d14" },
  scroll: { paddingHorizontal: 20 },
  headerStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTxt: {
    fontFamily: FONT.monoMedium,
    fontSize: 11,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.85)",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 24 },
  emptyText: { fontFamily: FONT.serif, color: "#fff", fontSize: 16 },
  condRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  condLabel: {
    fontFamily: FONT.monoMedium,
    fontSize: 9,
    letterSpacing: 2,
    color: "rgba(15,26,36,0.5)",
    marginBottom: 4,
  },
  condName: {
    fontFamily: FONT.serifBold,
    fontSize: 22,
    fontStyle: "italic",
    color: "#0f1a24",
    letterSpacing: -0.3,
  },
  confRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  confNum: { fontFamily: FONT.monoMedium, fontSize: 18, color: "#0f1a24" },
  confLabel: {
    fontFamily: FONT.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    color: "rgba(15,26,36,0.5)",
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
  },
  cell: {
    width: "47%",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(15,26,36,0.04)",
    borderWidth: 1,
    borderColor: "rgba(15,26,36,0.06)",
  },
  cellTitle: {
    fontFamily: FONT.monoMedium,
    fontSize: 8,
    letterSpacing: 1.6,
    color: "rgba(15,26,36,0.55)",
  },
  cellValue: {
    fontFamily: FONT.serifBold,
    fontSize: 13,
    color: "#0f1a24",
  },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: "rgba(15,26,36,0.2)" },
  toneFlag: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(192,57,43,0.08)",
    borderWidth: 1,
    borderColor: "rgba(192,57,43,0.25)",
  },
  toneFlagText: {
    flex: 1,
    fontFamily: FONT.serif,
    fontSize: 11,
    color: "#8B1A1A",
    lineHeight: 16,
  },
  directiveBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(15,26,36,0.96)",
  },
  directiveHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  directiveLabel: {
    fontFamily: FONT.monoMedium,
    fontSize: 9,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.55)",
  },
  directiveText: {
    fontFamily: FONT.serif,
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
  patientStrip: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(15,26,36,0.08)",
  },
  patientName: { fontFamily: FONT.serifBold, fontSize: 16, color: "#0f1a24" },
  patientMeta: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: "rgba(15,26,36,0.55)",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  phcBox: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(46,125,82,0.08)",
    borderWidth: 1,
    borderColor: "rgba(46,125,82,0.25)",
  },
  phcLabel: {
    fontFamily: FONT.monoMedium,
    fontSize: 8,
    letterSpacing: 1.8,
    color: "rgba(15,26,36,0.55)",
  },
  phcName: { fontFamily: FONT.serifBold, fontSize: 14, color: "#0f1a24", marginTop: 2 },
  phcMeta: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: "rgba(15,26,36,0.55)",
    marginTop: 2,
    letterSpacing: 0.6,
  },
  genBtn: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0f1a24",
    paddingVertical: 14,
    borderRadius: 12,
  },
  genBtnText: {
    fontFamily: FONT.serifBold,
    fontSize: 14,
    color: "#fff",
    letterSpacing: 0.4,
  },
  smsOk: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(46,125,82,0.12)",
    borderWidth: 1,
    borderColor: "rgba(46,125,82,0.35)",
  },
  smsOkText: {
    fontFamily: FONT.serifBold,
    fontSize: 13,
    color: "#1d4f33",
  },
  smsOkMeta: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: "rgba(29,79,51,0.7)",
    marginTop: 2,
    letterSpacing: 0.6,
  },
});
