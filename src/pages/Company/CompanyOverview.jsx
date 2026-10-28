// The insurance company's home page: certificates and agents at a glance.
import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ArrowRight, Clock, Download, FileCheck2, FileText, RefreshCw, UserRound, Users, Wallet } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApiBaseUrl } from "../../utils/config";
import { StatusPill } from "../../components/UI/PageKit";

const getToken = () => localStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("token");

const listOf = (data) => (Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

// The shell keeps the raw API fields on each certificate; status lives in "tag", premium in "grossPrenium".
const statusOf = (c) => String(c.tag || c.status || "PENDING").toUpperCase();
const premiumOf = (c) => Number(c.grossPrenium ?? c.grossPremium) || 0;

const naira = (n) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

const statusTone = (s) => (s === "PENDING" ? "amber" : ["REJECTED", "CANCELLED"].includes(s) ? "red" : "green");

const ACTIONS = [
  { to: "/company/certificates", label: "Certificates", text: "Review what agents issued", icon: FileText, tone: "bg-blue-50 text-blue-700" },
  { to: "/company/agents-brokers", label: "Agents and brokers", text: "Who sells your cover", icon: Users, tone: "bg-violet-50 text-violet-700" },
  { to: "/company/download-certificates", label: "Download certificates", text: "Get copies in bulk", icon: Download, tone: "bg-emerald-50 text-emerald-700" },
  { to: "/company/view-profile", label: "Profile", text: "Your company details", icon: UserRound, tone: "bg-slate-100 text-slate-700" },
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

const CompanyOverview = () => {
  const { user } = useAuth();
  const { certificates = [], fetchCertificates } = useOutletContext() || {};
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState(null);
  const [agentsFailed, setAgentsFailed] = useState(false);

  const load = async () => {
    setLoading(true);
    setAgentsFailed(false);
    const companyId = user?.insCompanyId || user?.companyId || user?.userId;
    await Promise.allSettled([
      fetchCertificates?.(),
      (async () => {
        try {
          if (!companyId) throw new Error("No company ID");
          const res = await fetch(`${getApiBaseUrl()}/Auth/companies/${encodeURIComponent(companyId)}/brokers`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
          });
          if (!res.ok) throw new Error(`Agents returned ${res.status}`);
          setAgents(listOf(await res.json()).length);
        } catch (err) {
          console.warn("Could not load agents:", err.message);
          setAgents(null);
          setAgentsFailed(true);
        }
      })(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Load once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pending = certificates.filter((c) => statusOf(c) === "PENDING").length;
  const premium = certificates.reduce((sum, c) => sum + premiumOf(c), 0);
  const recent = certificates.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#155dfd]">{new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {greeting()}
            {user?.username ? <span className="capitalize">, {user.username}</span> : ""}
          </h1>
          <p className="mt-1 text-slate-600">Here is what your agents have issued.</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {agentsFailed && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Could not load your agents.</div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat to="/company/certificates" label="Certificates" value={certificates.length.toLocaleString()} hint="Issued under your company" icon={FileCheck2} tone="bg-blue-50 text-blue-700" loading={loading} />
        <Stat to="/company/certificates" label="Pending" value={pending.toLocaleString()} hint="Waiting for a decision" icon={Clock} tone="bg-amber-50 text-amber-700" loading={loading} />
        <Stat to="/company/certificates" label="Premium" value={naira(premium)} hint="Across all certificates" icon={Wallet} tone="bg-emerald-50 text-emerald-700" loading={loading} />
        <Stat to="/company/agents-brokers" label="Agents and brokers" value={agents?.toLocaleString()} hint="Selling your cover" icon={Users} tone="bg-violet-50 text-violet-700" loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Latest certificates</h2>
              <p className="text-xs text-slate-500">The most recent ones issued under your company</p>
            </div>
            <Link to="/company/certificates" className="inline-flex items-center gap-1 text-sm font-medium text-[#155dfd] hover:underline">
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
                <li key={c.certNo || i}>
                  <Link to={`/company/certificates/${encodeURIComponent(c.certNo)}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 sm:px-6">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{c.insuredName || "Unnamed insured"}</span>
                      <span className="block truncate font-mono text-xs text-slate-500">
                        {c.certNo}
                        {c.brokerId ? ` · ${c.brokerId}` : ""}
                      </span>
                    </span>
                    <span className="hidden text-sm font-semibold text-slate-900 sm:block">{naira(premiumOf(c))}</span>
                    <StatusPill tone={statusTone(statusOf(c))}>{statusOf(c)}</StatusPill>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border-t border-slate-100 px-6 py-14 text-center">
              <p className="font-semibold text-slate-900">No certificates yet</p>
              <p className="mt-1 text-sm text-slate-500">Certificates your agents issue will show up here.</p>
            </div>
          )}
        </section>

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

export default CompanyOverview;
