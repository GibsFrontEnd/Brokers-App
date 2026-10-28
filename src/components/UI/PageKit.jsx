// Shared building blocks for the signed-in screens, in the same look as the app shell.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LayoutGrid,
  List,
  Lock,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

export const ViewToggle = ({ value, onChange, className = "" }) => (
  <div role="group" aria-label="View" className={`items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 ${className}`}>
    {[
      { key: "table", label: "Table", icon: List },
      { key: "cards", label: "Cards", icon: LayoutGrid },
    ].map((o) => (
      <button
        key={o.key}
        type="button"
        onClick={() => onChange(o.key)}
        aria-pressed={value === o.key}
        title={`${o.label} view`}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition ${
          value === o.key ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <o.icon className="h-4 w-4" />
        {o.label}
      </button>
    ))}
  </div>
);

export const inputCls =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#155dfd] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#155dfd] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-[#0f4bd1] disabled:cursor-not-allowed disabled:opacity-60";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

export const iconBtn =
  "grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900";

export const PageHeader = ({ title, description, actions }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {description && <p className="mt-1 text-slate-600">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const StatTile = ({ label, value, hint, icon, tone = "bg-blue-50 text-blue-700" }) => {
  const Icon = icon;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
};

const PILL_TONES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

const DOT_TONES = {
  green: "bg-emerald-500",
  red: "bg-rose-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  slate: "bg-slate-400",
};

export const StatusPill = ({ tone = "slate", dot = true, children }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${PILL_TONES[tone]}`}
  >
    {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_TONES[tone]}`} />}
    {children}
  </span>
);

export const Avatar = ({ name, className = "h-9 w-9 text-xs" }) => {
  const initials =
    String(name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-100 ${className}`}>
      {initials}
    </span>
  );
};

export const Notice = ({ tone = "success", children, onClose }) => {
  const error = tone === "error";
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ring-1 ${
        error ? "bg-rose-50 text-rose-800 ring-rose-200" : "bg-emerald-50 text-emerald-800 ring-emerald-200"
      }`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${error ? "text-rose-600" : "text-emerald-600"}`} />
      <span className="flex-1">{children}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="-m-1 rounded p-1 opacity-60 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

/** A short message in the top-right corner that goes away by itself after a few seconds. */
export const Toast = ({ message, type = "success", onClose }) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current?.(), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const error = type === "error";
  const Icon = error ? AlertCircle : CheckCircle2;
  return createPortal(
    <div
      role={error ? "alert" : "status"}
      className="sheet-overlay fixed right-4 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl print:hidden sm:right-6 sm:top-6"
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${error ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="flex-1 pt-1 text-sm font-medium text-slate-800">{message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="-m-1 rounded p-1 text-slate-400 hover:text-slate-600">
        <X className="h-4 w-4" />
      </button>
    </div>,
    document.body,
  );
};

export const SearchInput =({ value, onChange, placeholder, className = "" }) => (
  <div className={`relative ${className}`}>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={`${inputCls} pl-9`}
    />
  </div>
);

// Page numbers to show: always the first and last, the current one and its neighbours, "…" between.
const pageList = (page, total) => {
  const pages = [];
  for (let n = 1; n <= total; n++) {
    if (n === 1 || n === total || Math.abs(n - page) <= 1) pages.push(n);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return pages;
};

export const Pager = ({ page, totalPages, total, pageSize, onPage, onPageSize, sizes = [10, 25, 50, 100], noun = "results" }) => {
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Math.max(1, totalPages);
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-center gap-3">
        <span>
          <span className="font-semibold text-slate-900">{from.toLocaleString()}</span>–
          <span className="font-semibold text-slate-900">{to.toLocaleString()}</span> of{" "}
          <span className="font-semibold text-slate-900">{total.toLocaleString()}</span> {noun}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          aria-label="Rows per page"
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#155dfd]"
        >
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>
      </div>
      {pages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page" className={`${iconBtn} disabled:opacity-40`}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageList(page, pages).map((n, i) =>
            n === "…" ? (
              <span key={`gap${i}`} className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPage(n)}
                aria-current={n === page ? "page" : undefined}
                className={`hidden h-8 min-w-8 rounded-lg px-2 text-sm font-medium sm:inline-block ${
                  n === page ? "bg-[#155dfd] text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {n}
              </button>
            ),
          )}
          <span className="px-2 sm:hidden">
            {page} / {pages}
          </span>
          <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page" className={`${iconBtn} disabled:opacity-40`}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
};

export const EmptyState = ({ icon = Inbox, title, text, action }) => {
  const Icon = icon;
  return (
    <div className="px-6 py-14 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-4 font-semibold text-slate-900">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export const LoadingState = ({ label = "Loading…" }) => (
  <div className="grid min-h-[50vh] place-items-center">
    <div className="text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#155dfd] border-t-transparent" />
      <p className="mt-4 text-sm text-slate-500">{label}</p>
    </div>
  </div>
);

export const ErrorState = ({ title = "Something went wrong", message, onRetry }) => (
  <div className="grid min-h-[50vh] place-items-center">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
        <AlertCircle className="h-6 w-6" />
      </span>
      <p className="mt-4 font-semibold text-slate-900">{title}</p>
      {message && <p className="mt-1 text-sm text-slate-500">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${btnPrimary} mt-5`}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  </div>
);

export const AccessDenied = ({ title = "Access denied", message }) => (
  <div className="grid min-h-[60vh] place-items-center">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
        <Lock className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">
        {message || "You don't have permission to view this page. Ask your administrator for access."}
      </p>
      <button type="button" onClick={() => window.history.back()} className={`${btnSecondary} mt-6`}>
        <ArrowLeft className="h-4 w-4" />
        Go back
      </button>
    </div>
  </div>
);

/** A small centred question with Cancel and a confirm button. Use it through useConfirm (UI/useConfirm.jsx). */
export const ConfirmDialog = ({ title, message, confirmLabel = "Confirm", tone = "danger", onConfirm, onCancel }) => {
  const confirmRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });
  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onCancelRef.current?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const danger = tone === "danger";
  return createPortal(
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <div className="sheet-overlay absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div role="alertdialog" aria-modal="true" aria-label={title} className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <span className={`grid h-11 w-11 place-items-center rounded-full ring-8 ${danger ? "bg-rose-50 text-rose-600 ring-rose-50/50" : "bg-blue-50 text-[#155dfd] ring-blue-50/50"}`}>
          <AlertCircle className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
        {message && <p className="mt-1 text-sm leading-relaxed text-slate-500">{message}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className={btnSecondary}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={
              danger
                ? "inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700"
                : btnPrimary
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Shown inside a section when the signed-in user may not do what it is for.
export const PermissionRequired = ({ action }) => (
  <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
      <Lock className="h-5 w-5" />
    </span>
    <p className="mt-4 font-semibold text-slate-900">Permission required</p>
    <p className="mt-1 max-w-sm text-sm text-slate-500">You need permission to {action}. Ask your administrator for access.</p>
  </div>
);

export const Modal =({ title, subtitle, onClose, children, size = "max-w-3xl" }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[90vh] w-full ${size} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={iconBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Field = ({ label, required, wide, children }) => (
  <label className={`block ${wide ? "md:col-span-2" : ""}`}>
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-rose-500"> *</span>}
    </span>
    {children}
  </label>
);

// A titled card of label/value rows, for detail pages.
export const DetailCard = ({ icon, title, children, className = "" }) => {
  const Icon = icon;
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none ${className}`}>
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
        {Icon && <Icon className="h-4 w-4 text-[#155dfd]" />}
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <dl className="divide-y divide-slate-100 px-5">{children}</dl>
    </section>
  );
};

export const DetailRow = ({ label, value, mono, children }) => {
  const shown = children ?? value;
  const empty = shown === null || shown === undefined || shown === "";
  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`break-words font-medium ${empty ? "text-slate-400" : "text-slate-900"} ${mono ? "font-mono tracking-wide" : ""}`}>
        {empty ? "Not provided" : shown}
      </dd>
    </div>
  );
};

/**
 * A panel that slides in from the right, for adding, viewing and editing without leaving the list.
 * Escape, the close button or a click on the dimmed page closes it.
 */
export const Sheet = ({ open, onClose, title, sub, leading, children, footer, size = "md" }) => {
  const panelRef = useRef(null);
  // Kept in a ref so a new onClose on every render does not re-run the setup below (and steal focus).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onCloseRef.current?.();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] print:hidden">
      <div className="sheet-overlay absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`sheet-panel absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl outline-none ${
          size === "lg" ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {leading}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold tracking-tight text-slate-900">{title}</h2>
              {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/50 px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3.5 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};
