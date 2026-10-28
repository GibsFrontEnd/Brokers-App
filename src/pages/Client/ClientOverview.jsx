// The sub agent's home page: PINs and certificates at a glance.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Car, Clock, FilePlus2, FileText, KeyRound, RefreshCw, UserRound, Wallet } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PinService from "../../services/PinServices";
import { getApiBaseUrl } from "../../utils/config";
import { StatusPill } from "../../components/UI/PageKit";

const getToken = () => localStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("token");

const listOf = (data) => (Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : []);

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

const naira = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}` : "–";
};

const formatDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "–" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const statusTone = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return "amber";
  if (["REJECTED", "CANCELLED", "EXPIRED"].includes(s)) return "red";
  return "green";
};

const ACTIONS = [
  { to: "/client/certificates/create/motor", label: "New motor certificate", text: "Uses one PIN", icon: Car, tone: "bg-blue-50 text-blue-700" },
  { to: "/client/certificates", label: "My certificates", text: "Download or continue one", icon: FileText, tone: "bg-violet-50 text-violet-700" },
  { to: "/client/pin-dashboard", label: "My PINs", text: "Balance and PINs received", icon: KeyRound, tone: "bg-amber-50 text-amber-700" },
  { to: "/client/view-profile", label: "Profile", text: "Your details", icon: UserRound, tone: "bg-slate-100 text-slate-700" },
];

const Stat = ({ to, label, value, hint, icon, tone, loading }) => {
  const Icon = icon;
  return (
    <Link to={to} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      {loading ? <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" /> : <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value ?? "–"}</p>}
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </Link>
  );
};

const ClientOverview = () => {
  const { user } = useAuth();
  const clientId = user?.userId || "";
  const [balance, setBalance] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed([]);
    const headers = { Accept: "application/json", Authorization: `Bearer ${getToken()}` };

    // Each figure loads on its own, so one failing does not hide the other.
    const [pins, certs] = await Promise.allSettled([
      PinService.getBalance(clientId),
      fetch(`${getApiBaseUrl()}/Certificate/motor/list`, { headers }).then((r) => {
        if (!r.ok) throw new Error(`Certificates returned ${r.status}`);
        return r.json();
      }),
    ]);

    setBalance(pins.status === "fulfilled" ? Number(pins.value?.currentBalance ?? pins.value?.balance ?? 0) : null);
    setCertificates(certs.status === "fulfilled" ? listOf(certs.value) : []);
    setFailed([pins.status === "rejected" && "your PIN balance", certs.status === "rejected" && "your certificates"].filter(Boolean));
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const certsLoaded = !failed.includes("your certificates");
  const pending = certificates.filter((c) => String(c.status || "").toUpperCase() === "PENDING").length;
  const premium = certificates.reduce((sum, c) => sum + (Number(c.grossPremium ?? c.premium) || 0), 0);
  const recent = [...certificates]
    .sort((a, b) => new Date(b.transDate || b.transactionDate || 0) - new Date(a.transDate || a.transactionDate || 0))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#155dfd]">{new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {greeting()}
            {user?.username ? <span className="capitalize">, {user.username}</span> : ""}
          </h1>
          <p className="mt-1 text-slate-600">Here is where your certificates and PINs stand today.</p>
        </div>
        <Link
          to="/client/certificates/create/motor"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-[#155dfd] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-[#0f4bd1] sm:self-auto"
        >
          <FilePlus2 className="h-4 w-4" />
          New certificate
        </Link>
      </div>

      {failed.length > 0 && !loading && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>Could not load {failed.join(" or ")}.</span>
          <button type="button" onClick={load} className="inline-flex shrink-0 items-center gap-1.5 font-semibold hover:underline">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {balance !== null && balance === 0 && !loading && (
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>You have no PINs left, so you can't issue certificates. Ask your super agent to share more.</span>
        </div>
      )}

      {/* Numbers */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat to="/client/pin-dashboard" label="PIN balance" value={balance?.toLocaleString()} hint="One PIN per certificate" icon={Wallet} tone="bg-emerald-50 text-emerald-700" loading={loading} />
        <Stat to="/client/certificates" label="Certificates" value={certsLoaded ? certificates.length.toLocaleString() : null} hint="Motor certificates issued" icon={FileText} tone="bg-blue-50 text-blue-700" loading={loading} />
        <Stat to="/client/certificates" label="Pending" value={certsLoaded ? pending.toLocaleString() : null} hint="Still open for changes" icon={Clock} tone="bg-amber-50 text-amber-700" loading={loading} />
        <Stat to="/client/certificates" label="Premium" value={certsLoaded ? naira(premium) : null} hint="Across your certificates" icon={Car} tone="bg-violet-50 text-violet-700" loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent certificates */}
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent certificates</h2>
              <p className="text-xs text-slate-500">Your six latest motor certificates</p>
            </div>
            <Link to="/client/certificates" className="inline-flex items-center gap-1 text-sm font-medium text-[#155dfd] hover:underline">
              View all <ArrowRight className="h-4 w-4" />
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
          ) : recent.length > 0 ? (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {recent.map((c, i) => (
                <li key={c.certNo || i} className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
                    <Car className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{c.insuredName || c.name || "Unnamed insured"}</span>
                    <span className="block truncate font-mono text-xs text-slate-500">{c.certNo}</span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="block text-sm font-semibold text-slate-900">{naira(c.grossPremium ?? c.premium)}</span>
                    <span className="block text-xs text-slate-500">{formatDate(c.transDate || c.transactionDate)}</span>
                  </span>
                  <StatusPill tone={statusTone(c.status)}>{c.status || "Active"}</StatusPill>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border-t border-slate-100 px-6 py-14 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-[#155dfd]">
                <FilePlus2 className="h-6 w-6" />
              </span>
              <p className="mt-4 font-semibold text-slate-900">{certsLoaded ? "No certificates yet" : "Could not load certificates"}</p>
              <p className="mt-1 text-sm text-slate-500">{certsLoaded ? "Your first certificate will show up here." : "Use Retry above to try again."}</p>
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
          <p className="text-xs text-slate-500">The tasks you reach for most</p>
          <ul className="mt-4 space-y-2">
            {ACTIONS.map((a) => (
              <li key={a.to}>
                <Link to={a.to} className="group flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 transition hover:border-blue-200 hover:bg-blue-50/40">
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

export default ClientOverview;
