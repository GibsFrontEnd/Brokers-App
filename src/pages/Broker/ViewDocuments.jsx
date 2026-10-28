import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarDays, FileText, FolderOpen, HardDrive, Inbox } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import { EmptyState, ErrorState, LoadingState, PageHeader, Pager, SearchInput, StatusPill, ViewToggle } from "../../components/UI/PageKit";
import { cardItemCls, cardListCls, useViewMode } from "../../components/UI/viewMode";

const formatDate = (value) => {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const toneOf = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("inactive") || s.includes("rejected")) return "red";
  if (s.includes("active") || s.includes("processed")) return "green";
  if (s.includes("pending") || s.includes("processing")) return "amber";
  return "slate";
};

const ViewDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [view, setView] = useViewMode("documents");

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("You are not signed in. Please sign in again.");
        const response = await axios.get(`${getApiBaseUrl()}/AttachDocs`, {
          headers: { accept: "text/plain", Authorization: `Bearer ${token}` },
          timeout: 15000,
        });
        const data = Array.isArray(response.data) ? response.data : response.data?.data;
        if (!Array.isArray(data)) throw new Error("The server sent documents in a form this page does not understand.");
        setDocuments(data);
      } catch (err) {
        console.error("API Error:", err);
        const status = err.response?.status;
        setError(
          status === 401
            ? "Your session has expired. Please sign out and sign in again."
            : status === 403
              ? "You don't have permission to view documents."
              : err.code === "ECONNABORTED"
                ? "The server took too long to answer. Check your connection and try again."
                : status >= 500
                  ? "The server had a problem. Please try again later."
                  : err.response?.data?.message || err.message || "Could not load the documents.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = documents.filter((d) => !d.deleted);
    if (!q) return list;
    return list.filter((d) => [d.docDetails, d.docTypes, d.docFrom, d.docNo].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [documents, search]);

  if (loading) return <LoadingState label="Loading documents…" />;
  if (error) return <ErrorState title="Could not load the documents" message={error} onRetry={() => setReloadKey((k) => k + 1)} />;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Documents attached to your account." />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:px-6 md:flex-row md:items-center">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by title, type, source or number"
            className="md:max-w-md md:flex-1"
          />
          <ViewToggle value={view} onChange={setView} className="hidden lg:ml-auto lg:inline-flex" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={search ? Inbox : FolderOpen} title={search ? "No documents match" : "No documents yet"} text={search ? "Try a different search." : "Documents attached to your account will appear here."} />
        ) : (
          <>
            <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Document</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">From</th>
                    <th className="px-4 py-3">Added</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((d, i) => (
                    <tr key={d.attachId ?? i} className="hover:bg-slate-50/70">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#155dfd]">
                            <FileText className="h-[18px] w-[18px]" />
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[20rem] truncate font-semibold text-slate-900">{d.docDetails || "Untitled document"}</p>
                            <p className="text-xs text-slate-500">{d.docNo || "–"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{d.docTypes || "–"}</td>
                      <td className="px-4 py-3.5 text-slate-700">{d.docFrom || "–"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{formatDate(d.entryDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{d.zDocuments || "–"}</td>
                      <td className="px-6 py-3.5">
                        <StatusPill tone={toneOf(d.mailStatus)}>{d.mailStatus || "Unknown"}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className={cardListCls(view)}>
              {rows.map((d, i) => (
                <li key={d.attachId ?? i} className={cardItemCls(view)}>
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#155dfd]">
                      <FileText className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{d.docDetails || "Untitled document"}</p>
                      <p className="text-xs text-slate-500">
                        {d.docNo || "–"} · {d.docTypes || "Document"}
                      </p>
                    </div>
                    <StatusPill tone={toneOf(d.mailStatus)}>{d.mailStatus || "Unknown"}</StatusPill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <FolderOpen className="h-3.5 w-3.5" />
                      {d.docFrom || "Unknown source"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(d.entryDate)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <HardDrive className="h-3.5 w-3.5" />
                      {d.zDocuments || "–"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <Pager
              page={current}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={(n) => {
                setPageSize(n);
                setPage(1);
              }}
              noun="documents"
            />
          </>
        )}
      </section>
    </div>
  );
};

export default ViewDocuments;
