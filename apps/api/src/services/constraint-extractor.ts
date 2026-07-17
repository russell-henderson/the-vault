export type ConstraintPlatform = "mobile" | "desktop" | "web";

export type ConstraintExtraction = {
  platforms: ConstraintPlatform[];
  languages: string[];
  frameworks: string[];
  stackMentions: string[];
  prohibitions: string[];
  unrecognizedMentions: string[];
  tokens: string[];
};

type VocabularyEntry = {
  id: string;
  phrases: string[];
  category: "platform" | "language" | "framework";
};

const vocabulary: VocabularyEntry[] = [
  { id: "mobile", phrases: ["mobile", "mobile app", "ios", "iphone", "ipad", "android", "smartphone", "tablet"], category: "platform" },
  { id: "desktop", phrases: ["desktop", "desktop app", "windows", "macos", "mac app", "native app", "windowed"], category: "platform" },
  { id: "web", phrases: ["web", "web app", "website", "browser", "web dashboard"], category: "platform" },
  { id: "swift", phrases: ["swift"], category: "language" },
  { id: "python", phrases: ["python"], category: "language" },
  { id: "typescript", phrases: ["typescript", "type script"], category: "language" },
  { id: "javascript", phrases: ["javascript", "java script"], category: "language" },
  { id: "spritekit", phrases: ["spritekit"], category: "framework" },
  { id: "swiftui", phrases: ["swiftui", "swift ui"], category: "framework" },
  { id: "flet", phrases: ["flet"], category: "framework" },
  { id: "react", phrases: ["react"], category: "framework" },
  { id: "react-native", phrases: ["react native"], category: "framework" },
  { id: "tailwind", phrases: ["tailwind"], category: "framework" }
];

const ignoredTechnologyWords = new Set([
  "a", "an", "and", "app", "application", "accessible", "ai", "analytics", "api", "avoid", "browser", "build", "can", "cannot", "collision", "controller", "create", "custom", "dashboard", "data", "desktop", "do", "does", "exclude", "excluding", "feature", "for", "form", "forms", "game", "handling", "in", "input", "ios", "keyboard", "local", "loop", "mobile", "must", "navigation", "native", "never", "no", "not", "of", "or", "panel", "persistence", "physics", "project", "responsive", "scene", "settings", "sprite", "state", "the", "to", "ui", "use", "using", "web", "window", "windowed", "with", "without", "write"
].map((word) => word.trim()));
const explicitTechnologyHints = new Set(["angular", "compose", "csharp", "dart", "dotnet", "electron", "flutter", "java", "kotlin", "next", "nextjs", "nuxt", "qt", "rust", "svelte", "vue"]);

const negationPhrases = [
  ["no"],
  ["not"],
  ["without"],
  ["avoid"],
  ["exclude"],
  ["excluding"],
  ["never"],
  ["cannot"],
  ["can't"],
  ["must", "not"],
  ["do", "not"],
  ["does", "not"]
];

function tokenize(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/\+/g, " ")
    .replace(/[^a-z0-9#]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function matchingStarts(tokens: string[], phrase: string): number[] {
  const phraseTokens = tokenize(phrase);
  const starts: number[] = [];
  if (phraseTokens.length === 0 || phraseTokens.length > tokens.length) return starts;

  for (let index = 0; index <= tokens.length - phraseTokens.length; index += 1) {
    if (phraseTokens.every((token, offset) => tokens[index + offset] === token)) starts.push(index);
  }
  return starts;
}

function hasNegationBefore(tokens: string[], start: number): boolean {
  const windowStart = Math.max(0, start - 4);
  const preceding = tokens.slice(windowStart, start);

  return negationPhrases.some((phrase) => {
    if (phrase.length > preceding.length) return false;
    const phraseStart = preceding.length - phrase.length;
    return phrase.every((token, offset) => preceding[phraseStart + offset] === token);
  }) || preceding.some((token) => ["no", "not", "without", "avoid", "exclude", "excluding", "never", "cannot", "can't"].includes(token));
}

function orderedUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)];
}

function rawTokens(value: string): Array<{ raw: string; normalized: string }> {
  return value.match(/[A-Za-z][A-Za-z0-9]*/g)?.map((raw) => ({ raw, normalized: raw.toLocaleLowerCase().normalize("NFKC") })) ?? [];
}

function recognizedVocabularyTokens(): Set<string> {
  return new Set(vocabulary.flatMap((entry) => entry.phrases.flatMap((phrase) => tokenize(phrase))));
}

function extractUnrecognizedMentions(brief: string): string[] {
  const known = recognizedVocabularyTokens();
  const tokens = rawTokens(brief);
  const mentions: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (known.has(token.normalized) || ignoredTechnologyWords.has(token.normalized)) continue;
    const previous = tokens[index - 1]?.normalized;
    const next = tokens[index + 1]?.normalized;
    const explicitHint = explicitTechnologyHints.has(token.normalized);
    const adjacentToKnownStack = Boolean(previous && known.has(previous)) || Boolean(next && known.has(next));
    const frameworkCue = ["framework", "frameworks", "stack", "technology", "technologies", "using", "with"].includes(previous ?? "");
    const capitalizedTechnology = /^[A-Z]/.test(token.raw) && (adjacentToKnownStack || frameworkCue);
    if ((capitalizedTechnology || explicitHint || adjacentToKnownStack) && !mentions.includes(token.normalized)) mentions.push(token.normalized);
  }
  return mentions;
}

/**
 * Extracts explicit architectural constraints without treating substrings as
 * evidence. For example, `Swift` matches the language token `swift`, but it
 * does not match the framework token `swiftui`.
 */
export function extractConstraints(brief: string): ConstraintExtraction {
  const tokens = tokenize(brief);
  const positive = new Set<string>();
  const prohibited = new Set<string>();
  const unrecognizedMentions = extractUnrecognizedMentions(brief);

  for (const entry of vocabulary) {
    for (const phrase of entry.phrases) {
      for (const start of matchingStarts(tokens, phrase)) {
        const target = hasNegationBefore(tokens, start) ? prohibited : positive;
        target.add(entry.id);
      }
    }
  }

  return {
    platforms: orderedUnique([...positive].filter((id): id is ConstraintPlatform => ["mobile", "desktop", "web"].includes(id))),
    languages: orderedUnique([...positive].filter((id) => ["swift", "python", "typescript", "javascript"].includes(id))),
    frameworks: orderedUnique([...positive].filter((id) => ["spritekit", "swiftui", "flet", "react", "react-native", "tailwind"].includes(id))),
    stackMentions: orderedUnique([...positive, ...prohibited, ...unrecognizedMentions]),
    prohibitions: orderedUnique([...prohibited]),
    unrecognizedMentions,
    tokens
  };
}
