import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Briefcase, ExternalLink, Fingerprint, Hash, Loader2, Mail, Pencil, Printer, StickyNote, UserRound, Wallet } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import {
  Avatar,
  DetailCard,
  DetailRow,
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

const str = (v) => (v === null || v === undefined ? null : String(v));

// The API keeps a sub agent's active/inactive status in field1.
const statusOf = (client) => {
  const s = String(client.field1 || "ACTIVE").toUpperCase();
  return s === "ACTIVE" ? { tone: "green", label: "Active" } : { tone: "red", label: s.charAt(0) + s.slice(1).toLowerCase() };
};

// Loads one sub agent.
const useClientDetails = (clientId) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch client details
  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${getApiBaseUrl()}/Auth/clients/${clientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log("API Response:", response.data);

        // Extract client data from response
        const clientData = response.data.data || response.data;
        setClient(clientData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err.response?.data?.message || "Failed to fetch sub agent details",
        );
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  return { client, loading, error };
};

// The details themselves, shared by the full page and the slide-in panel.
const ClientDetailsBody = ({ client, twoColumns }) => {
  const rate = client.rate ? `${(parseFloat(client.rate) * 100).toFixed(2)}%` : "0%";
  const status = statusOf(client);
  return (
    <div className={`grid grid-cols-1 gap-5 ${twoColumns ? "lg:grid-cols-2 lg:gap-6" : ""}`}>
      <DetailCard icon={UserRound} title="Contact">
        <DetailRow label="Email" value={client.email} />
        <DetailRow label="Mobile phone" value={client.mobilePhone} />
        <DetailRow label="Contact person" value={client.contactPerson} />
        <DetailRow label="Address" value={client.address} />
      </DetailCard>

      <DetailCard icon={Briefcase} title="Account">
        <DetailRow label="Sub agent ID" value={client.insuredId} />
        <DetailRow label="Status">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </DetailRow>
        <DetailRow label="Type" value={client.type} />
        <DetailRow label="Added" value={formatDate(client.submitDate, true)} />
      </DetailCard>

      <DetailCard icon={Wallet} title="Terms">
        <DetailRow label="Rate" value={rate} />
        <DetailRow label="Value" value={client.value} />
        <DetailRow label="Tag" value={client.tag} />
      </DetailCard>

      <DetailCard icon={Fingerprint} title="Identity">
        <DetailRow label="NIN" value={client.field2} mono />
      </DetailCard>

      <DetailCard icon={Hash} title="Additional information">
        <DetailRow label="A1" value={str(client.a1)} />
        <DetailRow label="A2" value={str(client.a2)} />
      </DetailCard>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
          <StickyNote className="h-4 w-4 text-[#155dfd]" />
          <h2 className="text-sm font-semibold text-slate-900">Remarks</h2>
        </div>
        <p className={`whitespace-pre-wrap px-5 py-4 text-sm ${client.remarks ? "text-slate-700" : "text-slate-400"}`}>{client.remarks || "No remarks."}</p>
      </section>
    </div>
  );
};

/** One sub agent in the slide-in panel, opened from the Sub agents list. */
export const BrokerClientDetailsSheet = ({ clientId, onClose, onEdit }) => {
  const { client, loading, error } = useClientDetails(clientId);
  const status = client ? statusOf(client) : null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={client?.insuredName || "Sub agent"}
      sub={[clientId, client?.submitDate && `Added ${formatDate(client.submitDate)}`].filter(Boolean).join(" · ")}
      leading={<Avatar name={client?.insuredName} className="h-10 w-10 text-sm" />}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Link to={`/brokers/client-management/details/${clientId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ExternalLink className="h-4 w-4" />
            Open full page
          </Link>
          <div className="flex gap-2">
            {client?.email && (
              <a href={`mailto:${client.email}`} className={btnSecondary}>
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
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#155dfd]" />
        </div>
      ) : error ? (
        <Notice tone="error">{error}</Notice>
      ) : !client ? (
        <EmptyState title="Sub agent not found" text={`No sub agent has the ID ${clientId}.`} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            {client.type && (
              <StatusPill tone="slate" dot={false}>
                {client.type}
              </StatusPill>
            )}
          </div>
          <ClientDetailsBody client={client} />
        </>
      )}
    </Sheet>
  );
};

const ViewClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { client, loading, error } = useClientDetails(clientId);

  const handleGoBack = () => {
    navigate("/brokers/client-management");
  };

  const backLink = (
    <button type="button" onClick={handleGoBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 print:hidden">
      <ArrowLeft className="h-4 w-4" />
      Back to sub agents
    </button>
  );

  if (loading) return <LoadingState label="Loading sub agent…" />;

  if (error) {
    return (
      <div>
        {backLink}
        <ErrorState title="Could not load this sub agent" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!client) {
    return (
      <div>
        {backLink}
        <EmptyState
          title="Sub agent not found"
          text={`No sub agent has the ID ${clientId}.`}
          action={
            <button type="button" onClick={handleGoBack} className={btnSecondary}>
              Back to sub agents
            </button>
          }
        />
      </div>
    );
  }

  const status = statusOf(client);

  return (
    <div className="space-y-6">
      {backLink}

      {/* Profile header */}
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6 print:shadow-none">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={client.insuredName} className="h-14 w-14 text-lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{client.insuredName || "Unnamed sub agent"}</h1>
              <StatusPill tone={status.tone}>{status.label}</StatusPill>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {client.insuredId}
              {client.submitDate ? ` · Added ${formatDate(client.submitDate)}` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <button type="button" onClick={() => window.print()} className={btnSecondary}>
            <Printer className="h-4 w-4" />
            Print
          </button>
          {client.email && (
            <a href={`mailto:${client.email}`} className={btnPrimary}>
              <Mail className="h-4 w-4" />
              Email
            </a>
          )}
        </div>
      </div>

      <ClientDetailsBody client={client} twoColumns />
    </div>
  );
};

export default ViewClientDetails;
