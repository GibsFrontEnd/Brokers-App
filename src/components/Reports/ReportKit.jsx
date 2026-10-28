// The shared look of the report screens: filters on the left, what the file holds and the last run on the right.
import { Toaster } from "react-hot-toast";
import { CheckCircle2, Download, FileSpreadsheet, Filter, Loader2, Table2 } from "lucide-react";
import { Field, btnPrimary, inputCls } from "../UI/PageKit";
import { DATE_PRESETS, presetRange } from "./dateRange";

/** The toast messages, in the app's style. */
export const ReportToaster = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 4000,
      style: {
        background: "#fff",
        color: "#0f172a",
        border: "1px solid #e2e8f0",
        borderRadius: "0.75rem",
        boxShadow: "0 10px 25px -5px rgb(15 23 42 / 0.15)",
        fontSize: "0.875rem",
      },
      success: { duration: 3000, iconTheme: { primary: "#10b981", secondary: "#fff" } },
      error: { iconTheme: { primary: "#e11d48", secondary: "#fff" } },
      loading: { duration: Infinity },
    }}
  />
);

/** From / To date inputs with quick ranges. Pass optional to say an empty range means all dates. */
export const DateRangeFields = ({ from, to, onChange, optional = false }) => {
  const active = DATE_PRESETS.find((p) => {
    const r = presetRange(p.key);
    return r && r.from === from && r.to === to;
  })?.key;

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={optional ? "From (optional)" : "From"}>
          <input type="date" value={from} max={to || undefined} onChange={(e) => onChange({ from: e.target.value, to })} className={inputCls} />
        </Field>
        <Field label={optional ? "To (optional)" : "To"}>
          <input type="date" value={to} min={from || undefined} onChange={(e) => onChange({ from, to: e.target.value })} className={inputCls} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-slate-500">Quick range:</span>
        {DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(presetRange(p.key))}
            aria-pressed={active === p.key}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
              active === p.key ? "bg-[#155dfd] text-white ring-[#155dfd]" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
        {optional && (from || to) && (
          <button type="button" onClick={() => onChange({ from: "", to: "" })} className="ml-1 text-xs font-medium text-[#155dfd] hover:underline">
            All dates
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * A report screen. `columns` lists what the downloaded file contains; `lastRun` is
 * { count, noun, at } after a successful download.
 */
export const ReportLayout = ({ icon = FileSpreadsheet, title, description, columns = [], lastRun, loading, onGenerate, note, children }) => {
  const Icon = icon;
  return (
    <div className="space-y-6">
      <ReportToaster />

      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#155dfd] text-white shadow-md shadow-blue-600/20">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#155dfd]">Reports</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-slate-600">{description}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <Filter className="h-4 w-4 text-[#155dfd]" />
              <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
            </div>
            {note && <span className="text-xs text-slate-500">{note}</span>}
          </div>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">{children}</div>
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-slate-500">The report downloads as an Excel file (.xlsx).</p>
            <button type="button" onClick={onGenerate} disabled={loading} className={btnPrimary}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {loading ? "Preparing report…" : "Download Excel"}
            </button>
          </div>
        </section>

        {/* What is in the file, and the last run */}
        <div className="space-y-6">
          {lastRun && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Last download</p>
                  {lastRun.count == null ? (
                    <p className="mt-0.5 text-sm font-medium text-slate-700">{lastRun.noun} downloaded</p>
                  ) : (
                    <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                      {Number(lastRun.count).toLocaleString()} <span className="text-sm font-medium text-slate-600">{lastRun.noun}</span>
                    </p>
                  )}
                  <p className="text-xs text-emerald-800/80">
                    {lastRun.at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} today
                  </p>
                </div>
              </div>
            </section>
          )}

          {columns.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
                <Table2 className="h-4 w-4 text-[#155dfd]" />
                <h2 className="text-sm font-semibold text-slate-900">In the file</h2>
              </div>
              <ul className="flex flex-wrap gap-1.5 p-5">
                {columns.map((c) => (
                  <li key={c} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {c}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
