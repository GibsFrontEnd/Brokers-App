import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  History,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApiBaseUrl } from "../../utils/config";

const getToken = () =>
  localStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("token");

// The API answers with a plain list, { data: [...] } or { count }.
const countOf = (data) => {
  if (Array.isArray(data)) return data.length;
  if (Array.isArray(data?.data)) return data.data.length;
  if (typeof data?.count === "number") return data.count;
  return 0;
};

const listOf = (data) =>
  Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
        ? data.items
        : [];

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const SHORTCUTS = [
  { to: "/admin/users/agents-brokers?new=1", label: "Add super agent", text: "Onboard a new agent", icon: UserPlus, tone: "bg-blue-50 text-blue-700" },
  { to: "/admin/pin-allocation", label: "Allocate PINs", text: "Send PINs to agents", icon: KeyRound, tone: "bg-amber-50 text-amber-700" },
  { to: "/admin/agent-pin-balance", label: "PIN balances", text: "What each agent holds", icon: Wallet, tone: "bg-emerald-50 text-emerald-700" },
  { to: "/admin/reports", label: "Certificates", text: "Certificate period report", icon: BarChart3, tone: "bg-violet-50 text-violet-700" },
  { to: "/admin/user-activity-logs", label: "Activity logs", text: "Who did what, when", icon: History, tone: "bg-sky-50 text-sky-700" },
  { to: "/admin/security", label: "Security", text: "Users, roles, permissions", icon: ShieldCheck, tone: "bg-slate-100 text-slate-700" },
];

const StatCard = ({ label, value, hint, icon, tone, loading, to }) => {
  const Icon = icon;
  return (
  <Link
    to={to}
    className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5"
  >
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
    </div>
    {loading ? (
      <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" />
    ) : (
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value ?? "–"}</p>
    )}
    <p className="mt-1 text-xs text-slate-500">{hint}</p>
  </Link>
  );
};

const AdminOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ superAgents: null, subAgents: null });
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState([]);
  const [pinAccess, setPinAccess] = useState("ok"); // ok | denied | failed

  const API_BASE_URL = getApiBaseUrl();

  const load = useCallback(async () => {
    setLoading(true);
    setFailed([]);
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    };
    const get = async (path) => {
      const response = await fetch(`${API_BASE_URL}${path}`, { headers });
      if (!response.ok) {
        const err = new Error(`${path} returned ${response.status}`);
        err.status = response.status;
        throw err;
      }
      return response.json();
    };

    // Each figure loads on its own, so one failing endpoint does not hide the others.
    // The same endpoints as the Super agents and Sub agents pages, so the counts match those lists.
    // /Pin/pending has been failing with a server error (500). When it does, take the
    // pending requests from the full allocation history instead.
    const getPending = async () => {
      try {
        return listOf(await get("/Pin/pending"));
      } catch (err) {
        if (err.status === 403 || err.status === 404) throw err;
        console.warn("Pending PIN approvals:", err.message, "- using /Pin/allocations instead");
        const all = await get("/Pin/allocations");
        return listOf(all).filter((a) => String(a.status || "").toLowerCase() === "pending");
      }
    };

    const [brokers, clients, pins] = await Promise.allSettled([
      get("/Auth/brokers"),
      get("/Auth/clients"),
      getPending(),
    ]);

    // The API answers 404 when nothing is pending, and 403 when this account may not see PIN requests.
    const pinStatus = pins.status === "rejected" ? pins.reason?.status : null;
    if (pins.status === "rejected") console.warn("Pending PIN approvals:", pins.reason?.message);

    setStats({
      superAgents: brokers.status === "fulfilled" ? countOf(brokers.value) : null,
      subAgents: clients.status === "fulfilled" ? countOf(clients.value) : null,
    });
    setPending(pins.status === "fulfilled" ? pins.value : []);
    setPinAccess(pinStatus === 403 ? "denied" : pinStatus && pinStatus !== 404 ? "failed" : "ok");
    setFailed(
      [
        brokers.status === "rejected" && "super agents",
        clients.status === "rejected" && "sub agents",
        pinStatus && pinStatus !== 404 && pinStatus !== 403 && "pending PIN approvals",
      ].filter(Boolean),
    );
    setLoading(false);
  }, [API_BASE_URL]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingPins = pending.reduce((sum, p) => sum + (Number(p.pinAmount) || 0), 0);
  const pinsLoaded = pinAccess === "ok";

  return (
    <div>
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#155dfd]">
            {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {greeting()}
            {user?.username ? <span className="capitalize">, {user.username}</span> : ""}
          </h1>
          <p className="mt-1 text-slate-600">Here is how your agent network stands today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/users/agents-brokers?new=1"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <UserPlus className="h-4 w-4" />
            Add super agent
          </Link>
          <Link
            to="/admin/pin-allocation"
            className="inline-flex items-center gap-2 rounded-lg bg-[#155dfd] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-[#0f4bd1]"
          >
            <KeyRound className="h-4 w-4" />
            Allocate PINs
          </Link>
        </div>
      </div>

      {failed.length > 0 && !loading && (
        <div role="alert" className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>Could not load {failed.join(", ")}.</span>
          <button type="button" onClick={load} className="inline-flex shrink-0 items-center gap-1.5 font-semibold hover:underline">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Numbers */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          to="/admin/users/agents-brokers"
          label="Super agents"
          value={stats.superAgents?.toLocaleString()}
          hint="Registered brokers"
          icon={Users}
          tone="bg-blue-50 text-blue-700"
          loading={loading}
        />
        <StatCard
          to="/admin/users/clients"
          label="Sub agents"
          value={stats.subAgents?.toLocaleString()}
          hint="Under all super agents"
          icon={Users}
          tone="bg-violet-50 text-violet-700"
          loading={loading}
        />
        <StatCard
          to="/admin/pin-allocation"
          label="Awaiting approval"
          value={pinsLoaded ? pending.length.toLocaleString() : null}
          hint="PIN allocation requests"
          icon={Clock}
          tone="bg-amber-50 text-amber-700"
          loading={loading}
        />
        <StatCard
          to="/admin/pin-allocation"
          label="PINs on hold"
          value={pinsLoaded ? pendingPins.toLocaleString() : null}
          hint="In those pending requests"
          icon={KeyRound}
          tone="bg-emerald-50 text-emerald-700"
          loading={loading}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pending PIN approvals */}
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Waiting for your approval</h2>
              <p className="text-xs text-slate-500">PIN allocation requests not yet approved</p>
            </div>
            <Link to="/admin/pin-allocation" className="inline-flex items-center gap-1 text-sm font-medium text-[#155dfd] hover:underline">
              Review all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-4 sm:px-6">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                  </div>
                </li>
              ))}
            </ul>
          ) : pending.length > 0 ? (
            <div className="border-t border-slate-100">
              <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_7rem] gap-3 bg-slate-50 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
                <span>Agent</span>
                <span>Requested by</span>
                <span>Date</span>
                <span className="text-right">PINs</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {pending.slice(0, 6).map((p, i) => (
                  <li
                    key={p.allocationId ?? i}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3.5 sm:px-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_7rem]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
                        <KeyRound className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {p.toUserName || p.toUserId || "Unknown agent"}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {p.allocationId ? `Request #${p.allocationId}` : p.toUserId}
                        </span>
                      </span>
                    </span>
                    <span className="order-last col-span-2 truncate text-xs text-slate-500 md:order-none md:col-span-1 md:text-sm md:text-slate-700">
                      {p.fromUserName || p.fromUserId || "–"}
                      <span className="md:hidden">{p.allocatedDate ? ` · ${formatDate(p.allocatedDate)}` : ""}</span>
                    </span>
                    <span className="hidden truncate text-sm text-slate-700 md:block">{formatDate(p.allocatedDate) || "–"}</span>
                    <span className="text-right text-sm font-semibold text-slate-900">
                      {(Number(p.pinAmount) || 0).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="border-t border-slate-100 px-6 py-14 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <p className="mt-4 font-semibold text-slate-900">
                {pinAccess === "ok" ? "Nothing waiting" : pinAccess === "denied" ? "No access to PIN requests" : "Could not load requests"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {pinAccess === "ok"
                  ? "Every PIN allocation request has been dealt with."
                  : pinAccess === "denied"
                    ? "Your account needs permission to view pending PIN allocations."
                    : "Use Retry above to try again."}
              </p>
            </div>
          )}
        </section>

        {/* Shortcuts */}
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
          <p className="text-xs text-slate-500">The tasks you reach for most</p>
          <ul className="mt-4 space-y-2">
            {SHORTCUTS.map((a) => (
              <li key={a.to}>
                <Link
                  to={a.to}
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${a.tone}`}>
                    <a.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{a.label}</span>
                    <span className="block truncate text-xs text-slate-500">{a.text}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#155dfd]" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AdminOverview;
