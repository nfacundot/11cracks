const FEMALE_TERMS = [
  "female", "woman", "femenin", "fémin", "femenina", "femenino",
  "samantha", "victoria", "helena", "zira", "sabina", "camila", "jenny",
  "aria", "hazel", "susan", "katja", "amala", "conny", "denise", "julie",
  "elsie", "francisca", "elsa", "anna", "karen", "joanna", "sally", "amy",
  "emma", "libby", "heidi", "satu", "hedda", "tessa", "fiona", "kate",
  "gisele", "laia", "mireia", "mari", "lucia", "carmen", "sara", "laura",
  "marta", "nina", "ewa", "zofia", "nanami", "ayumi", "clara", "silvia",
];

const MALE_TERMS = [
  "male", "masculin", "varón", "hombre", "masculino",
  "david", "guy", "brian", "christopher", "raul", "pablo", "alvaro",
  "diego", "antonio", "daniel", "fabio", "henri", "paul", "stefan",
  "conrad", "holger", "james", "george", "alex", "jorge", "miguel",
  "liam", "noah", "juan", "pedro", "carlos", "luis", "javier", "sergio",
];

export function pickVoice(
  locale: string,
  voice: "female" | "male" = "female",
  voices: SpeechSynthesisVoice[] = []
): SpeechSynthesisVoice | null {
  const source =
    voices.length > 0
      ? voices
      : typeof window !== "undefined" && "speechSynthesis" in window
        ? window.speechSynthesis.getVoices()
        : [];
  if (source.length === 0) return null;
  const localePrefix = locale.split("-")[0].toLowerCase();
  const genderTerms = voice === "female" ? FEMALE_TERMS : MALE_TERMS;
  const matching = source.filter(
    (v) => (v.lang || "").split("-")[0].toLowerCase() === localePrefix
  );
  if (matching.length === 0) return null;
  return (
    matching.find((v) => genderTerms.some((g) => v.name.toLowerCase().includes(g))) ??
    matching[0]
  );
}
