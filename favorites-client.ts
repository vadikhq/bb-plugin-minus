import { favoriteKey, type Favorite, type FavoriteSnapshot } from "./favorites-model.ts";

type Selection<Item> = { revision: number; items: Item[] };
type SelectionState<Item> = { data?: Selection<Item>; pending: ReadonlySet<string>; errors: ReadonlyMap<string, { desired: boolean; message: string }> };
export function createQuoteSelectionClient<Input, Item extends { key: string }>(
  read: () => Promise<Selection<Item>>, write: (input: Input, desired: boolean) => Promise<unknown>, keyFor: (input: Input) => string,
) {
  let state: SelectionState<Item> = { pending: new Set(), errors: new Map() };
  let keys = new Set<string>();
  const listeners = new Set<() => void>();
  const publish = (next: SelectionState<Item>) => { state = next; for (const listener of listeners) listener(); };
  const accept = (data: Selection<Item>) => {
    if (!state.data || data.revision >= state.data.revision) {
      keys = new Set(data.items.map(item => item.key));
      const errors = new Map(state.errors);
      for (const [key, error] of errors) if (keys.has(key) === error.desired) errors.delete(key);
      publish({ ...state, data, errors });
    }
  };
  const has = (input: Input) => keys.has(keyFor(input));
  const set = async (input: Input, desired: boolean) => {
    const key = keyFor(input);
    if (state.pending.has(key) || !state.data) return;
    const pending = new Set(state.pending); pending.add(key);
    const errors = new Map(state.errors); errors.delete(key);
    publish({ ...state, pending, errors });
    try {
      await write(input, desired);
      const data = await read();
      // A successful request alone is not a confirmed like. Read back the
      // current list; explicit set is safe to retry after a lost response.
      accept(data);
      if (has(input) !== desired) throw new Error("The saved state changed. Try again.");
    } catch (error) {
      const errors = new Map(state.errors);
      if (has(input) !== desired) errors.set(key, { desired, message: error instanceof Error ? error.message : String(error) });
      publish({ ...state, errors });
    } finally {
      const pending = new Set(state.pending); pending.delete(key); publish({ ...state, pending });
    }
  };
  return {
    getSnapshot: () => state, accept, has, set,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    toggle(input: Input) {
      const previous = state.errors.get(keyFor(input));
      return set(input, previous?.desired ?? !has(input));
    },
  };
}
export function createFavoritesClient(
  read: () => Promise<Selection<Favorite>>, write: (snapshot: FavoriteSnapshot, liked: boolean) => Promise<unknown>,
) {
  return createQuoteSelectionClient(read, write, favoriteKey);
}
export type FavoritesClient = ReturnType<typeof createFavoritesClient>;
