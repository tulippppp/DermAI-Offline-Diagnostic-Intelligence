import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CorridorBackground } from "@/components/CorridorBackground";
import { GlassCard } from "@/components/GlassCard";
import { MicButton } from "@/components/MicButton";
import { PillButton } from "@/components/PillButton";
import { ProgressBadge } from "@/components/ProgressBadge";
import { SpeakerButton } from "@/components/SpeakerButton";
import { UndoBar } from "@/components/UndoBar";
import { FONT } from "@/constants/typography";
import { useSession, type PatientDetails, type Sex } from "@/context/SessionContext";
import { t } from "@/lib/bhashini";

type FieldKey = keyof PatientDetails;

export default function PatientScreen() {
  const insets = useSafeAreaInsets();
  const { language, patient, updatePatient, undoStack, undoLast } = useSession();
  const lang = language ?? "en";
  const [activeField, setActiveField] = useState<FieldKey>("fullName");

  const lastUndo = undoStack[undoStack.length - 1]?.field ?? null;

  const allComplete =
    !!patient.fullName.trim() &&
    !!patient.age.trim() &&
    !!patient.sex &&
    !!patient.weight.trim() &&
    !!patient.village.trim();

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={styles.root}>
      <CorridorBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: bottomInset + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressBadge step={1} />

        <GlassCard tint="light" style={{ maxWidth: 370, alignSelf: "center", width: "100%" }}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{t("patient_details", lang)}</Text>
              <SpeakerButton textKey="patient_details" lang={lang} size="sm" />
            </View>
            <Pressable onPress={() => router.replace("/")} hitSlop={12}>
              <Feather name="x" size={20} color="#0f1a24" />
            </Pressable>
          </View>

          <UndoBar lastField={lastUndo} onUndo={undoLast} />

          <Field
            label={t("full_name", lang)}
            labelKey="full_name"
            lang={lang}
            value={patient.fullName}
            active={activeField === "fullName"}
            onChange={(v) => updatePatient("fullName", v)}
            onFocus={() => setActiveField("fullName")}
            placeholder="e.g. Ramesh Patil"
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label={t("age", lang)}
                labelKey="age"
                lang={lang}
                value={patient.age}
                active={activeField === "age"}
                onChange={(v) => updatePatient("age", v.replace(/[^0-9]/g, ""))}
                onFocus={() => setActiveField("age")}
                placeholder="42"
                keyboard="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t("weight", lang)}
                labelKey="weight"
                lang={lang}
                value={patient.weight}
                active={activeField === "weight"}
                onChange={(v) => updatePatient("weight", v.replace(/[^0-9.]/g, ""))}
                onFocus={() => setActiveField("weight")}
                placeholder="62"
                keyboard="decimal-pad"
              />
            </View>
          </View>

          <View style={{ marginBottom: 14 }}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>{t("sex", lang).toUpperCase()}</Text>
              <SpeakerButton textKey="sex" lang={lang} size="sm" />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["Male", "Female", "Other"] as Sex[]).map((s) => {
                const sel = patient.sex === s;
                const labelKey = s === "Male" ? "male" : s === "Female" ? "female" : "other";
                return (
                  <Pressable
                    key={s}
                    onPress={() => updatePatient("sex", s)}
                    style={({ pressed }) => [
                      styles.toggle,
                      sel && styles.toggleSel,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={[styles.toggleText, sel && { color: "#fff" }]}>{t(labelKey, lang)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Field
            label={t("village", lang)}
            labelKey="village"
            lang={lang}
            value={patient.village}
            active={activeField === "village"}
            onChange={(v) => updatePatient("village", v)}
            onFocus={() => setActiveField("village")}
            placeholder="e.g. Selu"
          />

          <View style={styles.inputBar}>
            <View style={styles.inputBarLeft}>
              <Pressable style={styles.inputBarBtn}>
                <Feather name="more-horizontal" size={16} color="#0f1a24" />
              </Pressable>
              <Text style={styles.inputBarText}>
                Active: <Text style={{ color: "#0f1a24", fontFamily: FONT.serifBold }}>{labelOf(activeField, lang)}</Text>
              </Text>
            </View>
            <MicButton
              onTranscript={(text) => updatePatient(activeField, text as any)}
              samples={transcriptSamples(activeField)}
            />
          </View>

          {allComplete ? (
            <View style={styles.completeRow}>
              <View style={styles.completeBadge}>
                <Feather name="check" size={14} color="#fff" />
              </View>
              <Text style={styles.completeText}>All fields complete · advance to history</Text>
            </View>
          ) : null}
        </GlassCard>

        <View style={{ marginTop: 22, alignItems: "center" }}>
          <PillButton
            label={`Next · ${t("patient_history", lang)}`}
            onPress={() => router.push("/history")}
            disabled={!allComplete}
            pulse={allComplete}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function labelOf(f: FieldKey, lang: any) {
  const map: Record<FieldKey, string> = {
    fullName: t("full_name", lang),
    age: t("age", lang),
    sex: t("sex", lang),
    weight: t("weight", lang),
    village: t("village", lang),
  };
  return map[f];
}

function transcriptSamples(f: FieldKey): string[] {
  switch (f) {
    case "fullName":
      return ["Ramesh Patil", "Lakshmi Devi", "Suresh Kumar", "Anita Sharma"];
    case "age":
      return ["42", "57", "29", "63"];
    case "weight":
      return ["62", "55", "78", "48"];
    case "village":
      return ["Selu", "Karjat", "Bhilwara", "Murshidabad"];
    default:
      return ["Yes", "No"];
  }
}

interface FieldProps {
  label: string;
  labelKey: string;
  lang: any;
  value: string;
  active: boolean;
  onChange: (v: string) => void;
  onFocus: () => void;
  placeholder?: string;
  keyboard?: "default" | "number-pad" | "decimal-pad";
}

function Field({ label, labelKey, lang, value, active, onChange, onFocus, placeholder, keyboard = "default" }: FieldProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
        <SpeakerButton textKey={labelKey} lang={lang} size="sm" />
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor="rgba(15,26,36,0.3)"
        keyboardType={keyboard}
        style={[styles.input, active && styles.inputActive]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#060d14" },
  scroll: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontFamily: FONT.serifBold, fontSize: 20, color: "#0f1a24" },
  fieldHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  fieldLabel: {
    fontFamily: FONT.monoMedium,
    fontSize: 9,
    letterSpacing: 2,
    color: "rgba(15,26,36,0.55)",
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(15,26,36,0.12)",
    paddingHorizontal: 14,
    fontFamily: FONT.serif,
    fontSize: 15,
    color: "#0f1a24",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  inputActive: {
    borderColor: "rgba(46,125,82,0.5)",
    backgroundColor: "rgba(207,228,217,0.45)",
  },
  toggle: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(15,26,36,0.18)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  toggleSel: { backgroundColor: "#0f1a24", borderColor: "#0f1a24" },
  toggleText: {
    fontFamily: FONT.serifBold,
    fontSize: 14,
    color: "#0f1a24",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(15,26,36,0.08)",
  },
  inputBarLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  inputBarBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(15,26,36,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputBarText: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: "rgba(15,26,36,0.55)",
    letterSpacing: 0.6,
    flex: 1,
  },
  completeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(46,125,82,0.12)",
    borderWidth: 1,
    borderColor: "rgba(46,125,82,0.35)",
  },
  completeBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2E7D52",
    alignItems: "center",
    justifyContent: "center",
  },
  completeText: {
    fontFamily: FONT.monoMedium,
    fontSize: 11,
    color: "#1d4f33",
    letterSpacing: 1,
  },
});
