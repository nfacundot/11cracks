export function normalizeSpoken(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const prev = Array.from({ length: n + 1 }, (_, j) => j);
  const curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

export function similarityRatio(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const d = editDistance(a, b);
  const maxLen = Math.max(a.length, b.length, 1);
  return 1 - d / maxLen;
}

export function gradePronunciation(target: string, spoken: string, confidence: number): { correct: boolean; ratio: number } {
  const t = normalizeSpoken(target);
  const s = normalizeSpoken(spoken);
  const ratio = similarityRatio(t, s);
  const exact = ratio >= 0.85;
  const close = confidence > 0.6 && ratio >= 0.55;
  // El usuario puede decir la palabra dentro de una frase (Whisper/Web Speech
  // a veces devuelven contexto extra): si la palabra objetivo aparece, cuenta.
  const words = s.split(" ").filter(Boolean);
  const containsTarget = t.length > 0 && (t.includes(" ") ? s.includes(t) : words.includes(t));
  const correct = exact || close || containsTarget;
  return { correct, ratio };
}