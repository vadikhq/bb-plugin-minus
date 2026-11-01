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
calculated nor displayed. A native spinning ring indicates activity; after the
cycle completes it becomes a static circle with a dot. Reduced-motion preferences
are respected; offscreen and background animations pause.

## License

MIT

Collapsing tools keeps useful messages, unknown streaming rows, nested agent timelines and delegation/workflow streams visible. API-confirmed pending/completed Thought rows sharing a tool cycle belong to that cycle's disclosure, without adding calls. A pending Thought keeps the cycle active even when its row is virtualized; standalone, unverified or failed reasoning stays native. When a completed stage is open, its commentary and grouped tools use the normal chat inset without an enclosing Worked for disclosure; quote and metrics controls reveal only the tool rows. Turning grouping off restores the native presentation. Approval, question and form rows remain available for the user to respond. The summary reads quote → Russian author/source → tool count, with a shared native horizontal inset.

The current UI reference is the owner's [count-only summary amendment, 2026-11-01](docs/product-journal/2026-11-01-count-only.md), extending the approved [Thought-grouping amendment](docs/product-journal/2026-10-31-visible-thoughts.md) and [one-summary visual reference](docs/product-journal/2026-10-31-quote-flood.md) (“Теперь без флуда, оставляем”). It retains the accepted ring, dot, disclosure arrow and divider/spacing decisions while removing tool-time calculation. Agent streams remain outside the dividers; quote and Russian attribution flow together without a link or forced line break. The [motion check and fork integration decision](docs/product-journal/2026-10-31-motion-pr.md) remain applicable.

The owner’s [1 November count-only amendment](docs/product-journal/2026-11-01-count-only.md) removes tool-time calculation and the duplicate Worked for frame around grouped calls. It supersedes the earlier duration behaviour; all other accepted visual decisions remain.
