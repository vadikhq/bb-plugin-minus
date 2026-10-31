import { createHash } from "node:crypto";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { BUILTIN_DICTIONARIES } from "./dictionary-builtins.ts";
import { parseDictionary, type DictionarySnapshot, type DictionarySummary, type QuoteDictionary } from "./dictionary-model.ts";

type Database = ReturnType<BbPluginApi["storage"]["database"]>;
type Saved = { payload: string; revision: string };
export const DICTIONARY_MIGRATIONS = [
  "CREATE TABLE quote_dictionaries (id TEXT PRIMARY KEY, payload TEXT NOT NULL, revision TEXT NOT NULL)",
];
export function createDictionaryStore(db: Database) {
  const saved = (id: string) => db.prepare("SELECT payload, revision FROM quote_dictionaries WHERE id = ?").get(id) as Saved | undefined;
  const get = (id: string): DictionarySnapshot => {
    const builtin = BUILTIN_DICTIONARIES.find(d => d.id === id);
    if (builtin) return builtin;
    const row = saved(id);
    if (!row) throw new Error("Словарь не найден. Выберите доступный словарь в настройках Minus.");
    return { ...parseDictionary(JSON.parse(row.payload)), revision: row.revision };
  };
  const summary = (d: DictionarySnapshot, builtin: boolean): DictionarySummary => ({
    id: d.id, title: d.title, count: d.quotes.length, revision: d.revision, builtin,
  });
  const list = () => [
    ...BUILTIN_DICTIONARIES.map(d => summary(d, true)),
    ...(db.prepare("SELECT payload, revision FROM quote_dictionaries ORDER BY id").all() as Saved[])
      .map(row => summary({ ...parseDictionary(JSON.parse(row.payload)), revision: row.revision }, false)),
  ];
  const importDictionary = (value: unknown, expectedRevision?: string): DictionarySummary => {
    const dictionary: QuoteDictionary = parseDictionary(value);
    if (BUILTIN_DICTIONARIES.some(d => d.id === dictionary.id)) throw new Error("Встроенный словарь нельзя заменить. Используйте новый ID.");
    const payload = JSON.stringify(dictionary), revision = createHash("sha256").update(payload).digest("hex");
    return db.transaction(() => {
      const previous = saved(dictionary.id);
      if (previous?.revision === revision) return summary({ ...dictionary, revision }, false);
      if (previous && previous.revision !== expectedRevision) throw new Error("Словарь уже существует или изменился. Для замены передайте его текущую редакцию.");
      if (!previous && expectedRevision !== undefined) throw new Error("Предыдущая редакция не найдена; обновление не выполнено.");
      db.prepare("INSERT INTO quote_dictionaries (id, payload, revision) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, revision=excluded.revision")
        .run(dictionary.id, payload, revision);
      return summary({ ...dictionary, revision }, false);
    })();
  };
  return { get, list, importDictionary };
}
