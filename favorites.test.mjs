import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import plugin from "./server.ts";
import { favoriteKey, parseFavorite } from "./favorites-model.ts";
import { createFavoritesStore, FAVORITES_MIGRATIONS } from "./favorites-store.ts";
import { createFavoritesClient } from "./favorites-client.ts";
import { BUILTIN_DICTIONARIES } from "./dictionary-builtins.ts";
import { quoteLanguage, quoteStrings, toolCount } from "./quote-i18n.ts";
import { DICTIONARY_MIGRATIONS } from "./dictionary-store.ts";

const snapshot = (index = 1) => {
  const dictionary = BUILTIN_DICTIONARIES[index];
  return { dictionaryId: dictionary.id, dictionaryTitle: dictionary.title, citation: { ...dictionary.quotes[0] } };
};

test("quote UI uses English fallback for unavailable language API even with retained Russian data", () => {
  assert.equal(quoteLanguage({ language: 'ru' }, false), 'ru');
  for (const selection of [undefined, { language: 'de' }, { language: 'en' }]) assert.equal(quoteLanguage(selection, false), 'en');
  assert.equal(quoteLanguage({ language: 'ru' }, true), 'en');
  assert.deepEqual(Object.keys(quoteStrings('en')), Object.keys(quoteStrings('ru')));
  assert.equal(toolCount(1, 'en'), '1 tool');assert.equal(toolCount(2, 'en'), '2 tools');assert.equal(toolCount(2, 'ru'), '2 инстр.');
});

test("likes persist across plugin reload without changing settings, active dictionary or custom imports", async () => {
  let current = createFakePluginHost({ pluginId: "minus", settings: { hideThinking: true, collapseToolCalls: true } });
  try {
    await plugin(current.bb);
    const rpc = (method, input = null) => current.harness.behavior.callRpc(method, input);
    const before = await rpc("dictionaryList");
    for (const item of [snapshot(0), snapshot(1)]) await rpc("favoriteSet", { snapshot: item, liked: true });
    assert.equal((await rpc("favoritesList")).items.length, 2);
    current = await current.harness.lifecycle.reload(plugin);
    const saved = await rpc("favoritesList");
    assert.equal(saved.items.length, 2);
    assert.deepEqual(new Set(saved.items.map(x => x.key)), new Set([favoriteKey(snapshot(0)), favoriteKey(snapshot(1))]));
    assert.deepEqual(await rpc("dictionaryList"), before);
    await rpc("dictionaryActivate", { id: "original" });
    assert.equal((await rpc("favoritesList")).items.length, 2, "active selection never filters favorites");
    await rpc("favoriteSet", { snapshot: snapshot(1), liked: false });
    assert.deepEqual((await rpc("favoritesList")).items.map(x => x.dictionaryId), ["original"]);
    current = await current.harness.lifecycle.reload(plugin);
    assert.equal((await rpc("favoritesList")).items.length, 1);
  } finally { await current.harness.lifecycle.dispose(); }
});

test("a code rollback using the older dictionary-only migration list preserves favorite data for re-upgrade", async () => {
  let current = createFakePluginHost({ pluginId: "minus", settings: { collapseToolCalls: true } });
  try {
    await plugin(current.bb);
    await current.harness.behavior.callRpc("favoriteSet", { snapshot: snapshot(), liked: true });
    const before = await current.harness.behavior.callRpc("favoritesList", null);
    // This is the exact migration invocation in main77de's server factory.
    current = await current.harness.lifecycle.reload(async bb => { bb.storage.migrate(bb.storage.database(), DICTIONARY_MIGRATIONS); });
    current = await current.harness.lifecycle.reload(plugin);
    assert.deepEqual(await current.harness.behavior.callRpc("favoritesList", null), before);
    assert.equal((await current.harness.behavior.callRpc("dictionaryList", null)).activeId, "dalio");
  } finally { await current.harness.lifecycle.dispose(); }
});

test("content snapshots survive replacement; a reused quote ID never inherits a like", () => {
  const db = new Database(":memory:");
  try {
    for (const sql of FAVORITES_MIGRATIONS) db.exec(sql);
    const store = createFavoritesStore(db), first = snapshot();
    const changed = { ...first, citation: { ...first.citation, text: "Different content under the same id" } };
    store.set(first, true); store.set(first, true);
    assert.equal(store.list().items.length, 1);assert.equal(store.list().revision, 1);
    assert.notEqual(favoriteKey(first), favoriteKey(changed));
    assert.equal(store.list().items[0].citation.text, first.citation.text);
    assert.equal(favoriteKey(first), favoriteKey({ ...first, dictionaryTitle: "Renamed dictionary" }));
    store.set(changed, false); assert.equal(store.list().revision, 1);
    store.set(changed, true); assert.equal(store.list().items.length, 2);
    store.set(first, false);store.set(first, false); assert.equal(store.list().revision, 3);
    assert.equal(store.list().items[0].citation.text, changed.citation.text);
  } finally { db.close(); }
});

test("favorite RPC validates booleans, snapshots and references before any write", async () => {
  const { bb, harness } = createFakePluginHost({ pluginId: "minus" });
  try {
    await plugin(bb);
    for (const invalid of [null, { snapshot: snapshot(), liked: "true" }, { snapshot: {}, liked: true },
      { snapshot: { ...snapshot(), dictionaryId: "../other" }, liked: true },
      { snapshot: { ...snapshot(), citation: { ...snapshot().citation, sourceUrl: "javascript:alert(1)" } }, liked: true }]) {
      await assert.rejects(harness.behavior.callRpc("favoriteSet", invalid));
      assert.deepEqual(await harness.behavior.callRpc("favoritesList", null), { revision: 0, items: [] });
    }
    assert.equal(parseFavorite(snapshot(0)).citation.section, "", "original collection has no section");
  } finally { await harness.lifecycle.dispose(); }
});

test("duplicate clicks share one write; only a read-back confirms the red heart", async () => {
  let data = { revision: 0, items: [] }, writes = 0, release;
  const item = snapshot();
  const client = createFavoritesClient(async () => data, async () => {
    writes++; await new Promise(resolve => { release = resolve; });
    data = { revision: 1, items: [{ ...item, key: favoriteKey(item), likedAt: 1 }] };
  });
  client.accept(data);
  const first = client.toggle(item); await client.toggle(item);
  assert.equal(writes, 1);assert.equal(client.has(item), false);assert(client.getSnapshot().pending.has(favoriteKey(item)));
  release();await first;
  assert(client.has(item));assert.equal(client.getSnapshot().pending.size, 0);
  client.accept({ revision: 0, items: [] });assert(client.has(item), "late older reads cannot undo a confirmed like");
});

test("lost write response retries the same desired value, never inverts the saved like", async () => {
  const item = snapshot();let data = { revision: 0, items: [] }, fail = true;const desired = [];
  const client = createFavoritesClient(async () => data, async (_snapshot, liked) => {
    desired.push(liked);data = { revision: 1, items: [{ ...item, key: favoriteKey(item), likedAt: 1 }] };
    if (fail) throw new Error("response lost after commit");
  });
  client.accept(data);await client.toggle(item);
  assert(!client.has(item));assert(client.getSnapshot().errors.has(favoriteKey(item)));
  fail = false;await client.toggle(item);
  assert.deepEqual(desired, [true, true]);assert(client.has(item));assert.equal(client.getSnapshot().errors.size, 0);
});

test("read-back failure preserves the confirmed state and offers an idempotent retry", async () => {
  const item = snapshot();let fail = true, readCount = 0;
  const data = { revision: 1, items: [{ ...item, key: favoriteKey(item), likedAt: 1 }] };
  const desired = [];
  const client = createFavoritesClient(async () => { readCount++;if (fail) throw Error("offline");return { revision: 2, items: [] }; }, async (_s, liked) => { desired.push(liked); });
  client.accept(data);await client.toggle(item);assert(client.has(item));assert.equal(client.getSnapshot().pending.size, 0);
  fail = false;await client.toggle(item);assert.deepEqual(desired, [false, false]);assert(!client.has(item));assert.equal(readCount, 2);
});

test("a reconnect confirmation resolves a lost response; the next heart click removes the confirmed like", async () => {
  const item = snapshot();let data = { revision: 0, items: [] }, fail = true;const desired = [];
  const client = createFavoritesClient(async () => data, async (_s, liked) => {
    desired.push(liked); data = { revision: data.revision + 1, items: liked ? [{ ...item, key: favoriteKey(item), likedAt: 1 }] : [] };
    if (fail) throw Error("response lost after commit");
  });
  client.accept(data);await client.toggle(item);assert(client.getSnapshot().errors.size === 1);
  client.accept(data);assert(client.has(item));assert.equal(client.getSnapshot().errors.size, 0);
  fail = false;await client.toggle(item);assert(!client.has(item));assert.deepEqual(desired, [true, false]);
});
