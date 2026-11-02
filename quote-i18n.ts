export type QuoteLanguage = "en" | "ru";
export const quoteLanguage = (selection: { language?: unknown } | undefined, failed: boolean): QuoteLanguage => !failed && selection?.language === "ru" ? "ru" : "en";
const en = {
  like: "Like quote", unlike: "Unlike quote", loading: "Loading liked quotes…", saving: "Saving like…",
  retry: "Retry saving", loadError: "Could not load liked quotes.", saveError: "Could not save this like. Press the heart to retry.",
  reload: "Retry loading", favorites: "Liked quotes", empty: "No liked quotes yet.", hint: "Press the heart beside a quote in the chat to save it here.",
  settings: "Minus settings", expand: "Expand tools", collapse: "Collapse tools",
  pending: "Running", completed: "Completed", error: "Completed with errors", cancelled: "Stopped", unknown: "Checking tool status",
};
const ru: typeof en = {
  like: "Нравится цитата", unlike: "Убрать лайк", loading: "Загружаются понравившиеся цитаты…", saving: "Лайк сохраняется…",
  retry: "Повторить сохранение", loadError: "Не удалось загрузить понравившиеся цитаты.", saveError: "Не удалось сохранить лайк. Нажмите на сердечко, чтобы повторить.",
  reload: "Повторить загрузку", favorites: "Понравившиеся цитаты", empty: "Пока нет понравившихся цитат.", hint: "Нажмите на сердечко рядом с цитатой в чате — она появится здесь.",
  settings: "Настройки Minus", expand: "Раскрыть инструменты", collapse: "Свернуть инструменты",
  pending: "Выполняется", completed: "Завершено", error: "Завершено с ошибками", cancelled: "Остановлено", unknown: "Статус выполнения уточняется",
};
export const quoteStrings = (language: QuoteLanguage) => language === "ru" ? ru : en;
export const toolCount = (count: number, language: QuoteLanguage) => new Intl.NumberFormat(language).format(count) + (language === "ru" ? " инстр." : count === 1 ? " tool" : " tools");
