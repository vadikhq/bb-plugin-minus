import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { favoriteKey, parseFavorite, type Favorite, type Favorites } from "./favorites-model.ts";

type Database = ReturnType<BbPluginApi["storage"]["database"]>;
export const FAVORITES_MIGRATIONS = [
  `CREATE TABLE quote_favorites (key TEXT PRIMARY KEY, snapshot TEXT NOT NULL, liked_at INTEGER NOT NULL);
   CREATE TABLE quote_favorites_state (id INTEGER PRIMARY KEY CHECK(id = 1), revision INTEGER NOT NULL);
   INSERT INTO quote_favorites_state VALUES (1, 0);`,
];

export function createFavoritesStore(db: Database) {
  const list = db.transaction((): Favorites => ({
    revision: (db.prepare("SELECT revision FROM quote_favorites_state WHERE id = 1").get() as { revision: number }).revision,
    items: (db.prepare("SELECT key, snapshot, liked_at FROM quote_favorites ORDER BY liked_at DESC, key").all() as { key: string; snapshot: string; liked_at: number }[])
      .map(row => ({ ...parseFavorite(JSON.parse(row.snapshot)), key: row.key, likedAt: row.liked_at } satisfies Favorite)),
  }));
  const set = (value: unknown, liked: boolean) => {
    const snapshot = parseFavorite(value), key = favoriteKey(snapshot);
    return db.transaction(() => {
      const result = liked
        ? db.prepare("INSERT INTO quote_favorites (key, snapshot, liked_at) VALUES (?, ?, ?) ON CONFLICT(key) DO NOTHING").run(key, JSON.stringify(snapshot), Date.now())
        : db.prepare("DELETE FROM quote_favorites WHERE key = ?").run(key);
      if (result.changes) db.prepare("UPDATE quote_favorites_state SET revision = revision + 1 WHERE id = 1").run();
      return { key, liked };
    })();
  };
  return { list, set };
}
