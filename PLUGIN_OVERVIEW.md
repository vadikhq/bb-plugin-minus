## What you get

Thirty switches in Settings, one per element, all off by default:

- The padding and rounded corners around the workbench in the macOS app
- Sidebar projects that have no threads
- Back and forward buttons
- Left sidebar toggle and right panel toggle
- The "..." buttons in the sidebar footer, next to the thread title, and on sidebar thread rows
- The "Open in ..." app menu in the thread header
- The chevron that collapses the prompt box, and its placeholder text
- Plus one switch that opens the message queue collapsed instead of expanded
- The "x" close button and the "Commit" button in the thread title bar
- Under the prompt box: project folder, checkout, branch, new thread button, and context fill level
- In the prompt box: the "+" button, model selector, provider icon, voice input button, and send/stop buttons (Enter still sends)
- The copy, edit, side chat and "..." actions that appear when you hover a message
- The "Steer" label above messages that steered a running turn
- The wrap and copy buttons on code blocks
- The message navigator on the right edge of the chat
- Thinking rows in the chat
- Provider icons on sidebar thread rows

Changes apply in every open window within about a second, without a reload. Keyboard shortcuts keep working for hidden controls (⌘B, ⌘J, ⌘O), and right-clicking a thread row still opens its menu.

## Collapse tool calls

One more switch folds each run of consecutive tool calls in the chat into a single row styled after the native "Worked for" row. The summary shows a curated, self-contained Russian quote in ordinary type, inline Russian author/source attribution without a link, and a visible tool count. Text wraps naturally as the chat narrows. Quote, metrics and source keep BB's muted foreground token on hover and focus, with a visible keyboard focus ring. Click the quote, count/time or disclosure arrow to show the original calls again. A spinning ring indicates running calls; after the whole cycle finishes it becomes a static circle with a dot and the final summed duration appears. Durations use seconds, then minutes and seconds, then hours and minutes. Counts and runtimes come from the complete thread timeline, including virtualized calls; overlapping native summaries count each call once. Concurrent calls are added together, so the total can exceed the group's wall-clock duration. A manual "Stopped manually" row stays visible outside the group and is excluded from both metrics. Reduced-motion preferences are respected; offscreen and background animations pause.

## Quote dictionaries

Choose the active dictionary in Settings → Plugins → Minus → Словари цитат. The initial selection is Рэй Далио — Принципы (452 accepted quotes). Философская подборка preserves all 73 previous entries. Summaries read quote → author → section; Dalio shows the exact chapter, without book title or principle number.

Agents use minus_dictionaries to list, import and explicitly activate sets. Import is atomic, persists separately and does not activate the set. Identical repeats are safe; replacing different custom data requires the current revision. Built-ins cannot be overwritten. Sources and attribution must be checked before import. Save custom dictionaries and settings before removing the plugin.

## How it works

The plugin hides bb elements by labels and data attributes. A bb update that renames an element can bring it back until the plugin is updated. Agents toggle visibility with bb plugin config minus set <key> true.

Reasoning, unknown streaming rows, nested agent timelines, delegation/workflow streams, approvals, questions and forms remain available. The summary shows quote → author/source → tool count and total time, with a shared native horizontal inset.
