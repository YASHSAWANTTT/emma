"use client";

import { useCallback, useRef, useState } from "react";

const langToBcp47: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-BR",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  hi: "hi-IN",
  ar: "ar-SA"
};

export function usePracticeAudio(languageCode: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const play = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      stop();
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/practice/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed, languageCode })
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `TTS failed (${res.status})`);
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
          }
        };

        await audio.play();
      } catch (firstError) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utter = new SpeechSynthesisUtterance(trimmed);
          utter.lang = langToBcp47[languageCode] ?? languageCode;
          utter.rate = 0.95;
          speechSynthesis.cancel();
          speechSynthesis.speak(utter);
        } else {
          setError(
            firstError instanceof Error ? firstError.message : "Playback is not supported here."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [languageCode, stop]
  );

  return { play, stop, loading, error };
}
