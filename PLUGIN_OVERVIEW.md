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

One more switch folds a tool cycle and its API-confirmed service Thought rows into one compact summary between native dividers. It shows a self-contained quote in normal muted type, inline author/section attribution without a link, and the call count with a disclosure arrow. Text wraps naturally with the chat width. Click the quote, count or arrow to reveal the original calls. A spinning ring indicates activity; after the complete cycle it becomes a static circle with a dot. Tool runtimes are neither calculated nor displayed. Counts use the complete thread timeline, including virtualized calls; overlapping native summaries count each call once. A manual "Stopped manually" row stays visible and is not counted. Reduced-motion preferences are respected; offscreen and background animations pause.

## Quote dictionaries

Choose the active dictionary in Settings → Plugins → Minus → Словари цитат. The initial selection is Рэй Далио — Принципы (452 accepted quotes). Философская подборка preserves all 73 previous entries. Summaries read quote · author → section; Dalio shows the exact chapter, without book title or principle number.

Agents use minus_dictionaries to list, import and explicitly activate sets. Import is atomic, persists separately and does not activate the set. Identical repeats are safe; replacing different custom data requires the current revision. Built-ins cannot be overwritten. Sources and attribution must be checked before import. Save custom dictionaries and settings before removing the plugin.

## How it works

The plugin hides bb elements by labels and data attributes. A bb update that renames an element can bring it back until the plugin is updated. Agents toggle visibility with bb plugin config minus set <key> true.

Collapsing tools keeps useful messages, unknown streaming rows, nested agent timelines and delegation/workflow streams visible. API-confirmed pending/completed Thought rows share the neighbouring tools' disclosure and do not add to call counts; a virtualized pending Thought keeps the cycle active until completion. Standalone, unverified or failed reasoning remains native. Approval, question and form rows remain available for the user to respond. The summary reads quote · Russian author/source → tool count, with a shared native horizontal inset.
