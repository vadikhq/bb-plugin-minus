import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import Database from "better-sqlite3";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import plugin from "./server.ts";
import { DALIO_QUOTES } from "./dalio-quotes.ts";
import { parseDictionary } from "./dictionary-model.ts";
import { createDictionaryStore, DICTIONARY_MIGRATIONS } from "./dictionary-store.ts";

const entry = { id: "one", text: "Проверяемая мысль.", author: "Автор", section: "Раздел", sourceTitle: "Источник", locator: "Строка 1" };
const fixture = () => ({ id: "test-dictionary", title: "Проверочный словарь", quotes: [{ ...entry }] });
const hash = value => createHash("sha256").update(value).digest("hex");

test("original dictionary bytes and accepted Dalio text/order remain intact", () => {
  assert.equal(hash(readFileSync(new URL("./quotes.ts", import.meta.url))), "f0602bcffd488c315c68af1a0ab4adce84dccd4cfa35bbfae68f67744bd8806a");
  assert.equal(DALIO_QUOTES.length, 452);
  // SHA-256 of [id, text, author, chapter] from the owner's accepted 452-record
  // JSON, serialized without whitespace. It binds this adapter to that edition.
  const projection = DALIO_QUOTES.map(q => [q.id, q.text, q.author, q.section]);
  assert.equal(hash(JSON.stringify(projection)), "d3c77be67dcf8da9f3d0e0da6255da10a40e9fb9947400450217b32a9e346f4b");
});

test("invalid or duplicate imports leave storage unchanged; conflicting replacements are explicit", () => {
  const db = new Database(":memory:");
  try {
    for (const sql of DICTIONARY_MIGRATIONS) db.exec(sql);
    const store = createDictionaryStore(db);
    const first = store.importDictionary(fixture());
    assert.deepEqual(store.importDictionary(fixture()), first);
    assert.equal(store.list().length, 3);
    for (const invalid of [null, { ...fixture(), quotes: [] }, { ...fixture(), quotes: [entry, { ...entry, id: "two", text: "Проверяемая  мысль." }] },
      { ...fixture(), quotes: [{ ...entry, author: "" }] }, { ...fixture(), quotes: [{ ...entry, sourceUrl: "javascript:alert(1)" }] }]) {
      assert.throws(() => store.importDictionary(invalid));
      assert.equal(store.get(first.id).revision, first.revision);
    }
    assert.throws(() => store.importDictionary({ ...fixture(), id: "dalio" }));
    const next = { ...fixture(), title: "Обновлённое название" };
    assert.throws(() => store.importDictionary(next));
    assert.throws(() => store.importDictionary(next, "stale"));
    const updated = store.importDictionary(next, first.revision);
    assert.notEqual(updated.revision, first.revision);
    assert.equal(store.get(first.id).title, next.title);
  } finally { db.close(); }
});

test("imports larger than one KV value persist atomically in the database", () => {
  const db = new Database(":memory:");
  try {
    for (const sql of DICTIONARY_MIGRATIONS) db.exec(sql);
    const store = createDictionaryStore(db), data = fixture();
    // SDK KV has a documented 256 KiB/value cap. A dataset above that cap
    // verifies why quote datasets use plugin SQL storage rather than one KV row.
    data.quotes[0].locator = "я".repeat(256 * 1024);
    assert(Buffer.byteLength(JSON.stringify(data)) > 256 * 1024);
    const result = store.importDictionary(data);
    assert.equal(store.get(result.id).quotes[0].locator, data.quotes[0].locator);
    assert.deepEqual(store.importDictionary(data), result);
  } finally { db.close(); }
});

test("agent import preserves active selection; explicit activation and reload preserve dictionaries", async () => {
  const { bb, harness } = createFakePluginHost({ pluginId: "minus", settings: { collapseToolCalls: true, hideThinking: true } });
  let current = { bb, harness };
  try {
    await plugin(bb);
    const rpc = (method, input = null) => current.harness.behavior.callRpc(method, input);
    assert.equal((await rpc("dictionaryList")).activeId, "dalio");
    assert.equal((await rpc("dictionaryActive")).quotes.length, 452);
    const imported = JSON.parse(await harness.behavior.callAgentTool("minus_dictionaries", { action: "import", dictionary: fixture() }));
    assert.equal(imported.id, "test-dictionary");
    assert.equal((await rpc("dictionaryList")).activeId, "dalio");
    await assert.rejects(rpc("dictionaryActivate", { id: "missing" }));
    assert.equal((await rpc("dictionaryList")).activeId, "dalio");
    await rpc("dictionaryActivate", { id: imported.id });
    assert.equal((await rpc("dictionaryActive")).quotes[0].text, entry.text);
    current = await harness.lifecycle.reload(plugin);
    const after = await rpc("dictionaryList");
    assert.equal(after.activeId, imported.id);
    assert.equal(after.dictionaries.find(d => d.id === imported.id).revision, imported.revision);
    await rpc("dictionaryActivate", { id: "original" });
    assert.equal((await rpc("dictionaryActive")).quotes.length, 73);
    await assert.rejects(rpc("dictionaryImport", { dictionary: { ...fixture(), quotes: [] } }));
    assert.equal((await rpc("dictionaryList")).dictionaries.length, 3);
  } finally { await current.harness.lifecycle.dispose(); }
});

test("import parser keeps text intact and rejects unsafe references", () => {
  const value = fixture();value.quotes[0].text = "  Авторский текст — без переписывания.  ";
  assert.equal(parseDictionary(value).quotes[0].text, value.quotes[0].text);
  assert.throws(() => parseDictionary({ ...fixture(), id: "../another-plugin" }));
  assert.throws(() => parseDictionary({ ...fixture(), quotes: [{ ...entry, sourceUrl: "https://user:secret@example.com/" }] }));
});
