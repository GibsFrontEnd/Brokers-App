// Dates for the report filters, as yyyy-mm-dd in the user's own time zone.
// (toISOString() converts to UTC first, which in Nigeria turns midnight on the 1st into the last day of the
// month before, so it is not used here.)

const pad = (n) => String(n).padStart(2, "0");

export const toInputDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const today = () => toInputDate(new Date());

export const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "thisYear", label: "This year" },
];

/** { from, to } for one of DATE_PRESETS. */
export const presetRange = (key) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case "today":
      return { from: toInputDate(now), to: toInputDate(now) };
    case "yesterday": {
      const d = new Date(y, m, now.getDate() - 1);
      return { from: toInputDate(d), to: toInputDate(d) };
    }
    case "thisMonth":
      return { from: toInputDate(new Date(y, m, 1)), to: toInputDate(new Date(y, m + 1, 0)) };
    case "lastMonth":
      return { from: toInputDate(new Date(y, m - 1, 1)), to: toInputDate(new Date(y, m, 0)) };
    case "thisYear":
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    default:
      return null;
  }
};
