import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ExternalLink,
  Fingerprint,
  Hash,
  Loader2,
  Mail,
  Pencil,
  Printer,
  StickyNote,
  UserRound,
  Wallet,
} from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import {
  Avatar,
  DetailCard as Card,
  DetailRow as Row,
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
  Sheet,
  StatusPill,
  btnPrimary,
  btnSecondary,
} from "../../components/UI/PageKit";

// Format date for display
const formatDate = (dateString, withTime = false) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

// Where the licence stands today.
const licenceStatus = (end) => {
  if (!end) return null;
  const days = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  if (Number.isNaN(days)) return null;
  if (days < 0) return { tone: "red", label: "Expired" };
  if (days <= 30) return { tone: "amber", label: `Expires in ${days} day${days === 1 ? "" : "s"}` };
  return { tone: "green", label: "Valid" };
};

// The status shown in the list: active when approved. Older records only have a tag.
const statusOf = (broker) => {
  if (typeof broker.isApproved === "boolean") {
    return broker.isApproved ? { tone: "green", label: "Active" } : { tone: "red", label: "Inactive" };
  }
  const tag = String(broker.tag || "Active").toLowerCase();
  if (["inactive", "suspended", "rejected"].includes(tag)) return { tone: "red", label: broker.tag };
  if (tag === "pending") return { tone: "amber", label: broker.tag };
  return { tone: "green", label: broker.tag || "Active" };
};

const str = (v) => (v === null || v === undefined ? null : String(v));

// Loads one super agent.
const useBrokerDetails = (brokerId) => {
  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch broker details
  useEffect(() => {
    const fetchBrokerDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${getApiBaseUrl()}/Auth/brokers/${brokerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Extract broker data from response
        const brokerData = response.data.data;
        setBroker(brokerData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err.response?.data?.message || "Failed to fetch broker details",
        );
      } finally {
        setLoading(false);
      }
    };

    if (brokerId) {
      fetchBrokerDetails();
    }
  }, [brokerId]);

  return { broker, loading, error };
};

// The details themselves, shared by the full page and the slide-in panel.
const BrokerDetailsBody = ({ broker, twoColumns }) => {
  const licence = licenceStatus(broker.lEndDate);
  const rate = broker.rate ? `${(parseFloat(broker.rate) * 100).toFixed(2)}%` : "0%";
  const facts = [
    { label: "Rate", value: rate, icon: Wallet, tone: "bg-blue-50 text-blue-700" },
    { label: "Value", value: broker.value || "–", icon: Wallet, tone: "bg-violet-50 text-violet-700" },
    { label: "PIN", value: broker.a1 ?? "–", icon: Fingerprint, tone: "bg-amber-50 text-amber-700" },
    {
      label: "Licence",
      value: licence ? licence.label : "Not set",
      icon: CalendarDays,
      tone:
        licence?.tone === "red"
          ? "bg-rose-50 text-rose-700"
          : licence?.tone === "amber"
            ? "bg-amber-50 text-amber-700"
            : "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <>
      <div className={`grid grid-cols-2 gap-3 ${twoColumns ? "sm:gap-4 lg:grid-cols-4" : ""}`}>
        {facts.map((f) => (
          <div key={f.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:shadow-none">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${f.tone}`}>
              <f.icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">{f.label}</p>
              <p className="truncate text-base font-semibold text-slate-900">{f.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-1 gap-5 ${twoColumns ? "lg:grid-cols-2 lg:gap-6" : ""}`}>
        <Card icon={UserRound} title="Contact">
          <Row label="Email" value={broker.email} />
          <Row label="Mobile phone" value={broker.mobilePhone} />
          <Row label="Contact person" value={broker.contactPerson} />
          <Row label="Address" value={broker.address} />
        </Card>

        <Card icon={Building2} title="Business">
          <Row label="Super agent ID" value={broker.brokerId} />
          <Row label="Company ID" value={broker.insCompanyId} />
          <Row label="User type" value={broker.userType} />
          <Row label="Registered" value={formatDate(broker.submitDate, true)} />
        </Card>

        <Card icon={CalendarDays} title="Licence and terms">
          <Row label="Licence start" value={formatDate(broker.lStartDate)} />
          <Row label="Licence end" value={formatDate(broker.lEndDate)} />
          <Row label="Rate" value={rate} />
          <Row label="Value" value={broker.value} />
          <Row label="Tag" value={broker.tag} />
        </Card>

        <Card icon={Fingerprint} title="Identity">
          <Row label="BVN" value={broker.field1} mono />
          <Row label="NIN" value={broker.field2} mono />
        </Card>

        <Card icon={Hash} title="Additional information">
          <Row label="PIN" value={str(broker.a1)} />
          <Row label="A2" value={str(broker.a2)} />
          <Row label="A3" value={str(broker.a3)} />
          <Row label="A4" value={str(broker.a4)} />
          <Row label="A5" value={str(broker.a5)} />
        </Card>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
            <StickyNote className="h-4 w-4 text-[#155dfd]" />
            <h2 className="text-sm font-semibold text-slate-900">Remarks</h2>
          </div>
          <p className={`whitespace-pre-wrap px-5 py-4 text-sm ${broker.remarks ? "text-slate-700" : "text-slate-400"}`}>
            {broker.remarks || "No remarks."}
          </p>
        </section>
      </div>
    </>
  );
};

/** One super agent in the slide-in panel, opened from the Super agents list. */
/** pageBase: where the full page for one agent lives (admin or company). */
export const BrokerDetailsSheet = ({ brokerId, onClose, onEdit, pageBase = "/admin/users/agents-brokers" }) => {
  const { broker, loading, error } = useBrokerDetails(brokerId);
  const status = broker ? statusOf(broker) : null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={broker?.brokerName || "Super agent"}
      sub={[brokerId, broker?.submitDate && `Registered ${formatDate(broker.submitDate)}`].filter(Boolean).join(" · ")}
      leading={<Avatar name={broker?.brokerName} className="h-10 w-10 text-sm" />}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Link to={`${pageBase}/${brokerId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ExternalLink className="h-4 w-4" />
            Open full page
          </Link>
          <div className="flex gap-2">
            {broker?.email && (
              <a href={`mailto:${broker.email}`} className={btnSecondary}>
                <Mail className="h-4 w-4" />
                Email
              </a>
            )}
            {onEdit && (
              <button type="button" onClick={onEdit} className={btnPrimary}>
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="grid place-items-center py-20 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-[#155dfd]" />
        </div>
      ) : error ? (
        <Notice tone="error">{error}</Notice>
      ) : !broker ? (
        <EmptyState title="Super agent not found" text={`No super agent has the ID ${brokerId}.`} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            {broker.insCompanyId && <StatusPill tone="slate" dot={false}>{broker.insCompanyId}</StatusPill>}
          </div>
          <BrokerDetailsBody broker={broker} />
        </>
      )}
    </Sheet>
  );
};

/** backTo: the list this page returns to (admin super agents, or a company's agents). */
const ViewBrokerDetails = ({ backTo = "/admin/users/agents-brokers", backLabel = "Back to super agents" }) => {
  const { brokerId } = useParams();
  const navigate = useNavigate();
  const { broker, loading, error } = useBrokerDetails(brokerId);

  const handleGoBack = () => {
    navigate(backTo);
  };

  const backLink = (
    <button
      type="button"
      onClick={handleGoBack}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 print:hidden"
    >
      <ArrowLeft className="h-4 w-4" />
      {backLabel}
    </button>
  );

  if (loading) return <LoadingState label="Loading super agent…" />;

  if (error) {
    return (
      <div>
        {backLink}
        <ErrorState title="Could not load this super agent" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!broker) {
    return (
      <div>
        {backLink}
        <EmptyState
          title="Super agent not found"
          text={`No super agent has the ID ${brokerId}.`}
          action={
            <button type="button" onClick={handleGoBack} className={btnSecondary}>
              {backLabel}
            </button>
          }
        />
      </div>
    );
  }

  const status = statusOf(broker);

  return (
    <div className="space-y-6">
      {backLink}

      {/* Profile header */}
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6 print:shadow-none">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={broker.brokerName} className="h-14 w-14 text-lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {broker.brokerName || "Unnamed super agent"}
              </h1>
              <StatusPill tone={status.tone}>{status.label}</StatusPill>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {broker.brokerId}
              {broker.insCompanyId ? ` · ${broker.insCompanyId}` : ""}
              {broker.submitDate ? ` · Registered ${formatDate(broker.submitDate)}` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <button type="button" onClick={() => window.print()} className={btnSecondary}>
            <Printer className="h-4 w-4" />
            Print
          </button>
          {broker.email && (
            <a href={`mailto:${broker.email}`} className={btnPrimary}>
              <Mail className="h-4 w-4" />
              Email
            </a>
          )}
        </div>
      </div>

      <BrokerDetailsBody broker={broker} twoColumns />
    </div>
  );
};

export default ViewBrokerDetails;
