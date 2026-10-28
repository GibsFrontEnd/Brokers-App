// Formatting for the certificate forms.

export const naira = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && value !== "" && value !== null ? `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}` : null;
};

export const shortDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// Today as yyyy-mm-dd in the user's own time zone (toISOString would give the UTC date).
export const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
