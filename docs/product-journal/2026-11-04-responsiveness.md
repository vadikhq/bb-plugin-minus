---
title: Minus — вернуть цитаты с отзывчивым вводом
date: 2026-11-04
status: подготовлена согласованная отдельная копия
---

# Цитаты и отзывчивость

Поручение владельца — «Верни цитаты без тормозов». Существующие цитаты, словари, лайки, раскрытие инструментов и визуальная основа сохраняются. Заказчик и независимый ревьюер — thr_e2kgg8cw7w; единственный writer — thr_bza87x5nhg.

## Решение и границы

В исходном треде заказчика непосредственно прочитан ответ владельца: «Продолжение работы: Разрешаю указанную копию, ветку и исправление». Последующее решение владельца передаёт реализацию профильному треду Minus, оставляя заказчику независимое ревью. Принятый план хранится у заказчика как `minus-responsiveness-plan.md`; его устаревшее поле `checkpoint awaiting approval` не отменяет прочитанный последующий ответ.

Разрешены отдельная Git-копия, ветка `bb/minus-responsiveness` от свежего `origin/main`, воспроизведение, минимальное исправление и проверка. Merge, установка, reload, активация и общий restart не разрешены. Полный окончательный title/body будущего PR показывается заказчику до внешней публикации. Изменения BB, SDK, vendor/cache, других плагинов и пользовательских данных не входят в работу.

## Подготовка 4 ноября

Повторно подтверждены свободные target-каталог и remote-ветка; GitHub connector не нашёл PR этой ветки во всех состояниях. Создана самостоятельная root Git-копия из `https://github.com/vadikhq/bb-plugin-minus.git`, без worktree, зависимостей и подключения к runtime. Точная исходная редакция — `5087a63b3dbd544d1f540d101b99d72a35abd2dc`; новая ветка — `bb/minus-responsiveness`, без upstream до публикации.

Исходный checkout на `bb/minus-quote-copy` остался побайтно неизменным: head `6e5614423091ef35b8442c6598595655b8628fa4`, прежний upstream и 36 untracked файлов сохранены. Отдельный PR #6 с принятым верхним правым меню копирования остаётся самостоятельной задачей. Его UI-дополнение не переносится попутно в исправление отзывчивости.

SHA256 исходного `group-tools.ts` новой копии — `5489febe0751810b37fcb1f9aa6c16dc11e204509e7bcceaa52b9ccd2d296ce3`. Это уже включает прежнее observer-cost исправление. Оно не будет выдаваться за новое исправление нынешней жалобы.

## Сверка основы и следующий шаг

Прочитаны текущие `bb-plugin-workflow`, `bb-plugin-authoring`, `impeccable` и `frontend-design`. Указатель README ведёт к принятой основе лайков: `minus-likes-preview.html`, SHA256 `d918e8f8c3379bf1acb4a49b4908eb3f4ddf86b72ab9cea7a0a9efa6343ba3c4`. Имя треда «I — plugins: Minus» и сохранённая общая задача соответствуют работе. Новая визуальная основа не создаётся.

Следующий этап — конечное изолированное воспроизведение лишних проходов/запросов на одинаковых данных, затем минимальный доказанный fix. Нужно проверить streaming, задержанные ответы, cleanup, счётчики, Thought/delegation boundaries, клавиатуру, focus, узкий экран/desktop и точные соседние Routines/Sidebar/GenUI/Suggestion Chips. Отдельные прежние предложения о возрасте истории и native fallback не применяются как автоматически принятый дизайн этого исправления.

> [!IMPORTANT]
> Пока выполнена только подготовка исходной копии. Нового исправления, benchmark, build, UI-проверки, commit/PR или установки здесь ещё нет. Наблюдавшееся восстановление клиентов после refresh не доказывает единственную причину прежних зависаний. Рабочий Minus остаётся отключённым.

## Обратный путь

На этом этапе runtime и данные не менялись, откат установленного кода не требуется. Исходная копия и прежние ветки сохранены. Будущий проверенный пакет и точная установка потребуют отдельного согласования после независимого ревью.

## Последующее разрешение и проверенный кандидат

Владелец затем поручил «доведи до установки. и проверки что всё ок». Заказчик завершил source-bound ревью runtime SHA256 `14b2a29f55c1ae27ac6f478aecb7c07a47f9b5be474bf13f701d54aad3a3794a`: accepted blockers 0. Разрешена локальная установка и включение без предварительного merge/PR; общий restart и чужие изменения запрещены.

Конечный fixture подтвердил лишние обходы второй ленты при трёх изменениях native work-title и одном API reply первой, проход из-за own feedback и удержание detached IntersectionObserver. Кандидат обрабатывает затронутый timeline-root, отсекает только реальные собственные узлы по WeakSet, сохраняет discovery topology/identity/mount/unmount и освобождает detached observations. Логика групп/счётчиков/Thought/delegation, API cadence, SDK и модель данных не менялись. Прежний first-duplicate/focus invariant сохранён.

147 тестов, TypeScript и официальный build прошли. На том же финальном fixture baseline — 3 FAIL, candidate — 3 PASS. Отдельный isolated Chromium fixture подтвердил неизменные цитаты/прямоугольники/раскрытие/focus и число операций: чтения второй ленты 12 → 0, own feedback 4 → 0. Это не измерение ускорения физического устройства. Стенд конечный, contexts/browser/server закрыты.

Native disposable client подтвердил disclosure/focus и fake likes при 1280/light/en, 390/dark/ru и 320/light/en/200%; на 320/200% native composer закрывает часть длинной цитаты. Первоначальная общая input/no-live-writes гарантия harness отозвана: общего network barrier не было. Core draft точного native bundle сохраняется в localStorage disposable context, но побочные записи соседних observers задним числом не исключены. Прежний ввод не повторялся, remote draft без доказанного before не восстанавливался. Итоговый installed input-check требует barriers.

Подготовлен стабильный source-only artifact с проверенной сборкой и независимыми COW dependencies: 4902 files сверены, 8 внутренних symlinks, общих writable inode нет. Перед записью source/status/jobs подтверждены повторно, install/update jobs пусты. Сохранены 32 persisted settings, `bon-lectures`, collapseToolCalls=true и проверенная копия закрытой disabled DB: 1 пользовательский словарь, 6 liked snapshots, 2 migrations, integrity ok. Read-only Python SQLite source не открылся; исходник не чинили. `lsof` handles пуст, WAL/SHM отсутствуют, copy hash до/после совпал; собственная копия открыта отдельно. Старый backup поверх актуальных данных не применяется. Установка пока не объявлена выполненной; terminal job и отдельный read-back записываются следующим дополнением.

## Установка и отдельная проверка результата

Штатная same-id path-установка завершена: job `7ee6f108-5cd4-4bc2-ba25-db98cc9b3484` — succeeded. Затем Minus включён, status running, bundle `1b0e651d4fde8389`, errorCount 0. Source — стабильный `minus-responsiveness-artifact` в согласованном storage заказчика. Рабочий BB не перезапускался; других плагинов, SDK, vendor/cache и пользовательских данных writer не менял. Merge/PR ещё не выполнены.

Штатная пересборка path-source изменила generated CSS относительно проверки в полном checkout: истории и `.context` не входят в export, поэтому Tailwind исключил лишние utilities/property defaults. app.js и server.js остались побайтно прежними. После падения hash assert shell ошибочно выполнил следующую enable-команду; ошибка последовательности прямо сообщена владельцу и ревьюеру. Дальнейшие зависимые действия остановлены до адресного [CSS-ревью](verification/2026-11-04-responsiveness/installed-css-review.json). Ревью не нашло подтверждённого CSS дефекта и разрешило конечную проверку этой редакции без повторной установки/reload. Served JS SHA256 `9ce8b07ac5f282e46cffcc920617951ad072a3929b77e3e2ad60ff2210806892`, CSS `090cc1d729d0bcfa01af5e827a22c445ceaef669a4356b958ee37606cc19fcca`.

Отдельное чтение до и после защищённого installed UI подтвердило прежние fingerprints всех таблиц, settings/KV/schedules: 32 настройки, выбранный BON, 1 пользовательский словарь, 6 лайков и 2 migrations. См. [installation summary](verification/2026-11-04-responsiveness/installation-summary.json). Backup не восстанавливался, code rollback не понадобился.

[Installed UI summary](verification/2026-11-04-responsiveness/ui-summary.json): 1280 light и 390 dark — ввод с клавиатуры и восстановление известного исходного пустого draft собственного disposable context, wheel, Enter раскрыть/свернуть с сохранением focus, счётчик без времени и отсутствие горизонтального overflow. Общий HTTP mutation barrier и блокирование всех outgoing WebSocket frames установлены до навигации; по source разрешены только read-only RPC нужных расширений. Все exact bundles Minus/Routines/Sidebar/GenUI/Suggestion Chips загружены. После первого protected input шага read allowlist Sidebar уточнён по source; ввод не повторяли. GenUI card actions и unrestricted realtime feedback остаются непроверенными. Физический Mac и Safari телефона принимает владелец отдельно; headless не выдаётся за их проверку. Contexts/browser закрыты.

Применены `impeccable` Operate/optimize: измерен конкретный лишний обход, сохранена геометрия/клавиатура, проверены finite transitions и освобождение ресурсов. Context разрешил scoped refinement существующего интерфейса без нового PRODUCT/DESIGN. `frontend-design`: действующий restrained native стиль, плотность, серый текст и красное сердце сохраняются; новая визуальная система не вводилась. `bb-plugin-workflow`/authoring: официальный SDK, неизменный pin, lifecycle и отдельные стадии source/test/build/review/install/read-back. Полные [147 тестов](verification/2026-11-04-responsiveness/tests.junit.xml), [операционные измерения](verification/2026-11-04-responsiveness/operation-counts.json), [source hashes](verification/2026-11-04-responsiveness/source-hashes.json), [независимое source review](verification/2026-11-04-responsiveness/review.json), [TypeScript](verification/2026-11-04-responsiveness/tsc.txt), [build](verification/2026-11-04-responsiveness/build.log).

Причина всех первоначальных зависаний не установлена. Исправление доказанно сокращает собственную лишнюю работу Minus; отсутствие такой работы не гарантирует отсутствие других причин. Физические наблюдения и окончательная совместная проверка заказчика остаются открыты. Публикация отдельного PR ждёт точного согласования title/body, merge не разрешён. При подтверждённой регрессии обратный путь — прежний source code-only с сохранением новейших данных либо штатное отключение; общий runtime не останавливается.
