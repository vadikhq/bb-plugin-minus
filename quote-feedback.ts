import { createQuoteSelectionClient } from "./favorites-client.ts";
import { parseFavorite, type FavoriteSnapshot } from "./favorites-model.ts";
import { object, schema, type Citation } from "./dictionary-model.ts";
import { pickDictionaryQuote } from "./dictionary-builtins.ts";

export const feedbackKinds = ["hidden", "flagged"] as const;
export const feedbackTag = "quote-feedback";
export type FeedbackKind = typeof feedbackKinds[number];
export type FeedbackInput = { snapshot: FavoriteSnapshot; kind: FeedbackKind };
export type FeedbackItem = FeedbackInput & { key: string };
export type QuoteFeedback = { revision: number; items: FeedbackItem[] };

export function parseFeedback(value: unknown): FeedbackInput {
  const { snapshot, kind } = object(value);
  if (kind !== "hidden" && kind !== "flagged") throw new Error("Unknown quote action.");
  return { snapshot: parseFavorite(snapshot), kind };
}

// Hiding survives a text correction under the same ID. The saved snapshot
// preserves the exact text the reader saw when deciding to mark it.
export const feedbackKey = ({ snapshot, kind }: FeedbackInput) =>
  JSON.stringify([snapshot.dictionaryId, snapshot.citation.id, kind]);

export const feedbackContract = {
  feedbackList: { input: schema(() => null), output: schema(value => value as QuoteFeedback), tags: () => [feedbackTag] },
  feedbackSet: {
    input: schema(value => {
      const input = object(value);
      if (typeof input.selected !== "boolean") throw new Error("The quote action state must be a boolean.");
      return { input: parseFeedback(input.input), selected: input.selected };
    }),
    output: schema(value => value as { changed: boolean }),
  },
} as const;

export const createFeedbackClient = (
  read: () => Promise<QuoteFeedback>, write: (input: FeedbackInput, selected: boolean) => Promise<unknown>,
) => createQuoteSelectionClient(read, write, feedbackKey);
export type FeedbackClient = ReturnType<typeof createFeedbackClient>;

export function createRotationPicker(
  dictionaryId: string, quotes: readonly Citation[], feedback: () => QuoteFeedback | undefined, random = Math.random,
) {
  let revision: number | undefined;
  let available: readonly Citation[] = [];
  return () => {
    const data = feedback();
    if (!data) return null;
    if (data.revision !== revision) {
      const excluded = new Set(data.items.filter(item => item.snapshot.dictionaryId === dictionaryId).map(item => item.snapshot.citation.id));
      available = excluded.size === 0 ? quotes : quotes.filter(quote => !excluded.has(quote.id));
      revision = data.revision;
    }
    return available.length ? pickDictionaryQuote(available, random) : null;
  };
}
