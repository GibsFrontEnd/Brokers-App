import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Pencil, Plus, Trash2, UserCheck, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApiBaseUrl } from "../../utils/config";
import EditClient from "./EditClient";
import { useConfirm } from "../../components/UI/useConfirm";
import {
  Avatar,
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
  PageHeader,
  Pager,
  SearchInput,
  StatTile,
  StatusPill,
  ViewToggle,
  btnPrimary,
  btnSecondary,
  iconBtn,
} from "../../components/UI/PageKit";
import { cardItemCls, cardListCls, useViewMode } from "../../components/UI/viewMode";

const formatDate = (value) => {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const statusOf = (c) => String(c.status || "ACTIVE").toUpperCase();

export default function Clientlist() {
  const location = useLocation();
  const basePrefix = location.pathname.split("/client-management")[0];
  const { user } = useAuth();
  const [confirm, confirmDialog] = useConfirm();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [view, setView] = useViewMode("company-sub-agents");
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", ...(user?.token && { Authorization: `Bearer ${user.token}` }) }),
    [user],
  );

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${getApiBaseUrl()}/InsuredClients`, { headers });
        if (!response.ok) throw new Error(`Failed to fetch sub agents: ${response.status} ${response.statusText}`);
        const data = await response.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : data ? [data] : [];
        setClients(list.filter(Boolean));
      } catch (err) {
        console.error("Error fetching clients:", err);
        setError(err.message || "Failed to fetch sub agents");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [headers, reloadKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.insuredId, c.insuredName, c.email, c.mobilePhone, c.brokerId, c.contactPerson].some((v) => String(v || "").toLowerCase().includes(q)),
    );
  }, [clients, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);
  const active = clients.filter((c) => statusOf(c) === "ACTIVE").length;

  const handleDelete = async (c) => {
    const ok = await confirm({
      title: "Delete this sub agent?",
      message: `${c.insuredName || c.insuredId} will be removed for good. This cannot be undone.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    setDeleting(c.insuredId);
    setMessage(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/InsuredClients/${c.insuredId}`, { method: "DELETE", headers });
      if (!response.ok) throw new Error(`The server returned ${response.status}.`);
      setClients((prev) => prev.filter((x) => x.insuredId !== c.insuredId));
      setMessage({ tone: "success", text: `${c.insuredName || c.insuredId} was deleted.` });
    } catch (err) {
      console.error("Error deleting client:", err);
      setMessage({ tone: "error", text: `Could not delete ${c.insuredName || c.insuredId}: ${err.message}` });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <LoadingState label="Loading sub agents…" />;
  if (error) return <ErrorState title="Could not load the sub agents" message={error} onRetry={() => setReloadKey((k) => k + 1)} />;

  const actions = (c) => (
    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={() => setEditId(c.insuredId)} title="Edit" aria-label="Edit" className={iconBtn}>
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => handleDelete(c)}
        disabled={deleting === c.insuredId}
        title="Delete"
        aria-label="Delete"
        className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const pill = (c) => <StatusPill tone={statusOf(c) === "ACTIVE" ? "green" : "slate"}>{statusOf(c) === "ACTIVE" ? "Active" : statusOf(c).charAt(0) + statusOf(c).slice(1).toLowerCase()}</StatusPill>;

  return (
    <div className="space-y-6">
      {confirmDialog}
      <PageHeader
        title="Sub agents"
        description="Every sub agent registered on the portal."
        actions={
          <Link to={`${basePrefix}/client-management/add-client`} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Add sub agent
          </Link>
        }
      />

      {message && (
        <Notice tone={message.tone} onClose={() => setMessage(null)}>
          {message.text}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <StatTile label="Sub agents" value={clients.length.toLocaleString()} hint="Registered" icon={Users} />
        <StatTile label="Active" value={active.toLocaleString()} hint="Can use the portal" icon={UserCheck} tone="bg-emerald-50 text-emerald-700" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:px-6 md:flex-row md:items-center">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by name, ID, email, phone or super agent"
            className="md:max-w-md md:flex-1"
          />
          <ViewToggle value={view} onChange={setView} className="hidden lg:ml-auto lg:inline-flex" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? "No sub agents match" : "No sub agents yet"}
            text={search ? "Try a different search." : "Sub agents appear here once they are registered."}
            action={
              search ? (
                <button type="button" onClick={() => setSearch("")} className={btnSecondary}>
                  Clear search
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Sub agent</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Super agent</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((c) => (
                    <tr key={c.insuredId} onClick={() => setEditId(c.insuredId)} className="cursor-pointer hover:bg-slate-50/70">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.insuredName} />
                          <div className="min-w-0">
                            <p className="max-w-[16rem] truncate font-semibold text-slate-900">{c.insuredName || "Unnamed"}</p>
                            <p className="text-xs text-slate-500">{c.insuredId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="block max-w-[15rem] truncate text-slate-700">{c.email || "–"}</span>
                        <span className="block text-xs text-slate-500">{c.mobilePhone || "–"}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{c.brokerId || "–"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{formatDate(c.submitDate)}</td>
                      <td className="px-4 py-3.5">{pill(c)}</td>
                      <td className="px-6 py-3.5">{actions(c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className={cardListCls(view)}>
              {rows.map((c) => (
                <li key={c.insuredId} onClick={() => setEditId(c.insuredId)} className={`${cardItemCls(view)} cursor-pointer`}>
                  <div className="flex items-start gap-3">
                    <Avatar name={c.insuredName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{c.insuredName || "Unnamed"}</p>
                      <p className="text-xs text-slate-500">{c.insuredId}</p>
                    </div>
                    {pill(c)}
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="truncate text-slate-700">{c.email || "–"}</dd>
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="text-slate-700">{c.mobilePhone || "–"}</dd>
                    <dt className="text-slate-500">Super agent</dt>
                    <dd className="text-slate-700">{c.brokerId || "–"}</dd>
                    <dt className="text-slate-500">Registered</dt>
                    <dd className="text-slate-700">{formatDate(c.submitDate)}</dd>
                  </dl>
                  <div className="mt-3 border-t border-slate-100 pt-2">{actions(c)}</div>
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
              noun="sub agents"
            />
          </>
        )}
      </section>

      {editId && (
        <EditClient
          inSheet
          clientId={editId}
          onClose={() => setEditId(null)}
          onSaved={(name) => {
            setEditId(null);
            setMessage({ tone: "success", text: `${name || "The sub agent"} was saved.` });
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
