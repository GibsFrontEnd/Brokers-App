// The shared layout of the certificate forms (create motor, create NIIP motor, edit motor):
// sections of fields on the left, a summary with the submit button on the right.
import { ArrowLeft, Loader2 } from "lucide-react";
import { Notice, btnPrimary, btnSecondary } from "../components/UI/PageKit";

/** A titled card of fields. */
export const FormSection = ({ icon, title, text, children, columns = 3 }) => {
  const Icon = icon;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#155dfd]">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {text && <p className="text-xs text-slate-500">{text}</p>}
        </div>
      </div>
      <div className={`grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 ${columns === 3 ? "xl:grid-cols-3" : ""}`}>{children}</div>
    </section>
  );
};

/** A value the user can see but not change (filled in by the system). */
export const ReadOnlyField = ({ label, value, hint, wide }) => (
  <div className={wide ? "sm:col-span-2" : ""}>
    <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
    <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
      {value ? <span className="truncate">{value}</span> : <span className="text-slate-400">{hint || "Filled in for you"}</span>}
    </div>
  </div>
);

/** A line in the summary card. */
export const SummaryRow = ({ label, value, strong }) => (
  <div className="flex items-baseline justify-between gap-3 py-2">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className={`text-right ${strong ? "text-lg font-bold text-slate-900" : "text-sm font-medium text-slate-800"}`}>{value || "–"}</dd>
  </div>
);

/**
 * The page around a certificate form. `summary` is the content of the right-hand card;
 * the form itself has the id `formId` so the submit buttons can sit outside it.
 */
export const PolicyFormPage = ({ title, description, onBack, message, isError, formId, onSubmit, loading, submitLabel, loadingLabel = "Saving…", summary, children }) => {
  const actions = (full) => (
    <>
      <button type="button" onClick={onBack} className={`${btnSecondary} ${full ? "w-full" : ""}`}>
        Cancel
      </button>
      <button type="submit" form={formId} disabled={loading} className={`${btnPrimary} ${full ? "w-full" : ""}`}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? loadingLabel : submitLabel}
      </button>
    </>
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-slate-600">{description}</p>}
      </div>

      {message && <Notice tone={isError ? "error" : "success"}>{message}</Notice>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form id={formId} onSubmit={onSubmit} className="min-w-0 space-y-6">
          {children}
        </form>

        {/* Summary and actions (large screens) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Summary</h2>
              <dl className="mt-2 divide-y divide-slate-100">{summary}</dl>
              <div className="mt-5 flex flex-col gap-2">{actions(true)}</div>
            </section>
          </div>
        </aside>
      </div>

      {/* Actions stay in reach on phones and tablets */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex justify-end gap-2">{actions(false)}</div>
      </div>
    </div>
  );
};
