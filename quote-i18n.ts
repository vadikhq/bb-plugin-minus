export type QuoteLanguage = "en" | "ru";
export const quoteLanguage = (selection: { language?: unknown } | undefined, failed: boolean): QuoteLanguage => !failed && selection?.language === "ru" ? "ru" : "en";
const en = {
  like: "Like quote", unlike: "Unlike quote", loading: "Loading liked quotes…", saving: "Saving like…",
  retry: "Retry saving", loadError: "Could not load liked quotes.", saveError: "Could not save this like. Press the heart to retry.",
  reload: "Retry loading", favorites: "Liked quotes", empty: "No liked quotes yet.", hint: "Press the heart beside a quote in the chat to save it here.",
  settings: "Minus settings", expand: "Expand tools", collapse: "Collapse tools",
  actions: "Quote actions", copy: "Copy quote", copied: "Copied", copyRetry: "Retry", copying: "Copying quote…",
  copySuccess: "Quote copied", copyError: "Could not copy the quote. Choose Retry.",
  hideQuote: "Hide from rotation", flagQuote: "Bad quote", hiddenQuote: "Hidden from rotation", flaggedQuote: "Marked for review",
  feedbackSaving: "Saving quote action…", feedbackError: "Could not save. Choose the action again to retry.",
  retryHide: "Retry hiding", retryFlag: "Retry marking",
  hiddenQuotes: "Hidden quotes", flaggedQuotes: "Quotes to review", restoreQuote: "Remove hide", unflagQuote: "Remove flag",
  feedbackLoading: "Loading quote actions…", feedbackLoadError: "Could not load quote actions.",
  feedbackEmpty: "No hidden or flagged quotes yet.",
  pending: "Running", completed: "Completed", error: "Completed with errors", cancelled: "Stopped", unknown: "Checking tool status",
};
const ru: typeof en = {
  like: "Нравится цитата", unlike: "Убрать лайк", loading: "Загружаются понравившиеся цитаты…", saving: "Лайк сохраняется…",
  retry: "Повторить сохранение", loadError: "Не удалось загрузить понравившиеся цитаты.", saveError: "Не удалось сохранить лайк. Нажмите на сердечко, чтобы повторить.",
  reload: "Повторить загрузку", favorites: "Понравившиеся цитаты", empty: "Пока нет понравившихся цитат.", hint: "Нажмите на сердечко рядом с цитатой в чате — она появится здесь.",
  settings: "Настройки Minus", expand: "Раскрыть инструменты", collapse: "Свернуть инструменты",
  actions: "Действия с цитатой", copy: "Копировать цитату", copied: "Скопировано", copyRetry: "Повторить", copying: "Цитата копируется…",
  copySuccess: "Цитата скопирована", copyError: "Не удалось скопировать цитату. Нажмите «Повторить».",
  hideQuote: "Скрыть из показа", flagQuote: "Плохая цитата", hiddenQuote: "Скрыта из показа", flaggedQuote: "Помечена на вычитку",
  feedbackSaving: "Действие сохраняется…", feedbackError: "Не удалось сохранить. Нажмите на действие ещё раз.",
  retryHide: "Повторить скрытие", retryFlag: "Повторить пометку",
  hiddenQuotes: "Скрытые цитаты", flaggedQuotes: "Цитаты на вычитку", restoreQuote: "Снять скрытие", unflagQuote: "Снять пометку",
  feedbackLoading: "Загружаются действия с цитатами…", feedbackLoadError: "Не удалось загрузить действия с цитатами.",
  feedbackEmpty: "Скрытых и помеченных цитат пока нет.",
  pending: "Выполняется", completed: "Завершено", error: "Завершено с ошибками", cancelled: "Остановлено", unknown: "Статус выполнения уточняется",
};
export const quoteStrings = (language: QuoteLanguage) => language === "ru" ? ru : en;
export const toolCount = (count: number, language: QuoteLanguage) => new Intl.NumberFormat(language).format(count) + (language === "ru" ? " инстр." : count === 1 ? " tool" : " tools");
