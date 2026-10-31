import { DALIO_QUOTES } from "./dalio-quotes.ts";
import { QUOTES, QUOTE_SOURCES, type QuoteEntry } from "./quotes.ts";
import type { Citation, DictionarySnapshot } from "./dictionary-model.ts";

export const DEFAULT_DICTIONARY_ID = "dalio";
export const BUILTIN_DICTIONARIES: readonly DictionarySnapshot[] = [
  { id: "original", title: "Философская подборка", revision: "f0602bcffd488c315c68af1a0ab4adce84dccd4cfa35bbfae68f67744bd8806a",
    quotes: QUOTES.map(q => ({ id: q.id, text: q.text, author: QUOTE_SOURCES[q.source].byline,
      section: "", sourceTitle: QUOTE_SOURCES[q.source].title, locator: q.locator, sourceUrl: QUOTE_SOURCES[q.source].url })) },
  { id: "dalio", title: "Рэй Далио — Принципы", revision: "dalio-ru-accepted-2026-10-31", quotes: [...DALIO_QUOTES] },
];
export type GroupQuote = Citation | QuoteEntry;
export function pickDictionaryQuote(quotes: readonly Citation[], random = Math.random): Citation {
  if (quotes.length === 0) throw new Error("Выбранный словарь пуст.");
  return quotes[Math.floor(random() * quotes.length)]!;
}
export function defaultQuote(): Citation {
  return pickDictionaryQuote(BUILTIN_DICTIONARIES.find(d => d.id === DEFAULT_DICTIONARY_ID)!.quotes);
}
export function quoteAttribution(quote: GroupQuote): { byline: string; detail: string } {
  if ("source" in quote) {
    const source = QUOTE_SOURCES[quote.source];
    const locator = quote.locator.replace(/^Project Gutenberg plain-text line (\d+)$/, "Строка $1 в тексте Project Gutenberg");
    return { byline: source.byline, detail: `${source.credit}. «${source.title}». ${locator}. Русский перевод Minus.` };
  }
  return {
    byline: quote.author + (quote.section ? " → " + quote.section : ""),
    detail: `${quote.author}. «${quote.sourceTitle}». ${quote.locator}`,
  };
}
