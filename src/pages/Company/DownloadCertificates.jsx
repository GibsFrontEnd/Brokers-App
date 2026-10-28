import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, FileText, Files, Loader2, Sheet as SheetIcon } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import { DateRangeFields } from "../../components/Reports/ReportKit";
import { presetRange } from "../../components/Reports/dateRange";
import { naira, shortDate } from "../../shared/policyFormat";
import { EmptyState, ErrorState, LoadingState, Notice, PageHeader, btnPrimary } from "../../components/UI/PageKit";

const FORMATS = [
  { key: "pdf", label: "PDF", text: "A printable list of the certificates.", icon: FileText, tone: "bg-rose-50 text-rose-700" },
  { key: "excel", label: "Excel", text: "A spreadsheet with every field.", icon: FileSpreadsheet, tone: "bg-emerald-50 text-emerald-700" },
  { key: "csv", label: "CSV", text: "Plain values for other systems.", icon: SheetIcon, tone: "bg-blue-50 text-blue-700" },
];

// jsPDF's built-in font has no ₦, so the PDF spells the currency out.
const pdfMoney = (v) => (naira(v) ? naira(v).replace("₦", "NGN ") : "–");

// The columns of the PDF list.
const PDF_COLUMNS = [
  { label: "Certificate no", get: (c) => c.certNo, width: 46 },
  { label: "Insured", get: (c) => c.insuredName, width: 62 },
  { label: "Policy no", get: (c) => c.policyNo, width: 40 },
  { label: "Date", get: (c) => shortDate(c.transDate), width: 28 },
  { label: "Insured value", get: (c) => pdfMoney(c.insuredValue), width: 42, right: true },
  { label: "Premium", get: (c) => pdfMoney(c.grossPrenium), width: 36, right: true },
  { label: "Status", get: (c) => c.tag, width: 22 },
];

// A day as a local date, so a certificate made late on the To date still counts.
const dayStart = (ymd) => new Date(`${ymd}T00:00:00`);
const dayEnd = (ymd) => new Date(`${ymd}T23:59:59.999`);

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const toCSV = (certs) => {
  const keys = Object.keys(certs[0]);
  const cell = (v) => `"${v === null || v === undefined ? "" : String(v).replace(/"/g, '""')}"`;
  return [keys.join(","), ...certs.map((c) => keys.map((k) => cell(c[k])).join(","))].join("\n");
};

const toPDF = (certs, from, to) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = 14;
  let y = 0;

  const header = () => {
    doc.setFillColor(11, 31, 77);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Certificates", left, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${shortDate(from)} to ${shortDate(to)}  ·  ${certs.length} certificate${certs.length === 1 ? "" : "s"}`, pageW - left, 14, { align: "right" });
    y = 32;
    doc.setFillColor(241, 245, 249);
    doc.rect(left, y - 5, pageW - left * 2, 8, "F");
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    let x = left + 2;
    PDF_COLUMNS.forEach((col) => {
      doc.text(col.label.toUpperCase(), col.right ? x + col.width - 4 : x, y, { align: col.right ? "right" : "left" });
      x += col.width;
    });
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
  };

  header();
  certs.forEach((c) => {
    if (y > pageH - 14) {
      doc.addPage();
      header();
    }
    let x = left + 2;
    PDF_COLUMNS.forEach((col) => {
      const raw = String(col.get(c) ?? "–");
      const text = doc.splitTextToSize(raw, col.width - 4)[0] || "–";
      doc.text(text, col.right ? x + col.width - 4 : x, y, { align: col.right ? "right" : "left" });
      x += col.width;
    });
    doc.setDrawColor(226, 232, 240);
    doc.line(left, y + 2.5, pageW - left, y + 2.5);
    y += 7;
  });

  return doc;
};

const DownloadCertificates = () => {
  const location = useLocation();
  // The certificates list of whichever area this page sits in.
  const backLink = location.pathname.replace(/download-certificates\/?$/, "certificates");

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [range, setRange] = useState(() => presetRange("thisMonth"));
  const [format, setFormat] = useState("pdf");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("token");
        if (!token) throw new Error("You are not signed in. Please sign in again.");
        const response = await fetch(`${getApiBaseUrl()}/Certificates`, {
          headers: { accept: "text/plain", Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`The server returned ${response.status}.`);
        const data = await response.json();
        setCertificates(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error("Error fetching certificates:", err);
        setLoadError(err.message || "Could not load the certificates.");
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, [reloadKey]);

  const matching = useMemo(() => {
    if (!range.from || !range.to) return [];
    const start = dayStart(range.from);
    const end = dayEnd(range.to);
    return certificates
      .filter((c) => {
        const d = new Date(c.transDate);
        return !Number.isNaN(d.getTime()) && d >= start && d <= end;
      })
      .sort((a, b) => new Date(b.transDate) - new Date(a.transDate));
  }, [certificates, range]);

  const totals = useMemo(
    () => ({
      value: matching.reduce((s, c) => s + (Number(c.insuredValue) || 0), 0),
      premium: matching.reduce((s, c) => s + (Number(c.grossPrenium) || 0), 0),
    }),
    [matching],
  );

  const handleDownload = () => {
    if (!matching.length) return;
    setBusy(true);
    setMessage(null);
    try {
      const name = `certificates_${range.from}_to_${range.to}`;
      if (format === "pdf") {
        toPDF(matching, range.from, range.to).save(`${name}.pdf`);
      } else if (format === "excel") {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(matching), "Certificates");
        XLSX.writeFile(wb, `${name}.xlsx`);
      } else {
        saveBlob(new Blob([toCSV(matching)], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
      }
      setMessage({ tone: "success", text: `Downloaded ${matching.length} certificate${matching.length === 1 ? "" : "s"}.` });
    } catch (err) {
      console.error("Download error:", err);
      setMessage({ tone: "error", text: `The download failed: ${err.message}` });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label="Loading certificates…" />;
  if (loadError) return <ErrorState title="Could not load the certificates" message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />;

  const chosen = FORMATS.find((f) => f.key === format);
  const preview = matching.slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <Link to={backLink} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to certificates
        </Link>
        <PageHeader title="Download certificates" description="Pick a date range and a format, then download every certificate issued in it." />
      </div>

      {message && (
        <Notice tone={message.tone} onClose={() => setMessage(null)}>
          {message.text}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">1 · Date range</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateRangeFields from={range.from} to={range.to} onChange={setRange} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">2 · Format</p>
            <div role="radiogroup" aria-label="Format" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FORMATS.map((f) => {
                const on = f.key === format;
                return (
                  <button
                    key={f.key}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setFormat(f.key)}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                      on ? "border-[#155dfd] bg-blue-50/60 ring-1 ring-[#155dfd]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${f.tone}`}>
                      <f.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        {f.label}
                        {on && <CheckCircle2 className="h-4 w-4 text-[#155dfd]" />}
                      </span>
                      <span className="block text-xs text-slate-500">{f.text}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 sm:px-6">
              <h2 className="text-sm font-semibold text-slate-900">In this range</h2>
              {matching.length > preview.length && <span className="text-xs text-slate-500">Showing the latest {preview.length} of {matching.length}</span>}
            </div>
            {matching.length === 0 ? (
              <EmptyState icon={Files} title="No certificates in this range" text="Try a wider date range." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {preview.map((c) => (
                  <li key={c.certNo} className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-semibold text-slate-900">{c.certNo}</p>
                      <p className="truncate text-xs text-slate-500">
                        {c.insuredName || "–"} · {shortDate(c.transDate)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-slate-900">{naira(c.grossPrenium)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-[#0b1f4d] to-[#155dfd] p-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">Your download</p>
              <p className="mt-1 text-3xl font-bold">{matching.length.toLocaleString()}</p>
              <p className="text-sm text-blue-100">certificate{matching.length === 1 ? "" : "s"}</p>
            </div>
            <dl className="divide-y divide-slate-100 px-5 text-sm">
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">Range</dt>
                <dd className="text-right font-medium text-slate-900">
                  {shortDate(range.from)} – {shortDate(range.to)}
                </dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">Format</dt>
                <dd className="font-medium text-slate-900">{chosen.label}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">Insured value</dt>
                <dd className="font-medium text-slate-900">{naira(totals.value)}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">Premium</dt>
                <dd className="font-medium text-slate-900">{naira(totals.premium)}</dd>
              </div>
            </dl>
            <div className="p-5 pt-2">
              <button type="button" onClick={handleDownload} disabled={busy || matching.length === 0} className={`${btnPrimary} w-full justify-center`}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {busy ? "Preparing…" : `Download ${chosen.label}`}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DownloadCertificates;
