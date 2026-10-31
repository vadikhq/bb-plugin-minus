import { schema, object, dictionaryId, parseDictionary, type DictionarySnapshot, type DictionarySummary, type QuoteDictionary } from "./dictionary-model.ts";

const idInput = schema(value => ({ id: dictionaryId(object(value).id) }));
export const dictionaryContract = {
  dictionaryList: {
    input: schema(() => null),
    output: schema(value => value as { activeId: string; dictionaries: DictionarySummary[] }),
  },
  dictionaryActive: { input: schema(() => null), output: schema(value => value as DictionarySnapshot) },
  dictionaryActivate: { input: idInput, output: schema(value => value as { activeId: string }) },
  dictionaryImport: {
    input: schema<{ dictionary: QuoteDictionary; expectedRevision?: string }>(value => {
      const input = object(value);
      if (input.expectedRevision !== undefined && typeof input.expectedRevision !== "string") throw new Error("Неверная редакция словаря.");
      return { dictionary: parseDictionary(input.dictionary), expectedRevision: input.expectedRevision as string | undefined };
    }),
    output: schema(value => value as DictionarySummary),
  },
} as const;
