import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { AREAS } from "./rules.ts";
import { dictionaryContract } from "./dictionary-contract.ts";
import { createDictionaryStore, DICTIONARY_MIGRATIONS } from "./dictionary-store.ts";
import { DEFAULT_DICTIONARY_ID } from "./dictionary-builtins.ts";
import { dictionaryId, object, parseDictionary } from "./dictionary-model.ts";

// Descriptors keep `bb plugin config minus` working; the settings page shows the grouped section from app.tsx.
export default async function plugin(bb: BbPluginApi) {
  const settings = bb.settings.define({
    ...Object.fromEntries(
      AREAS.flatMap((area) =>
        area.rules.map((rule) => [rule.key, { type: "boolean", label: `${area.title}: ${rule.label}`, default: false }]),
      ),
    ) as Record<string, { type: "boolean"; label: string; default: boolean }>,
    quoteDictionary: { type: "string", label: "Словарь цитат", default: DEFAULT_DICTIONARY_ID },
  });
  const db = bb.storage.database();
  bb.storage.migrate(db, DICTIONARY_MIGRATIONS);
  const store = createDictionaryStore(db);
  const activeId = async () => (await settings.get()).quoteDictionary as string;
  const activate = async (id: string) => {
    store.get(id);
    await settings.experimental_set({ quoteDictionary: id });
    return { activeId: id };
  };
  const importDictionary = (dictionary: unknown, revision?: string) => {
    const result = store.importDictionary(dictionary, revision);
    bb.rpc.experimental_invalidateAll();
    return result;
  };
  settings.onChange((next, previous) => {
    if (next.quoteDictionary !== previous.quoteDictionary) bb.rpc.experimental_invalidateAll();
  });
  bb.rpc.register(dictionaryContract, {
    dictionaryList: async () => ({ activeId: await activeId(), dictionaries: store.list() }),
    dictionaryActive: async () => store.get(await activeId()),
    dictionaryActivate: ({ id }) => activate(id),
    dictionaryImport: ({ dictionary, expectedRevision }) => importDictionary(dictionary, expectedRevision),
  });

  bb.agents.registerTool({
    name: "minus_dictionaries",
    description: "Словари цитат Minus. list возвращает названия, количество и редакции. import добавляет проверенный набор отдельно, не меняя активный; повтор одинаковых данных безопасен. Для замены нужен expectedRevision. activate — только по явному выбору владельца. Встроенные словари не заменяются. Импорт не проверяет достоверность автора/перевода: это делает агент по первоисточнику до вызова.",
    parameters: {
      type: "object", additionalProperties: false, required: ["action"], properties: {
        action: { type: "string", enum: ["list", "import", "activate"] },
        id: { type: "string", description: "ID словаря для activate." },
        expectedRevision: { type: "string", description: "Текущая редакция из list; обязательна для замены отличающихся данных." },
        dictionary: { type: "object", additionalProperties: false, required: ["id", "title", "quotes"], properties: {
          id: { type: "string" }, title: { type: "string" },
          quotes: { type: "array", items: { type: "object", additionalProperties: false,
            required: ["id", "text", "author", "section", "sourceTitle", "locator"], properties: {
              id: { type: "string" }, text: { type: "string" }, author: { type: "string" },
              section: { type: "string" }, sourceTitle: { type: "string" }, locator: { type: "string" }, sourceUrl: { type: "string" },
            } } },
        } },
      },
    },
    async execute(value) {
      const input = object(value);
      if (input.action === "list") return JSON.stringify({ activeId: await activeId(), dictionaries: store.list() });
      if (input.action === "activate") return JSON.stringify(await activate(dictionaryId(input.id)));
      if (input.action === "import") {
        if (input.expectedRevision !== undefined && typeof input.expectedRevision !== "string") throw new Error("Неверная редакция словаря.");
        return JSON.stringify(importDictionary(parseDictionary(input.dictionary), input.expectedRevision as string | undefined));
      }
      throw new Error("Неизвестное действие со словарём.");
    },
  });
}
