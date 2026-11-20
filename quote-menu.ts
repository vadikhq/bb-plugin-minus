import { quoteAttribution, type GroupQuote } from "./dictionary-builtins.ts";
import { GEAR_PATH, snapshotFor, type QuoteControls } from "./quote-controls.ts";
import { quoteStrings } from "./quote-i18n.ts";
import { feedbackKinds, feedbackKey, type FeedbackClient } from "./quote-feedback.ts";
import { favoriteKey, type FavoriteSnapshot } from "./favorites-model.ts";

const COPY = 'M9 9h12v12H9zM5 15H3V3h12v2';
const CHECK = 'm5 12 4 4L19 6';
const EYE_OFF = 'm3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.4 5.3c.8-.2 1.7-.3 2.6-.3 5 0 9 5 10 7-.6 1-1.5 2.2-2.6 3.3M6.3 6.4C4.3 7.8 2.8 9.8 2 12c1 2 5 7 10 7 1.5 0 3-.5 4.1-1.1';
const FLAG = 'M4 22V4m0 1c2-1.5 4-2 6-1 3 1.5 5 2 9 0v11c-4 2-6 1.5-9 0-2-1-4-.5-6 1';
// Geometry derives from the accepted top-right prototype and existing BB tokens.
export const MENU_CSS = `
[data-minus-quote-menu]{position:fixed;inset:auto;margin:0;padding:var(--spacing);width:max-content;max-width:calc(100vw - 4 * var(--spacing));max-height:calc(100dvh - 4 * var(--spacing));overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);background:var(--popover,var(--background));color:var(--foreground);font-family:var(--font-sans);font-size:var(--text-sm);line-height:calc(5 * var(--spacing))}
[data-minus-quote-menu]:popover-open{display:flex;flex-direction:column}
[data-minus-quote-menu] :is(button,a){display:flex;align-items:center;gap:calc(2 * var(--spacing));min-height:var(--menu-control);padding:var(--spacing) calc(2 * var(--spacing));border:0;border-radius:calc(var(--radius) - 2px);background:transparent;color:inherit;font:inherit;text-align:start;text-decoration:none;cursor:pointer}
[data-minus-quote-menu] :is(button,a):is(:hover,:focus){background:var(--state-hover)}
[data-minus-quote-menu] :is(button,a):focus-visible{outline:1px solid var(--ring);outline-offset:-1px}
[data-minus-quote-menu] button[aria-disabled=true]{cursor:default}
[data-minus-quote-menu] button[aria-busy=true]{cursor:wait}
[data-minus-quote-menu] svg{flex:none;width:var(--menu-icon);height:var(--menu-icon);fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
[data-copy-label]{display:grid}
[data-copy-label]>span{grid-area:1/1;visibility:hidden}
[data-menu-copy][data-state=idle] [data-label-idle],[data-menu-copy][data-state=copied] [data-label-copied],[data-menu-copy][data-state=error] [data-label-error]{visibility:visible}
[data-feedback-label]{display:grid;min-width:0;overflow-wrap:anywhere}
[data-feedback-label]>span{grid-area:1/1;visibility:hidden}
[data-menu-feedback]:not([data-selected],[data-error]) [data-action-label],[data-menu-feedback][data-selected] [data-done-label],[data-menu-feedback][data-error] [data-retry-label]{visibility:visible}
`;
const svg = (path: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/>${path === GEAR_PATH ? '<circle cx="12" cy="12" r="3"/>' : ''}</svg>`;
export const copyQuoteText = (quote: GroupQuote) => quote.text + "\n\n— " + quoteAttribution(quote).byline;
let menuSequence = 0;

// One overlay for this grouping lifecycle, outside native timeline measure boxes.
export function mountQuoteMenu(controls: QuoteControls, copy: (text: string) => Promise<boolean>, feedback?: FeedbackClient) {
  const view = document.defaultView!;
  const menu = document.createElement("div");
  menu.id = `bb-minus-quote-actions-${++menuSequence}`;
  menu.setAttribute("data-minus-quote-menu", "");
  menu.setAttribute("popover", "auto");
  menu.setAttribute("role", "menu");
  const feedbackMarkup = feedback ? feedbackKinds.map(kind =>
    `<button data-menu-feedback="${kind}" role="menuitem" type="button">${svg(kind === "hidden" ? EYE_OFF : FLAG)}<span data-feedback-label><span data-action-label></span><span data-done-label></span><span data-retry-label></span></span></button>`).join("") : "";
  menu.innerHTML = `<button data-menu-copy role="menuitem" type="button"><span data-copy-icon>${svg(COPY)}</span><span data-copy-label><span data-label-idle></span><span data-label-copied></span><span data-label-error></span></span></button>${feedbackMarkup}<a data-menu-settings role="menuitem" href="/settings/plugins/minus#minus-favorites">${svg(GEAR_PATH)}<span></span></a><span data-copy-status class="sr-only" role="status" aria-live="polite"></span>`;
  document.body.append(menu);
  const copyItem = menu.querySelector<HTMLButtonElement>("[data-menu-copy]")!;
  const settings = menu.querySelector<HTMLAnchorElement>("[data-menu-settings]")!;
  const status = menu.querySelector<HTMLElement>("[data-copy-status]")!;
  const feedbackItems = [...menu.querySelectorAll<HTMLButtonElement>("[data-menu-feedback]")];
  const items = [copyItem, ...feedbackItems, settings];
  let origin: HTMLElement | null = null, trigger: HTMLButtonElement | null = null;
  let text = "", generation = 0, disposed = false;
  let anchor: { x: number; y: number } | null = null;
  let language = controls.language;
  let snapshot: FavoriteSnapshot | undefined;
  let state: "idle" | "copied" | "error" = "idle";
  const open = () => menu.matches(":popover-open");
  const attr = (el: Element, key: string, value: string) => { if (el.getAttribute(key) !== value) el.setAttribute(key, value); };
  const renderFeedback = () => {
    if (!feedback) return;
    const current = feedback.getSnapshot(), t = quoteStrings(language);
    for (const [index, button] of feedbackItems.entries()) {
      const kind = feedbackKinds[index];
      const input = snapshot && { snapshot, kind };
      const selected = !!input && feedback.has(input);
      const key = input && feedbackKey(input);
      const pending = !!key && current.pending.has(key);
      const failed = !selected && !!key && current.errors.get(key)?.desired === true;
      const action = kind === "hidden" ? t.hideQuote : t.flagQuote;
      const done = kind === "hidden" ? t.hiddenQuote : t.flaggedQuote;
      const retry = kind === "hidden" ? t.retryHide : t.retryFlag;
      for (const [label, value] of [["action", action], ["done", done], ["retry", retry]]) {
        const span = button.querySelector(`[data-${label}-label]`)!;
        if (span.textContent !== value) span.textContent = value;
      }
      button.toggleAttribute("data-selected", selected);
      button.toggleAttribute("data-error", failed);
      attr(button, "aria-label", selected ? done : failed ? retry : action);
      attr(button, "aria-disabled", String(!input || !current.data || pending || selected));
      attr(button, "aria-busy", String(pending));
      attr(button.querySelector("path")!, "d", selected ? CHECK : kind === "hidden" ? EYE_OFF : FLAG);
    }
  };
  const label = () => {
    const t = quoteStrings(controls.language);
    attr(menu, "aria-label", t.actions);
    for (const [key, value] of [["idle", t.copy], ["copied", t.copied], ["error", t.copyRetry]]) menu.querySelector(`[data-label-${key}]`)!.textContent = value;
    settings.querySelector("span")!.textContent = t.settings;
    attr(copyItem, "aria-label", state === "error" ? t.copyError : state === "copied" ? t.copySuccess : t.copy);
    copyItem.dataset.state = state;
  };
  const focusItem = (index: number) => {
    const item = items[index];
    items.forEach((entry, i) => entry.tabIndex = i === index ? 0 : -1);
    item.focus({ preventScroll: true });
    const row = item.getBoundingClientRect(), viewport = menu.getBoundingClientRect();
    if (row.top < viewport.top) menu.scrollTop += row.top - viewport.top;
    else if (row.bottom > viewport.bottom) menu.scrollTop += row.bottom - viewport.bottom;
  };
  function close(restore = false) {
    generation++;
    if (open()) menu.hidePopover();
    trigger?.setAttribute("aria-expanded", "false");
    if (restore && trigger?.isConnected) trigger.focus({ preventScroll: true });
    origin = null; trigger = null; anchor = null; snapshot = undefined;
  }
  function position() {
    if (!trigger || !open()) return;
    const a = trigger.getBoundingClientRect(), m = menu.getBoundingClientRect();
    // Same accepted spacing: grid column-gap / 2 = one native spacing step.
    const gap = parseFloat(view.getComputedStyle(origin!.querySelector('[data-row]')!).columnGap) / 2;
    const inset = 2 * gap;
    anchor = { x: a.x, y: a.y };
    menu.style.left = Math.max(inset, Math.min(a.right - m.width, view.innerWidth - inset - m.width)) + "px";
    menu.style.top = (a.bottom + gap + m.height <= view.innerHeight - inset ? a.bottom + gap : Math.max(inset, a.top - gap - m.height)) + "px";
  }
  function show(button: HTMLButtonElement, last = false) {
    close();
    origin = button.closest<HTMLElement>("[data-bb-minus-group]");
    const quote = origin && controls.quote(origin);
    if (!quote) { origin = null; return; }
    trigger = button; text = copyQuoteText(quote); language = controls.language; snapshot = snapshotFor(quote);
    state = "idle"; status.textContent = ""; label(); renderFeedback();
    copyItem.querySelector("[data-copy-icon]")!.innerHTML = svg(COPY);
    attr(copyItem, "aria-disabled", "false"); copyItem.removeAttribute("aria-busy");
    menu.style.setProperty("--menu-control", button.getBoundingClientRect().height + "px");
    menu.style.setProperty("--menu-icon", button.querySelector("svg")!.getBoundingClientRect().width + "px");
    attr(button, "aria-expanded", "true");
    menu.showPopover(); position(); focusItem(last ? items.length - 1 : 0);
  }
  function click(event: MouseEvent) {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>('[data-bb-minus-group] [data-quote-actions]');
    if (button) {
      // Native popovertarget prevents light-dismiss before this same-trigger
      // click. Prevent its default action because we handle position/focus.
      event.preventDefault();
      if (open() && trigger === button) close(true); else show(button);
    }
  }
  async function write() {
    if (copyItem.getAttribute("aria-disabled") === "true" || !open()) return;
    const op = generation, t = quoteStrings(language);
    attr(copyItem, "aria-disabled", "true"); attr(copyItem, "aria-busy", "true"); attr(copyItem, "aria-label", t.copying);
    let ok = false;
    try { ok = await copy(text); } catch { /* Caller-owned error feedback even if host throws. */ }
    refresh();
    if (disposed || op !== generation || !open()) return;
    attr(copyItem, "aria-disabled", "false"); copyItem.removeAttribute("aria-busy");
    state = ok ? "copied" : "error"; label();
    copyItem.querySelector("[data-copy-icon]")!.innerHTML = svg(ok ? CHECK : COPY);
    status.textContent = ok ? t.copySuccess : t.copyError;
  }
  async function selectFeedback(event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    const kind = feedbackKinds[feedbackItems.indexOf(button)];
    if (!feedback || !snapshot || !open() || button.getAttribute("aria-disabled") === "true") return;
    const input = { kind, snapshot }, op = generation, t = quoteStrings(language);
    status.textContent = t.feedbackSaving;
    await feedback.set(input, true);
    refresh();
    if (disposed || op !== generation || !open()) return;
    status.textContent = feedback.has(input) ? (kind === "hidden" ? t.hiddenQuote : t.flaggedQuote) : t.feedbackError;
  }
  function keydown(event: KeyboardEvent) {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-bb-minus-group] [data-quote-actions]') : null;
    if (button && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); show(button, event.key === "ArrowUp"); return; }
    if (!open() || !menu.contains(event.target as Node)) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const i = items.indexOf(document.activeElement as typeof copyItem);
      focusItem(event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (i + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length);
    } else if (event.key === "Escape") { event.preventDefault(); close(true); }
    else if (event.key === "Tab") close(true);
  }
  function refresh() {
    if (!origin) return;
    const quote = controls.quote(origin);
    const current = quote && snapshotFor(quote);
    if (!origin.isConnected || !trigger?.isConnected || !quote || copyQuoteText(quote) !== text || controls.language !== language ||
      (snapshot && (!current || favoriteKey(snapshot) !== favoriteKey(current)))) { close(); return; }
    // Streaming can move the anchor without a scroll event. A menu must not
    // stay beside another quote while an async clipboard response is pending.
    scroll();
  }
  const scroll = () => {
    if (!open() || !anchor || !trigger) return;
    const a = trigger.getBoundingClientRect();
    if (a.x !== anchor.x || a.y !== anchor.y) close();
  };
  const toggle = () => { if (!open() && trigger) close(); };
  const navigate = () => close();
  const copyClick = () => { void write(); };
  const feedbackClick = (event: MouseEvent) => { void selectFeedback(event); };
  const unsubscribeFeedback = feedback?.subscribe(() => { if (open()) renderFeedback(); });
  document.addEventListener("click", click);
  document.addEventListener("keydown", keydown);
  copyItem.addEventListener("click", copyClick);
  for (const button of feedbackItems) button.addEventListener("click", feedbackClick);
  settings.addEventListener("click", navigate);
  menu.addEventListener("toggle", toggle);
  view.addEventListener("resize", position);
  view.addEventListener("scroll", scroll, true);
  return {
    prepare(element: HTMLElement) {
      const button = element.querySelector<HTMLButtonElement>("[data-quote-actions]")!;
      attr(button, "popovertarget", menu.id); attr(button, "aria-controls", menu.id);
      attr(button, "aria-label", quoteStrings(controls.language).actions); attr(button, "title", quoteStrings(controls.language).actions);
    },
    refresh,
    dispose() {
      disposed = true; close();
      document.removeEventListener("click", click); document.removeEventListener("keydown", keydown);
      copyItem.removeEventListener("click", copyClick); settings.removeEventListener("click", navigate);
      unsubscribeFeedback?.();
      for (const button of feedbackItems) button.removeEventListener("click", feedbackClick);
      menu.removeEventListener("toggle", toggle); view.removeEventListener("resize", position); view.removeEventListener("scroll", scroll, true);
      menu.remove();
    },
  };
}
