# bb-plugin-minus

A [bb](https://getbb.app) plugin that hides UI elements you do not want to see,
and can collapse each continuous block of tool calls in the chat behind one
short Russian quote with inline author attribution.

## Install

```
bb plugin install git:https://github.com/n30g30/bb-plugin-minus.git@^0.2.0
```

Then flip switches in Settings → Plugins → Minus, or from a shell:

```
bb plugin config minus set hideThinking true
```

Keys: `hideWindowFrame`, `hideEmptyProjects`, `hideNavButtons`, `hideSidebarToggle`, `hideRightPanelToggle`,
`hideFooterMore`, `hideThreadHeaderMore`, `hideThreadRowMore`, `hideOpenIn`,
`collapseQueue`, `hidePromptCollapse`, `hidePromptPlaceholder`, `hideCommit`, `hideClosePane`, `hideComposerFolder`,
`hideComposerCheckout`, `hideComposerBranch`, `hideComposerNewThread`,
`hideComposerContext`, `hidePromptPlus`, `hideModelSelector`,
`hidePromptProviderIcon`, `hideMic`, `hideSend`, `hideMessageActions`, `hideSteerLabel`, `hideCodeBlockActions`, `hideMessageNav`, `hideThinking`, `hideThreadIcons`,
`collapseToolCalls`.

## How it works

Each rule in `rules.ts` is one boolean setting, grouped by area (`AREAS`);
enabled rules are rendered as a `display:none` stylesheet by an app overlay
(`app.tsx`), so toggles apply live without a reload. The settings page shows the
switches grouped by area in a plugin settings section, which replaces bb's flat
form on that page. Add an element by appending `{ key, label, selectors }` to
an area. Prefer bb's aria labels and `data-*` attributes over Tailwind classes.

`collapseToolCalls` is not CSS: `group-tools.ts` hides each continuous tool block and its API-confirmed service Thought details in the top-level timeline and inserts a row styled after the native
"Worked for" row. The summary shows a curated, self-contained Russian quote,
Russian author/source attribution without a link, and a visible tool count.
The row uses normal type between native dividers, without blockquote styling.
The text wraps naturally as the chat narrows. Quote, metrics and source keep
BB's muted foreground token, including on hover and focus; keyboard focus has
a visible ring. bb virtualizes the timeline, so counts come from
`sdk.threads.timeline()` (`kind: "work"` rows), including calls that are not
currently mounted. Each call is counted once, even when native summaries overlap.
A manual "Stopped manually" row stays visible outside the group. Adjacent API
runs share one quote when no useful message or other meaningful boundary separates them.

The summary shows the call count and disclosure arrow. Tool runtimes are neither
calculated nor displayed. Sequential dots after the count indicate activity and
keep their reserved space after completion. Reduced-motion preferences are
respected; offscreen and background animations pause. The heart beside a quote
is an independent like button and never opens the tool disclosure.

## License

MIT

Collapsing tools keeps useful messages, unknown streaming rows, nested agent timelines and delegation/workflow streams visible. API-confirmed pending/completed Thought rows sharing a tool cycle belong to that cycle's disclosure, without adding calls. A pending Thought keeps the cycle active even when its row is virtualized; standalone, unverified or failed reasoning stays native. When a completed stage is open, its commentary and grouped tools use the normal chat inset without an enclosing Worked for disclosure; quote and metrics controls reveal only the tool rows. Turning grouping off restores the native presentation. Approval, question and form rows remain available for the user to respond. The summary reads quote · Russian author/source → tool count, with a shared native horizontal inset.

## Quote dictionaries

The heart saves or removes a quote from **Liked quotes** in Settings → Plugins → Minus. Filled red hearts share the saved state across repetitions. The small settings gear beside a quote opens that same page and focuses the list; it appears on hover or keyboard focus and stays available on touch screens. Favorites contain snapshots from every dictionary, independently of the active selection, and survive reloads and dictionary updates. Reusing a quote ID for different text does not inherit its like.

Likes are confirmed by a separate read after saving. A failed or lost response keeps the last confirmed state and offers an idempotent retry. The new controls use English or Russian through the existing Localization plugin, with English fallback when its API is unavailable. Quote text remains unchanged. Back up the plugin database as well as settings before removal: it now stores favorites alongside custom dictionaries. [Implementation and verification](docs/product-journal/2026-11-02-quote-likes.md).

Settings → Plugins → Minus → **Словари цитат** selects the active dictionary. This release starts with **Рэй Далио — Принципы** (452 accepted quotes); **Философская подборка** keeps all 73 previous entries unchanged. The selection persists. Each summary reads quote · author → section in ordinary muted text. Dalio summaries show the exact chapter name, without the book title or principle number.

Agents can use `minus_dictionaries` to list, import and explicitly activate dictionaries. Import validates the whole set atomically, stores it in the plugin database and leaves the active selection unchanged. An identical repeated import is safe; replacing different data requires the current `expectedRevision` from `list`. Built-in dictionaries cannot be replaced. See the [agent skill](skills/minus/SKILL.md) for the input format.

Imports require checked attribution and source locators; structural validation alone does not verify a quotation. Research candidates are not imported automatically. Back up custom dictionaries and settings before removing the plugin. The accepted UI amendment and verification are recorded in the [quote dictionaries journal](docs/product-journal/2026-10-31-quote-dictionaries.md), extending the current visual reference below. The [installation journal](docs/product-journal/2026-10-31-quote-dictionaries-installation.md) records the exact installed source and direct live UI checks.

The current UI reference is the owner's accepted [quote-likes amendment](docs/product-journal/2026-11-02-quote-likes.md), identified there by the approved prototype SHA256. It extends the [count-only summary amendment, 2026-11-01](docs/product-journal/2026-11-01-count-only.md), [Thought-grouping amendment](docs/product-journal/2026-10-31-visible-thoughts.md) and [one-summary reference](docs/product-journal/2026-10-31-quote-flood.md) (“Теперь без флуда, оставляем”). The heart replaces the activity icon; dots move after the count, with no tool timing. Accepted dividers, spacing and useful streams remain. Quote and attribution flow together around a middle dot, without a forced line break. The [motion and fork integration decision](docs/product-journal/2026-10-31-motion-pr.md) remains applicable where not superseded by this amendment.

The owner’s [1 November count-only amendment](docs/product-journal/2026-11-01-count-only.md) removes tool-time calculation and the duplicate Worked for frame around grouped calls. It supersedes the earlier duration behaviour; all other accepted visual decisions remain.
