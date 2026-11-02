---
title: Minus — PR со служебными Thought и обычным текстом
status: PR created
updated: 2026-10-31
---

# Создание PR в собственном fork

Владелец разрешил создать PR в `vadikhq/bb-plugin-minus` с показанными заголовком и описанием, head `45b54c77c1c69a5fd48a035e15cc8c120f1368cc`, base `main`, без merge и установки. Согласованная редакция опубликована через GitHub connector: [PR #2](https://github.com/vadikhq/bb-plugin-minus/pull/2).

Сводка объединяет инструменты и подтверждённые служебные Thought, сохраняя полезные сообщения. Оформление — обычный серый текст между разделителями. Выпущенным и установленным этот PR не объявляется.

[Read-back GitHub](verification/2026-10-31-visible-thoughts/pr-created.json) подтвердил точные title/body, repo, head/base, открытое состояние без draft и auto-merge. Local/remote/PR SHA совпали; `gh pr status` показывает PR под Current branch. [pr-binding](verification/2026-10-31-visible-thoughts/pr-binding.txt) вернул BOUND. Канбан-карточка привязана к точному URL собственного fork.

[Preflight](verification/2026-10-31-visible-thoughts/pr-create-preflight.json) заново проверил exact head и актуальный main: Actions workflows и зарегистрированные workflows отсутствуют. Check runs/statuses при read-back пусты; это отсутствие CI, а не зелёный прогон. После создания PR Codex connector оставил review COMMENTED и одно P2 на том же head: activity ранее смонтированного Thought может восстановиться в соседней завершённой группе через virtualization spacer. [Замечание](verification/2026-10-31-visible-thoughts/pr-findings.json) пока отдельно не воспроизведено и не закрыто. Историческое локальное ревью не отменяет новое замечание. Ранее выполненные 106 тестов, tsc/build и независимое exact-source ревью сохранены в [журнале реализации](2026-10-31-visible-thoughts.md). Исходные байты после ревью не менялись.

Первая команда `gh pr status --json` использовала неподдерживаемые top-level поля; дальнейшее чтение выполнено с поддержанными полями. Явный `--repo` отключает секцию Current branch в этой CLI-версии: сначала отдельно подтверждён default repo собственного fork, затем статус прочитан из текущего checkout без override. Эти ошибки чтения не вызвали повторного создания PR.

Merge, auto-merge, удаление ветки, установка и изменение runtime не выполнялись. Следующий шаг — разобрать новое P2 до подготовки условий отдельного слияния. В рамках точного разрешения создания PR согласованный head сохраняется без последующих коммитов. Откат операции создания — отдельно согласованное закрытие PR; сейчас PR остаётся открыт, прежние ветки и установка сохранены.

Эта запись и квитанции сохранены локально, без нового commit/push: head PR намеренно оставлен точным `45b54c77…`. Не выдаём локальную операционную запись за опубликованную Git-документацию. Прежние untracked installation/операционные материалы не изменялись.
