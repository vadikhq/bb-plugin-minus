export type Citation = {
  id: string;
  text: string;
  author: string;
  section: string;
  sourceTitle: string;
  locator: string;
  sourceUrl?: string;
};
export type QuoteDictionary = {
  id: string;
  title: string;
  quotes: Citation[];
};
export type DictionarySummary = { id: string; title: string; count: number; revision: string; builtin: boolean };
export type DictionarySnapshot = QuoteDictionary & { revision: string };

export function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("Ожидается объект.");
  return value as Record<string, unknown>;
}
export function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`Заполните поле «${field}».`);
  return value;
}
export function dictionaryId(value: unknown): string {
  const id = requiredText(value, "id");
  // Stable URL/tool identifiers; no path, whitespace or prototype-key semantics.
  if (!/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(id)) throw new Error("ID: строчные латинские буквы, цифры, дефис, точка или подчёркивание.");
  return id;
}
export function parseDictionary(value: unknown): QuoteDictionary {
  const input = object(value);
  const id = dictionaryId(input.id);
  const title = requiredText(input.title, "название словаря");
  if (!Array.isArray(input.quotes) || input.quotes.length === 0) throw new Error("Словарь должен содержать цитаты.");
  const ids = new Set<string>(), texts = new Set<string>();
  const quotes = input.quotes.map((value): Citation => {
    const q = object(value);
    const entry: Citation = {
      id: requiredText(q.id, "id цитаты"), text: requiredText(q.text, "цитата"),
      author: requiredText(q.author, "автор"), section: requiredText(q.section, "раздел"),
      sourceTitle: requiredText(q.sourceTitle, "источник"), locator: requiredText(q.locator, "указатель источника"),
    };
    if (q.sourceUrl !== undefined) {
      const url = new URL(requiredText(q.sourceUrl, "ссылка"));
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Ссылка должна быть HTTP(S) без credentials.");
      entry.sourceUrl = url.href;
    }
    const normalized = entry.text.replace(/\s+/g, " ").trim().toLocaleLowerCase("ru");
    if (ids.has(entry.id) || texts.has(normalized)) throw new Error("В словаре есть повторяющиеся ID или цитаты.");
    ids.add(entry.id); texts.add(normalized);
    return entry;
  });
  return { id, title, quotes };
}

// Small Standard Schema adapter: one parser validates RPC and agent boundaries.
export function schema<T>(parse: (input: unknown) => T) {
  return { "~standard": { version: 1 as const, vendor: "minus", types: undefined as { input: T; output: T } | undefined, validate(input: unknown) {
    try { return { value: parse(input) }; }
    catch (error) { return { issues: [{ message: error instanceof Error ? error.message : String(error) }] }; }
  } } };
}
