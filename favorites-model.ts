import { dictionaryId, object, requiredText, schema, type Citation } from "./dictionary-model.ts";

export type FavoriteSnapshot = { dictionaryId: string; dictionaryTitle: string; citation: Citation };
export type Favorite = FavoriteSnapshot & { key: string; likedAt: number };
export type Favorites = { revision: number; items: Favorite[] };

export function parseFavorite(value: unknown): FavoriteSnapshot {
  const input = object(value), q = object(input.citation);
  if (typeof q.section !== "string") throw new Error("The quote section must be text.");
  const citation: Citation = {
    id: requiredText(q.id, "quote id"), text: requiredText(q.text, "quote"),
    author: requiredText(q.author, "author"), section: q.section,
    sourceTitle: requiredText(q.sourceTitle, "source"), locator: requiredText(q.locator, "locator"),
  };
  if (q.sourceUrl !== undefined) {
    const url = new URL(requiredText(q.sourceUrl, "source URL"));
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Use an HTTP(S) source URL without credentials.");
    citation.sourceUrl = url.href;
  }
  return { dictionaryId: dictionaryId(input.dictionaryId), dictionaryTitle: requiredText(input.dictionaryTitle, "dictionary title"), citation };
}

// Exact content identity, shared by browser and server. A title-only dictionary
// rename keeps the like; reusing an ID for different quote content does not.
export function favoriteKey(snapshot: FavoriteSnapshot): string {
  const q = snapshot.citation;
  return JSON.stringify([snapshot.dictionaryId, q.id, q.text, q.author, q.section, q.sourceTitle, q.locator, q.sourceUrl ?? ""]);
}

export const favoritesContract = {
  favoritesList: { input: schema(() => null), output: schema(value => value as Favorites) },
  favoriteSet: {
    input: schema(value => {
      const input = object(value);
      if (typeof input.liked !== "boolean") throw new Error("The like state must be a boolean.");
      return { snapshot: parseFavorite(input.snapshot), liked: input.liked };
    }),
    output: schema(value => value as { key: string; liked: boolean }),
  },
} as const;
