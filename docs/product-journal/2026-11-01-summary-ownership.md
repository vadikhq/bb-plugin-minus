---
title: Minus — принадлежность Thought при виртуализации сводки
status: проверено; разрешённая публикация текущей ветки
date: 2026-11-01
---

# Завершённая сводка не получает активность соседнего Thought

При подготовке условий слияния PR #2 и #3 обнаружено новое незакрытое замечание P2 в [PR #2](https://github.com/vadikhq/bb-plugin-minus/pull/2#discussion_r4435719183). Оно относится к собственной текущей ветке writer `bb/minus-visible-thoughts`, не к словарям. Поручение проверить готовность PR включает исправление технической причины по действующему правилу владельца; merge и установка не разрешены.

## Причина и изменение

Завершённая native summary из одного инструмента, virtualization spacer, затем pending Thought с собственным правым инструментом: после удаления Thought из DOM `summaryEntries` продолжал добавлять reasoning уже после набранного header count. В результате обе сводки показывали pending. Header count доказывает инструменты и reasoning между ними, но не владельца последующего Thought через пропуск.

`summaryEntries` теперь фиксирует наличие sibling virtualization spacer и завершает подтверждённый span после полного количества инструментов до следующего reasoning. Свой ранее смонтированный Thought восстанавливается существующим механизмом доказанных tool anchors. Без spacer прежний сценарий native trailing reasoning сохранён. Границы native root/measure, виртуализации, delegated streams, раскрытие и фокус не менялись.

Визуальная основа — текущая count-only редакция от 1 ноября из README. Принятый макет лайков не меняется и не подключается этим исправлением. Словари, SDK/core/vendor, время вызовов, настройки, база и рабочий runtime не менялись.

## Проверка точной редакции

| Проверка | Результат |
| --- | --- |
| Новые owner-left/owner-right регрессии на прежнем source | owner-left PASS; owner-right FAIL, обе группы pending |
| Адресные проверки после исправления | 7 PASS |
| Полный suite | 118 PASS, 0 failures |
| TypeScript и сборка | PASS |
| SDK pin | 0.6.79 сохранён; предупреждение host 0.6.94 не скрыто |
| Независимый actual-module JSDOM | owner-left/right, remount, terminal, count, focus и disclosure PASS |
| Browser fixture | 4 PASS: 390/1280px × owner-left/right; isolated headless Chromium, синтетический HTTP fixture |

Source SHA256: `683aa8b135de1698a6d45d55bc628e096e636918427beb979ed5dc42b3fe1e8f`.
Tests SHA256: `4f18e85a90d5b82f094683c557e955ffb53e55498054b26105cc1656d78d8c81`.

Исходные материалы текущего writer находятся в его thread storage: `minus-summary-owner-before.junit.xml`, `minus-summary-owner-focused.junit.xml`, `minus-summary-owner-full.junit.xml`, `minus-summary-owner-tsc.log`, `minus-summary-owner-build.log`, `minus-summary-owner-writer.patch`. До/после исходники восстановимы из parent commit и diff; новая регрессия сначала дала ожидаемый FAIL. Порогов, таймаутов и новых размеров в runtime не добавлялось.

Сверка `bb-plugin-workflow` / `bb-plugin-authoring`: узкий технический дефект прежнего принятого поведения, текущая ветка и один writer сохранены; контракты SDK/manifest/data не менялись, источник тестов и стадии публикации/установки разделены. `impeccable` Operate / `frontend-design`: индикатор сообщает только доказанную активность, геометрия, тексты, цвета, hitbox, анимация и принятый макет не меняются; нового дизайна нет. Полный повтор дизайн-поиска и проверок settings/rails неприменим, эти поверхности неизменны.

## Совместное слияние двух PR

Оба PR по отдельности GitHub считает MERGEABLE/CLEAN относительно `main@9bf014f9c594f79d6d95734152f755fd03bfb666`. Read-only `git merge-tree` между их heads выявил конфликты в `PLUGIN_OVERVIEW.md`, `README.md`, `group-tools.ts`, `skills/minus/SKILL.md`. В частности, выбор словарей пересекается с удалением времени и средней точкой. Автоматическое последовательное слияние двух прежних heads нельзя считать подготовленным.

Рекомендуемый порядок: отдельно согласовать и слить #3, затем обновить текущую ветку #2 от нового origin/main, разрешить технические конфликты с сохранением обоих принятых сценариев, проверить объединённый source и предъявить новый head #2 на отдельное merge-согласование. Чужая ветка #3 не меняется. Общий runtime не перезапускается; merge не устанавливает плагин.

## Стадия и откат

Это проверенный source-кандидат текущего PR, ещё не установленный. Рабочий path source `minus-count-only-artifact` не изменён. Возврат к прежнему исходнику при необходимости выполняется отдельным обычным revert текущего исправления; стирать историю или подменять installed source не требуется. Новое точное merge-разрешение и отдельная установка не подразумеваются готовностью кода.


## Финальный независимый вердикт этой редакции

P2 снят на указанных source/tests hashes, открытых P0/P1/P2 в проверенном объёме нет. Независимая проверка actual module через JSDOM и отдельный Chromium fixture подтвердила owner-right/owner-left, remount/terminal, фокус, раскрытие, count и cleanup. Просмотрены 8 PNG; writer дополнительно просмотрел узкий owner-right и широкий owner-left. Это синтетическая браузерная проверка, не installed/native-live evidence. Два прежних таймаута подготовки fixture (неполный QuoteEntry) не считаются PASS; они сохранены отдельно, финальный повтор на неизменённом модуле прошёл с нулём page errors и terminal cleanup.

[Санитизированная сводка проверки](verification/2026-11-01-summary-ownership/result.json) связывает регрессию до/после, source/test hashes, полный suite и независимый вердикт. Подробные локальные квитанции: `summary-owner-review-final.json`, `summary-owner-review-browser.json` в thread storage текущего writer. Исходник установленного артефакта не менялся; старые121 combined tests не выдаются за проверку нового объединённого source. После отдельно согласованного merge #3 будущая объединённая редакция #2 требует собственных проверок и нового точного merge-разрешения.
