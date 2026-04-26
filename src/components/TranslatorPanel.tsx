"use client";

import { useEffect, useState } from "react";
import { languageOptions } from "@/lib/languages";
import { initializeZoomSdk } from "@/lib/zoom";

type TranslatePayload = {
  translatedText: string;
};

export function TranslatorPanel() {
  const [text, setText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translatedText, setTranslatedText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastInput, setLastInput] = useState("");
  const [zoomContext, setZoomContext] = useState("initializing");

  useEffect(() => {
    initializeZoomSdk()
      .then((result) => {
        setZoomContext(result.context);
      })
      .catch(() => {
        setZoomContext("browser");
      });
  }, []);

  async function translate(inputText: string) {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: inputText,
          sourceLanguage,
          targetLanguage
        })
      });

      const payload = (await response.json()) as TranslatePayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Translation failed.");
      }

      setTranslatedText(payload.translatedText);
      setLastInput(inputText);
    } catch (translateError) {
      setError(
        translateError instanceof Error
          ? translateError.message
          : "Unexpected translation error."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const disableTranslate = isLoading || !text.trim() || targetLanguage === "auto";
  const statusText = isLoading
    ? "Working on your translation..."
    : text.trim()
      ? "Looks good. Hit translate when ready."
      : "Write or paste a sentence to begin.";

  return (
    <main className="pageShell">
      <div className="textureLayer" />
      <section className="translatorCard">
        <header className="cardHeader">
          <p className="eyebrow">In-Meeting Language Assistant</p>
          <h1>Emma</h1>
          <p className="contextLine">
            Translate text quickly during live meetings.
            <span className="contextPill">Context: {zoomContext}</span>
          </p>
        </header>

        <div className="languageGrid">
          <label className="fieldLabel">
            From
            <select
              value={sourceLanguage}
              onChange={(event) => setSourceLanguage(event.target.value)}
              className="selectInput"
            >
              {languageOptions.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>
          <label className="fieldLabel">
            To
            <select
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
              className="selectInput"
            >
              {languageOptions
                .filter((language) => language.code !== "auto")
                .map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <label className="fieldLabel sectionLabel" htmlFor="sourceText">
          Text to Translate
        </label>
        <textarea
          id="sourceText"
          rows={7}
          maxLength={1200}
          className="inputArea"
          placeholder="Write naturally, like you're chatting in a meeting..."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <p className="liveStatus">{statusText}</p>

        <div className="actionRow">
          <button
            type="button"
            disabled={disableTranslate}
            onClick={() => translate(text)}
            className="actionButton actionPrimary"
          >
            {isLoading ? "Translating..." : "Translate"}
          </button>
          <button
            type="button"
            disabled={isLoading || !lastInput}
            onClick={() => translate(lastInput)}
            className="actionButton actionGhost"
          >
            Retry
          </button>
        </div>

        {error ? (
          <p role="alert" className="errorText">
            {error}
          </p>
        ) : null}

        <section className="resultSection">
          <label className="fieldLabel sectionLabel" htmlFor="translatedText">
            Translation
          </label>
          <textarea
            id="translatedText"
            rows={7}
            readOnly
            className="inputArea inputReadOnly"
            placeholder="Your translated text will appear here."
            value={translatedText}
          />
          <div className="copyRow">
            <span className="charCount">
              {text.length}/1200 chars {translatedText ? "• Ready to copy" : "• Waiting for input"}
            </span>
            <button
              type="button"
              disabled={!translatedText}
              onClick={() => navigator.clipboard.writeText(translatedText)}
              className="actionButton actionGhost"
            >
              Copy
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
