export type LanguageOption = {
  code: string;
  label: string;
};

export const languageOptions: LanguageOption[] = [
  { code: "auto", label: "Auto Detect" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" }
];

export const languageCodes = new Set(languageOptions.map((lang) => lang.code));
