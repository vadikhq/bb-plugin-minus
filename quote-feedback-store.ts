import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { feedbackKey, parseFeedback, type QuoteFeedback } from "./quote-feedback.ts";

type Database = ReturnType<BbPluginApi["storage"]["database"]>;
export const FEEDBACK_MIGRATIONS = [
  `CREATE TABLE quote_feedback (key TEXT PRIMARY KEY, input TEXT NOT NULL, selected_at INTEGER NOT NULL);
   CREATE TABLE quote_feedback_state (id INTEGER PRIMARY KEY CHECK(id = 1), revision INTEGER NOT NULL);
   INSERT INTO quote_feedback_state VALUES (1, 0);`,
];

export function createFeedbackStore(db: Database) {
  const list = db.transaction((): QuoteFeedback => ({
    revision: (db.prepare("SELECT revision FROM quote_feedback_state WHERE id = 1").get() as { revision: number }).revision,
    items: (db.prepare("SELECT key, input FROM quote_feedback ORDER BY selected_at DESC, key").all() as { key: string; input: string }[])
      .map(({ key, input }) => ({ ...parseFeedback(JSON.parse(input)), key })),
  }));
  const set = db.transaction((value: unknown, selected: boolean) => {
    const input = parseFeedback(value), key = feedbackKey(input);
    const result = selected
      ? db.prepare("INSERT INTO quote_feedback VALUES (?, ?, ?) ON CONFLICT(key) DO NOTHING").run(key, JSON.stringify(input), Date.now())
      : db.prepare("DELETE FROM quote_feedback WHERE key = ?").run(key);
    if (result.changes) db.prepare("UPDATE quote_feedback_state SET revision = revision + 1 WHERE id = 1").run();
    return { changed: result.changes > 0 };
  });
  return { list, set };
}
