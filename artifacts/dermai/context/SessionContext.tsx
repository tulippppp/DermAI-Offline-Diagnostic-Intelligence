import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { LangCode } from "@/lib/bhashini";
import type { DiagnosisResult } from "@/lib/fitzpatrick";

export type Sex = "Male" | "Female" | "Other";

export interface PatientDetails {
  fullName: string;
  age: string;
  sex: Sex | "";
  weight: string;
  village: string;
}

export type HistoryAnswer = "yes" | "no" | string;

export interface SessionState {
  language: LangCode | null;
  patient: PatientDetails;
  history: (HistoryAnswer | null)[];
  diagnosis: DiagnosisResult | null;
}

const EMPTY_PATIENT: PatientDetails = {
  fullName: "",
  age: "",
  sex: "",
  weight: "",
  village: "",
};

interface UndoEntry {
  field: string;
  prev: any;
}

interface SessionContextValue extends SessionState {
  setLanguage: (l: LangCode) => void;
  updatePatient: <K extends keyof PatientDetails>(field: K, value: PatientDetails[K]) => void;
  setHistoryAt: (index: number, value: HistoryAnswer) => void;
  setDiagnosis: (d: DiagnosisResult | null) => void;
  reset: () => void;
  undoStack: UndoEntry[];
  undoLast: () => void;
  ready: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "dermai.session.v1";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LangCode | null>(null);
  const [patient, setPatient] = useState<PatientDetails>(EMPTY_PATIENT);
  const [history, setHistory] = useState<(HistoryAnswer | null)[]>(Array(7).fill(null));
  const [diagnosis, setDiagnosisState] = useState<DiagnosisResult | null>(null);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<SessionState>;
          if (parsed.language) setLanguageState(parsed.language);
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  const persistLanguage = useCallback(async (l: LangCode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ language: l }));
    } catch {}
  }, []);

  const setLanguage = useCallback(
    (l: LangCode) => {
      setLanguageState(l);
      persistLanguage(l);
    },
    [persistLanguage]
  );

  const updatePatient = useCallback<SessionContextValue["updatePatient"]>((field, value) => {
    setPatient((prev) => {
      setUndoStack((s) => [...s, { field: String(field), prev: prev[field] }]);
      return { ...prev, [field]: value };
    });
  }, []);

  const setHistoryAt = useCallback((index: number, value: HistoryAnswer) => {
    setHistory((prev) => {
      setUndoStack((s) => [...s, { field: `Q${index + 1}`, prev: prev[index] }]);
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const setDiagnosis = useCallback((d: DiagnosisResult | null) => {
    setDiagnosisState(d);
  }, []);

  const reset = useCallback(() => {
    setPatient(EMPTY_PATIENT);
    setHistory(Array(7).fill(null));
    setDiagnosisState(null);
    setUndoStack([]);
  }, []);

  const undoLast = useCallback(() => {
    setUndoStack((s) => {
      if (s.length === 0) return s;
      const last = s[s.length - 1];
      if (last.field.startsWith("Q")) {
        const idx = parseInt(last.field.slice(1), 10) - 1;
        setHistory((prev) => {
          const next = [...prev];
          next[idx] = last.prev;
          return next;
        });
      } else {
        setPatient((prev) => ({ ...prev, [last.field]: last.prev }));
      }
      return s.slice(0, -1);
    });
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      language,
      patient,
      history,
      diagnosis,
      setLanguage,
      updatePatient,
      setHistoryAt,
      setDiagnosis,
      reset,
      undoStack,
      undoLast,
      ready,
    }),
    [language, patient, history, diagnosis, setLanguage, updatePatient, setHistoryAt, setDiagnosis, reset, undoStack, undoLast, ready]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const v = useContext(SessionContext);
  if (!v) throw new Error("useSession must be used inside SessionProvider");
  return v;
}
