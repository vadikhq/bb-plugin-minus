---
title: Minus — словари в main и совместимая редакция сводок
status: PR3 merged; PR2 integration checked, awaiting separate merge approval
date: 2026-11-01
---

# Словари и сводки сохранены в общей основе

Владелец ответил точным `yes` на показанное слияние только [PR #3](https://github.com/vadikhq/bb-plugin-minus/pull/3): head `59428a64e8775038609b39d31f43fe5261b8420c` → main `9bf014f9c594f79d6d95734152f755fd03bfb666`, merge commit, immediate, ветку сохранить, без установки. Fresh preflight подтвердил head/base, MERGEABLE/CLEAN, отсутствие review threads/changes requested, workflow files и обязательных checks. Отсутствие CI не объявляется зелёным CI.

GitHub connector выполнил merge один раз; отдельное чтение подтвердило merged=true и merge commit `d2918768c998192b892931e1fce910282bae9ac6` с родителями9bf014/59428a. Remote main указывает на него, ветка словарей осталась на59428a. Общий BB и установленный Minus не менялись.

## Интеграция в своей ветке PR #2

Текущая ветка `bb/minus-visible-thoughts` сохранена. Обновлён remote-tracking origin/main и начат обычный sync main в эту feature-ветку. Четыре конфликта (`PLUGIN_OVERVIEW.md`, `README.md`, `group-tools.ts`, `skills/minus/SKILL.md`) разрешены с сохранением обоих принятых сценариев. Словарный backend/frontend/data сохранён побайтно как в main; цитаты не редактировались. Группировка сохраняет все четыре исправления ownership, native/React/measure boundaries, отсутствие времени, текущую разметку и CSS. Разделитель между цитатой и автором — принятая средняя точка. В docs/skill сохранены настройки словарей, import/CAS/activation и актуальное no-time поведение.

После обратной нормализации только существующего dictionary adapter весь `group-tools.ts` равен прежнему проверенному c8da12f (normalized SHA256 cd66cc…): меняются import/default/type/cache и атрибуция через quoteAttribution, остальные исполняемые тела неизменны. [Независимое интеграционное ревью](verification/2026-11-01-merge-integration/result.json) подтверждает сохранность10 файлов словарей/app/server/package и всех4 P2; открытых P0/P1/P2 в проверенном объёме нет.

## Проверки окончательного кандидата

| Проверка | Результат |
| --- | --- |
| Совместный suite сводок и словарей | 132 PASS, 0 failures |
| TypeScript / build | PASS / PASS |
| Независимые адресные grouping cases | 44 PASS на actual combined module |
| Disposable SDK fake host | legacy/Dalio/custom attribution; RPC/agent import lifecycle PASS |
| Candidate frontend в настоящем native UI | 390/1280px × два исходных случая: одна сводка17/2 tools, без времени, полезные сообщения/delegation видимы |
| Установка / merge PR #2 | Не выполнялись |

Source SHA256: `1aaa646af8d77e96d14c6ef7feef705216c5aeb0541b3f1557f2e49252dc83bd`; tests `eeb299c615a32c4bd8267bbc0da4f0e0f91698f8aaf334b5ef372d336ff04034`; candidate JS `69e2631012ad26b9f0e8bf985f0f2d80a7115f5f10b258e7b715a779adce4539`. SDK0.6.79 сохранён, прежнее предупреждение host0.6.94 не скрыто.

Первый suite честно дал1 failure: тест словарей из main ожидал прежнюю стрелку вместо принятой владельцем средней точки. Обновлено только ожидание glyph, тексты цитаты/автора/главы не менялись. Старый JUnit сохранён отдельно. Съёмка один раз остановилась на detached virtualization row; стенд исправлен на атомарное получение текущей строки. Одна последующая narrow PNG показала неверную область после автопрокрутки, её не приняли: адресный recapture дождался стабильного element/rect на последовательных browser frames. Все4 окончательных quote PNG просмотрены. Непринятые попытки сохранены, source/runtime ради них не менялись.

Native evidence получено через isolated headless Chromium: настоящий frontend с точным candidate JS/CSS и историческими API-страницами в disposable клиентах. Это не установленная версия и не утверждение о production verification. Before/after установленного source/bundle/status совпали: действующий path artifact сохранён. Приватные API/полные PNG и backup не публикуются в Git.

## Сверка процесса и следующая операция

`bb-plugin-workflow` / `bb-plugin-authoring`: текущий writer/ветка, согласованная интеграция, main history и dictionary contracts сохранены; стадии merge3, integration2, merge2 и установки разделены. `impeccable` Operate / `frontend-design`: применяется текущая count-only основа README с дополнением словарей; нормальный серый текст, middle dot, focus/keyboard, узкий экран и stream boundaries сохранены, нового дизайна нет. Settings/rails код побайтно равен принятому main, новый вход не добавлялся. Принятый макет лайков не реализуется этим PR.

После публикации этой редакции local/remote/PR head и GitHub checks/reviews перечитываются. Новый точный head #2 → main d291876 показывается владельцу на отдельное `yes`; предыдущее подтверждение #3 не используется. Установка требует отдельного разрешения после проверки объединённой версии, промежуточный main со словарями не устанавливается. Активный path artifact, его зависимости и данные не удаляются. Операционного отката не требуется, потому что runtime не менялся; исправления feature-ветки выполняются обычными commit, без force push.
