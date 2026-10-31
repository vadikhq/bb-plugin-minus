import { useEffect, useState } from "react";
import { definePluginApp, experimental_usePluginId, experimental_useRpcQuery, experimental_useRpcMutation, useSdk, useSettings } from "@get-bb/plugin-sdk/app";
import { mountQueueCollapse } from "./collapse-queue";
import { mountToolGrouping } from "./group-tools";
import { AREAS, buildCss } from "./rules";
import { dictionaryContract } from "./dictionary-contract.ts";
import { pickDictionaryQuote } from "./dictionary-builtins.ts";

// Mounted once per window; re-renders when settings change, so toggles apply live.
function HideStyles() {
  const { values } = useSettings();
  const pluginId = experimental_usePluginId();
  const css = buildCss(pluginId, (key) => values?.[key] === true);
  const collapseToolCalls = values?.collapseToolCalls === true;
  const sdk = useSdk();
  const active = experimental_useRpcQuery({ contract: dictionaryContract, method: "dictionaryActive", input: null, enabled: collapseToolCalls });
  const dictionary = active.data;
  useEffect(() => {
    // Failed/unfinished first reads leave BB's native calls visible. Successful
    // refreshes retain the selection; only an explicit dictionary/revision change remounts.
    if (!collapseToolCalls || !dictionary) return;
    return mountToolGrouping(
      async (threadId) => (await sdk.threads.timeline({ threadId, deferContent: "true", includeNestedRows: "true" })).rows,
      () => pickDictionaryQuote(dictionary.quotes),
      undefined,
      (notify) => {
        const unsubscribeThread = sdk.subscribe({
          event: "thread:changed",
          callback: (event) => {
            if (!event.changes.some(change =>
              ["events-appended", "status-changed", "history-compacted", "history-rewritten"].includes(change),
            )) return;
            notify(event.id, event.changes.includes("status-changed") ||
              event.metadata?.eventTypes?.includes("turn/completed") === true);
          },
        });
        const unsubscribeConnection = sdk.subscribe({
          event: "realtime:connection",
          callback: (event) => {
            if (event.state === "connected" && event.reconnected) notify(undefined, true);
          },
        });
        return () => { unsubscribeThread(); unsubscribeConnection(); };
      },
    );
  }, [collapseToolCalls, sdk, dictionary?.id, dictionary?.revision]);
  const collapseQueue = values?.collapseQueue === true;
  useEffect(() => (collapseQueue ? mountQueueCollapse() : undefined), [collapseQueue]);
  return <style data-bb-minus="">{css}</style>;
}

function DictionarySettings() {
  const state = experimental_useRpcQuery({ contract: dictionaryContract, method: "dictionaryList", input: null });
  const activate = experimental_useRpcMutation({ contract: dictionaryContract, method: "dictionaryActivate" });
  const current = state.data;
  const error = activate.error ?? state.error;
  return (
    <section className="space-y-3" aria-label="Словари цитат">
      <h2 className="flex min-h-6 items-center text-sm font-medium text-foreground">Словари цитат</h2>
      <div className="space-y-3 overflow-hidden rounded-md border border-border bg-surface-recessed/70 px-3 py-3">
        <label className="block space-y-2 text-sm text-foreground">
          <span>Активный словарь</span>
          <select
            aria-label="Активный словарь"
            value={current?.activeId ?? ""}
            disabled={!current || activate.isPending}
            onChange={(event) => { void activate.mutate({ id: event.target.value }).then(() => state.refetch()).catch(() => {}); }}
            className="h-9 max-md:pointer-coarse:h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm font-normal shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            {!current ? <option value="">Загрузка словарей…</option> : null}
            {current && !current.dictionaries.some(d => d.id === current.activeId) ? <option value={current.activeId} disabled>Словарь недоступен</option> : null}
            {current?.dictionaries.map(d => <option key={d.id} value={d.id}>{d.title} · {d.count}</option>)}
          </select>
        </label>
        <p className="text-xs text-muted-foreground">Новый словарь можно добавить через агента. Прежние подборки сохраняются.</p>
        {activate.isPending ? <p role="status" className="text-xs text-muted-foreground">Сохраняется выбор…</p> : null}
        {error ? <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{error.message}</p>
          <button type="button" className="text-sm underline underline-offset-2 outline-none focus-visible:ring-1 focus-visible:ring-ring" onClick={() => { activate.reset(); void state.refetch(); }}>Повторить загрузку</button>
        </div> : null}
      </div>
    </section>
  );
}

// Classes copied from bb's declarative settings form so the grouped cards match it.
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  const state = checked ? "checked" : "unchecked";
  return (
    <div className="@container/settings w-full min-w-0">
      <div className="flex flex-row items-center justify-between gap-5">
        <div className="min-w-0 flex-1">
          <p className="min-w-0 text-sm font-normal text-foreground">{label}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-label={label}
          aria-checked={checked}
          data-state={state}
          onClick={() => onChange(!checked)}
          className="peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-input shadow-xs outline-none transition-colors duration-150 hover:duration-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-foreground data-[state=unchecked]:border-input data-[state=unchecked]:bg-muted"
        >
          <span
            aria-hidden="true"
            data-state={state}
            className="pointer-events-none block size-3 rounded-full bg-background ring-0 transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-foreground"
          />
        </button>
      </div>
    </div>
  );
}

function GroupedSettings() {
  const { values } = useSettings();
  const pluginId = experimental_usePluginId();
  const sdk = useSdk();
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  // Optimistic until the next settings snapshot arrives (also picks up `bb plugin config` changes).
  useEffect(() => setPending({}), [values]);
  const set = (key: string, next: boolean) => {
    setPending((p) => ({ ...p, [key]: next }));
    sdk.plugins.updateSettings({ pluginId, values: { [key]: next } }).then(
      () => setError(null),
      (cause: unknown) => {
        setPending(({ [key]: _, ...rest }) => rest);
        setError(cause instanceof Error ? cause.message : String(cause));
      },
    );
  };
  return (
    <div className="space-y-6">
      <DictionarySettings />
      {error === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {AREAS.map((area) => (
        <section key={area.title} className="space-y-3">
          <div className="flex min-h-6 items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-foreground">{area.title}</h2>
          </div>
          <div className="space-y-4 overflow-hidden rounded-md border border-border bg-surface-recessed/70 px-3 py-3">
            {area.rules.map((rule) => (
              <Toggle
                key={rule.key}
                label={rule.label}
                checked={pending[rule.key] ?? values?.[rule.key] === true}
                onChange={(next) => set(rule.key, next)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.experimental_appOverlay({ id: "hide-styles", component: HideStyles });
  app.slots.settingsSection({ id: "grouped-settings", component: GroupedSettings });
});
