import type { GroupQuote } from "./dictionary-builtins.ts";
import { favoriteKey, type FavoriteSnapshot } from "./favorites-model.ts";
import type { FavoritesClient } from "./favorites-client.ts";
import { quoteStrings, type QuoteLanguage } from "./quote-i18n.ts";

export const HEART_PATH = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z';
export const GEAR_PATH = 'm9.7 3-.6 2.2-1.8 1L5.1 6l-2 3.4 1.5 1.7v2L3.1 15l2 3.4 2.2-.3 1.8 1 .6 2.2h4.6l.6-2.2 1.8-1 2.2.3 2-3.4-1.5-1.8v-2l1.5-1.8-2-3.4-2.2.3-1.8-1-.6-2.2Z';
const svg = (path: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/>${path === GEAR_PATH ? '<circle cx="12" cy="12" r="3"/>' : ''}</svg>`;
export const QUOTE_HTML = `<div class="rounded-md text-subtle-foreground w-full">
  <div data-row class="group/timeline-row min-w-0 text-sm leading-5">
    <span data-icon-slot><button data-like type="button" class="text-subtle-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-pressed="false">${svg(HEART_PATH)}</button></span>
    <div data-quote-copy><span data-gear-slot><button data-quote-actions type="button" aria-haspopup="menu" aria-expanded="false" class="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg></button></span><label data-quote-control class="group/toggle inline whitespace-normal break-words cursor-pointer"><span data-quote class="whitespace-normal break-words text-sm not-italic leading-5 text-subtle-foreground"></span> ·&nbsp;<span data-source class="mr-1.5 break-words text-xs not-italic leading-5 text-subtle-foreground"></span></label>
    <button data-metrics data-toggle="metrics" type="button" aria-expanded="false" class="inline-flex max-w-full items-center whitespace-nowrap px-0 py-0 text-left align-baseline text-xs leading-5 text-subtle-foreground underline underline-offset-2 hover:decoration-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"><span data-count class="whitespace-nowrap"></span><span data-dots data-minus-icon aria-hidden="true"><i></i><i></i><i></i></span><svg data-minus-chevron viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="bb-icon-stroke pointer-events-none inline-block size-3 origin-center text-subtle-foreground transition-[rotate] duration-200 ease-out" aria-hidden="true"><path d="M6 4l4 4-4 4"/></svg></button><span data-activity-label class="sr-only"></span><span data-like-status role="status" aria-live="polite"></span>
    </div>
  </div>
</div>`;

// Geometry and cadence come from the owner's accepted prototype: native
// spacing=4px, leading-5=20px, 28/36px hitboxes, one-second spin cadence.
export const QUOTE_CSS = `
[data-bb-minus-group]{--minus-leading:calc(5 * var(--spacing));--minus-gap:calc(2 * var(--spacing));--minus-control:calc(7 * var(--spacing))}
[data-bb-minus-group] [data-row]{display:grid;grid-template-columns:var(--minus-leading) minmax(0,1fr);gap:var(--minus-gap);align-items:start}
[data-bb-minus-group] [data-icon-slot]{display:flex;align-items:center;justify-content:center;height:var(--minus-leading)}
[data-like],[data-quote-actions]{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:var(--minus-control,calc(7 * var(--spacing)));height:var(--minus-control,calc(7 * var(--spacing)));padding:0;border:0;border-radius:calc(var(--radius) - 2px);background:transparent;color:var(--subtle-foreground);cursor:pointer}
[data-like] svg,[data-quote-actions] svg{width:calc(4 * var(--spacing));height:calc(4 * var(--spacing));fill:none}
[data-quote-actions] svg{fill:currentColor}
[data-like][aria-pressed="true"]{color:var(--color-red-500)}
[data-like][aria-pressed="true"] svg{fill:currentColor}
[data-like]:hover,[data-quote-actions]:hover{background:var(--state-hover)}
[data-like]:disabled{cursor:wait}
[data-like][data-feedback]{animation:minus-like-feedback 150ms ease-out}
@keyframes minus-like-feedback{50%{transform:translateY(calc(-.25 * var(--spacing)))}}
[data-bb-minus-group] [data-quote-copy]{display:flow-root;line-height:var(--minus-leading);overflow-wrap:anywhere}
[data-bb-minus-group] [data-gear-slot]{float:inline-end;position:relative;width:var(--minus-control);height:calc((var(--minus-leading) + var(--minus-control))/2);margin-inline-start:var(--minus-gap)}
[data-bb-minus-group] [data-quote-actions]{position:absolute;top:calc((var(--minus-leading) - var(--minus-control))/2);inset-inline-end:0;opacity:0;pointer-events:none}
[data-bb-minus-group]:hover [data-quote-actions],[data-bb-minus-group]:focus-within [data-quote-actions],[data-quote-actions][aria-expanded="true"]{opacity:1;pointer-events:auto}
[data-bb-minus-group] [data-metrics]{gap:var(--spacing);vertical-align:top;text-decoration:none}
[data-bb-minus-group] [data-count]{text-decoration:underline;text-underline-offset:2px}
[data-dots]{display:inline-flex;align-items:center;gap:calc(.5 * var(--spacing));width:calc(3 * var(--spacing));visibility:hidden}
[data-dots] i{width:calc(.5 * var(--spacing));height:calc(.5 * var(--spacing));border-radius:50%;background:currentColor}
[data-tool-state="pending"] [data-dots]{visibility:visible}
[data-tool-state="pending"] [data-dots] i:nth-child(2){animation:minus-second-dot 1s steps(1,end) infinite;animation-play-state:inherit}
[data-tool-state="pending"] [data-dots] i:nth-child(3){animation:minus-third-dot 1s steps(1,end) infinite;animation-play-state:inherit}
@keyframes minus-second-dot{0%,32%{opacity:0}33%,100%{opacity:1}}
@keyframes minus-third-dot{0%,65%{opacity:0}66%,100%{opacity:1}}
[data-like-status]:not(:empty){display:block;font-size:var(--text-xs);color:var(--destructive)}
[data-favorite-item]{display:grid;grid-template-columns:calc(5 * var(--spacing)) minmax(0,1fr);align-items:start;gap:calc(2 * var(--spacing))}
#minus-favorites{outline:none}
#minus-favorites:focus-visible{outline:1px solid var(--ring)}
@media(hover:none){[data-bb-minus-group] [data-quote-actions]{opacity:1;pointer-events:auto}}
@media(max-width:767px) and (pointer:coarse){[data-bb-minus-group],[data-favorite-item]{--minus-control:calc(9 * var(--spacing))}[data-like] svg,[data-quote-actions] svg{width:calc(5 * var(--spacing));height:calc(5 * var(--spacing))}}
@media(prefers-reduced-motion:reduce){[data-dots] i,[data-like][data-feedback]{animation:none!important;opacity:1!important}}
`;

function snapshotFor(quote: GroupQuote): FavoriteSnapshot | undefined {
  if (!("author" in quote) || !quote.dictionaryId || !quote.dictionaryTitle) return undefined;
  return { dictionaryId: quote.dictionaryId, dictionaryTitle: quote.dictionaryTitle, citation: quote };
}
export function createQuoteControls(client: FavoritesClient) {
  let language: QuoteLanguage = "en", loadError = false;
  let retryRead: () => unknown = () => {};
  const rendered = new WeakMap<HTMLElement, FavoriteSnapshot>();
  const quotes = new WeakMap<HTMLElement, GroupQuote>();
  const listeners = new Set<() => void>();
  return {
    get language() { return language; },
    quote(element: HTMLElement) { return quotes.get(element); },
    context(next: QuoteLanguage, failed: boolean, retry: () => unknown) {
      retryRead = retry;
      if (next === language && failed === loadError) return;
      language = next; loadError = failed; for (const listener of listeners) listener();
    },
    subscribe(notify: () => void) { listeners.add(notify); const off = client.subscribe(notify); return () => { off(); listeners.delete(notify); }; },
    click(element: HTMLElement) {
      const snapshot = rendered.get(element);
      if (!client.getSnapshot().data) { void retryRead(); return; }
      if (snapshot) void client.toggle(snapshot);
    },
    render(element: HTMLElement, quote: GroupQuote) {
      quotes.set(element, quote);
      const snapshot = snapshotFor(quote), state = client.getSnapshot(), t = quoteStrings(language);
      if (snapshot) rendered.set(element, snapshot);
      const key = snapshot && favoriteKey(snapshot), error = key && state.errors.get(key);
      const button = element.querySelector<HTMLButtonElement>("[data-like]")!;
      const liked = !!snapshot && client.has(snapshot), pending = !!key && state.pending.has(key);
      const label = pending ? t.saving : error ? t.retry : !state.data ? loadError ? t.reload : t.loading : liked ? t.unlike : t.like;
      const attr = (el: Element, name: string, value: string) => { if (el.getAttribute(name) !== value) el.setAttribute(name, value); };
      attr(button, "aria-pressed", String(liked));attr(button, "aria-label", label);attr(button, "title", label);attr(button, "aria-busy", String(pending));
      attr(button, "aria-disabled", String(pending));
      const disabled = !snapshot || (!state.data && !loadError);
      if (button.disabled !== disabled) button.disabled = disabled;
      const settings = element.querySelector("[data-quote-actions]")!;attr(settings, "aria-label", t.settings);attr(settings, "title", t.settings);
      const status = element.querySelector("[data-like-status]")!;
      const message = error ? t.saveError : loadError ? t.loadError : "";
      if (status.textContent !== message) status.textContent = message;
    },
  };
}
export type QuoteControls = ReturnType<typeof createQuoteControls>;
