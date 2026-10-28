// src/pages/Certificates.jsx
// Certificates issued under the company. The list comes from the parent dashboard (Company or Admin).
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { Clock, FileCheck2, FileText, RefreshCw, Wallet } from "lucide-react";
import { EmptyState, PageHeader, Pager, SearchInput, StatTile, StatusPill, ViewToggle, btnSecondary, iconBtn } from "../../components/UI/PageKit";
import { cardItemCls, cardListCls, useViewMode } from "../../components/UI/viewMode";

// The dashboard keeps the raw API fields on each certificate: status is in "tag", premium in "grossPrenium".
const statusOf = (c) => String(c.tag || c.status || "PENDING").toUpperCase();
const premiumOf = (c) => Number(c.grossPrenium ?? c.grossPremium) || 0;
const naira = (n) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
const statusTone = (s) => (s === "PENDING" ? "amber" : ["REJECTED", "CANCELLED"].includes(s) ? "red" : "green");
const formatDate = (value) => {
  const d = new Date(value);
  return value && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "–";
};

const Certificates = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePrefix = location.pathname.startsWith("/admin") ? "/admin/company" : "/company";
  const { certificates = [], fetchCertificates, isProcessing } = useOutletContext() || {};
  const [view, setView] = useViewMode("company-certificates");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Search the fields certificates actually have (the old page looked for a "clientName" that does not exist).
  const q = searchTerm.trim().toLowerCase();
  const filtered = certificates.filter(
    (c) => !q || [c.certNo, c.insuredName, c.policyNo, c.brokerId].some((v) => String(v || "").toLowerCase().includes(q)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pending = certificates.filter((c) => statusOf(c) === "PENDING").length;
  const premium = certificates.reduce((sum, c) => sum + premiumOf(c), 0);
  const open = (c) => navigate(`${basePrefix}/certificates/${encodeURIComponent(c.certNo)}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates"
        description="Motor certificates issued under your company."
        actions={
          fetchCertificates && (
            <button type="button" onClick={fetchCertificates} disabled={isProcessing} className={btnSecondary}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label="Certificates" value={certificates.length.toLocaleString()} hint="Issued under your company" icon={FileCheck2} />
        <StatTile label="Pending" value={pending.toLocaleString()} hint="Waiting for a decision" icon={Clock} tone="bg-amber-50 text-amber-700" />
        <StatTile label="Premium" value={naira(premium)} hint="Across all certificates" icon={Wallet} tone="bg-emerald-50 text-emerald-700" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-6">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by certificate, insured, policy or agent" className="sm:max-w-sm sm:flex-1" />
          <span className="text-sm text-slate-500 sm:ml-auto">
            {filtered.length} certificate{filtered.length === 1 ? "" : "s"}
          </span>
          <ViewToggle value={view} onChange={setView} className="hidden lg:inline-flex" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title={q ? "No certificates match" : "No certificates yet"} text={q ? "Try a different search." : "Certificates your agents issue will show up here."} />
        ) : (
          <>
            <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Certificate</th>
                    <th className="px-4 py-3">Insured</th>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Premium</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((c) => (
                    <tr key={c.id || c.certNo} onClick={() => open(c)} className="cursor-pointer hover:bg-slate-50/70">
                      <td className="px-6 py-3">
                        <p className="font-mono text-[13px] font-semibold text-slate-900">{c.certNo}</p>
                        <p className="text-xs text-slate-500">{c.policyNo || "No policy number"}</p>
                      </td>
                      <td className="max-w-[14rem] truncate px-4 py-3 text-slate-700">{c.insuredName || "–"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{c.brokerId || "–"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(c.transDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">{naira(premiumOf(c))}</td>
                      <td className="px-4 py-3">
                        <StatusPill tone={statusTone(statusOf(c))}>{statusOf(c)}</StatusPill>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link to={`${basePrefix}/certificates/${encodeURIComponent(c.certNo)}`} onClick={(e) => e.stopPropagation()} className={`${iconBtn} inline-grid`} aria-label="Open">
                          <FileText className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className={cardListCls(view)}>
              {rows.map((c) => (
                <li key={c.id || c.certNo} onClick={() => open(c)} className={`${cardItemCls(view)} cursor-pointer`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{c.insuredName || "Unnamed insured"}</p>
                      <p className="font-mono text-xs text-slate-500">{c.certNo}</p>
                    </div>
                    <StatusPill tone={statusTone(statusOf(c))}>{statusOf(c)}</StatusPill>
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-slate-500">Agent</dt>
                    <dd className="text-slate-700">{c.brokerId || "–"}</dd>
                    <dt className="text-slate-500">Date</dt>
                    <dd className="text-slate-700">{formatDate(c.transDate)}</dd>
                    <dt className="text-slate-500">Premium</dt>
                    <dd className="font-semibold text-slate-900">{naira(premiumOf(c))}</dd>
                  </dl>
                </li>
              ))}
            </ul>

            <Pager
              page={page}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={pageSize}
              onPage={(n) => setPage(Math.max(1, Math.min(n, totalPages)))}
              onPageSize={(n) => {
                setPageSize(n);
                setPage(1);
              }}
              noun="certificates"
            />
          </>
        )}
      </section>
    </div>
  );
};

export default Certificates;
