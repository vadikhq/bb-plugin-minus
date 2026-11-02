import { favoriteKey, type Favorites, type FavoriteSnapshot } from "./favorites-model.ts";

export type FavoriteState = { data?: Favorites; pending: ReadonlySet<string>; errors: ReadonlyMap<string, { desired: boolean; message: string }> };
export function createFavoritesClient(read: () => Promise<Favorites>, write: (snapshot: FavoriteSnapshot, liked: boolean) => Promise<unknown>) {
  let state: FavoriteState = { pending: new Set(), errors: new Map() };
  let keys = new Set<string>();
  const listeners = new Set<() => void>();
  const publish = (next: FavoriteState) => { state = next; for (const listener of listeners) listener(); };
  const accept = (data: Favorites) => {
    if (!state.data || data.revision >= state.data.revision) {
      keys = new Set(data.items.map(item => item.key));
      const errors = new Map(state.errors);
      for (const [key, error] of errors) if (keys.has(key) === error.desired) errors.delete(key);
      publish({ ...state, data, errors });
    }
  };
  const has = (snapshot: FavoriteSnapshot) => keys.has(favoriteKey(snapshot));
  const set = async (snapshot: FavoriteSnapshot, desired: boolean) => {
    const key = favoriteKey(snapshot);
    if (state.pending.has(key) || !state.data) return;
    const pending = new Set(state.pending); pending.add(key);
    const errors = new Map(state.errors); errors.delete(key);
    publish({ ...state, pending, errors });
    try {
      await write(snapshot, desired);
      const data = await read();
      // A successful request alone is not a confirmed like. Read back the
      // current list; explicit set is safe to retry after a lost response.
      accept(data);
      if (has(snapshot) !== desired) throw new Error("The saved state changed. Try again.");
    } catch (error) {
      const errors = new Map(state.errors);
      if (has(snapshot) !== desired) errors.set(key, { desired, message: error instanceof Error ? error.message : String(error) });
      publish({ ...state, errors });
    } finally {
      const pending = new Set(state.pending); pending.delete(key); publish({ ...state, pending });
    }
  };
  return {
    getSnapshot: () => state, accept, has, set,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    toggle(snapshot: FavoriteSnapshot) {
      const previous = state.errors.get(favoriteKey(snapshot));
      return set(snapshot, previous?.desired ?? !has(snapshot));
    },
  };
}
export type FavoritesClient = ReturnType<typeof createFavoritesClient>;
