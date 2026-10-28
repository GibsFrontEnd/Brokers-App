// Table or card view for list pages (see ViewToggle in PageKit).
import { useState } from "react";

/**
 * "table" or "cards" for a list page, remembered in this browser under `key`.
 * Phones always get cards; the choice applies from large screens up.
 */
export const useViewMode = (key, initial = "table") => {
  const storageKey = `viewMode:${key}`;
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === "cards" || saved === "table" ? saved : initial;
    } catch {
      return initial;
    }
  });
  const change = (next) => {
    setMode(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Storage can be blocked (private window); the choice then lasts for this visit only.
    }
  };
  return [mode, change];
};

// Classes for the list under a toolbar: table rows on large screens, or a grid of cards.
export const cardListCls = (mode) =>
  mode === "cards"
    ? "grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3"
    : "divide-y divide-slate-100 lg:hidden";

export const cardItemCls = (mode) =>
  mode === "cards"
    ? "flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
    : "p-4";
