import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Hash, Loader2, Save, UserRound, Wallet } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApiBaseUrl } from "../../utils/config";
import { ErrorState, Field, LoadingState, Notice, PageHeader, Sheet, btnPrimary, btnSecondary, inputCls } from "../../components/UI/PageKit";

const pad = (n) => String(n).padStart(2, "0");
// A datetime-local value in the user's own time zone (toISOString would shift it to UTC).
const toLocalInput = (value) => {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const Section = ({ icon, title, children }) => {
  const Icon = icon;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h3 className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-900">
        <Icon className="h-4 w-4 text-[#155dfd]" />
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">{children}</div>
    </section>
  );
};

/**
 * Edit one sub agent. On its own route it is a page; with inSheet it opens in the slide-in panel
 * and calls onSaved(name) after a successful save.
 */
export default function EditClient({ clientId, inSheet = false, onClose, onSaved }) {
  const params = useParams();
  const id = clientId || params.id;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  // The sub agents list of whichever area this page sits in.
  const listPath = `${location.pathname.split("/client-management")[0]}/client-management`;

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch client data when component loads
  useEffect(() => {
    const fetchClient = async () => {
      try {
        setFetchLoading(true);
        setError(null);
        const response = await fetch(`${getApiBaseUrl()}/InsuredClients/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(user?.token && { Authorization: `Bearer ${user.token}` }),
          },
        });
        if (!response.ok) throw new Error(`Failed to fetch client: ${response.status}`);
        const c = await response.json();
        setFormData({
          insuredId: c.insuredId || "",
          brokerId: c.brokerId || "",
          insuredName: c.insuredName || "",
          address: c.address || "",
          email: c.email || "",
          mobilePhone: c.mobilePhone || "",
          contactPerson: c.contactPerson || "",
          // Sent back unchanged; not shown.
          password: c.password || "",
          submitDate: toLocalInput(c.submitDate),
          type: c.type || "",
          a1: c.a1 || 0,
          a2: c.a2 || 0,
          rate: c.rate || "",
          value: c.value || "",
          tag: c.tag || "",
          remarks: c.remarks || "",
          field1: c.field1 || "",
          field2: c.field2 || "",
        });
      } catch (err) {
        console.error("Error fetching client:", err);
        setError(err.message || "Failed to fetch client data");
      } finally {
        setFetchLoading(false);
      }
    };
    if (id) fetchClient();
  }, [id, user]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "number" ? (value === "" ? 0 : parseFloat(value)) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      const submitData = {
        ...formData,
        submitDate: formData.submitDate ? new Date(formData.submitDate).toISOString() : new Date().toISOString(),
      };
      const response = await fetch(`${getApiBaseUrl()}/InsuredClients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        body: JSON.stringify(submitData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update the sub agent: ${response.status}${errorText ? ` - ${errorText}` : ""}`);
      }
      if (onSaved) {
        onSaved(formData.insuredName);
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate(listPath), 1500);
    } catch (err) {
      console.error("Error updating client:", err);
      setError(err.message || "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  const close = () => (onClose ? onClose() : navigate(listPath));

  const input = (name, props = {}) => (
    <input
      name={name}
      type={props.type || "text"}
      value={formData[name] ?? ""}
      onChange={handleInputChange}
      required={props.required}
      step={props.step}
      className={inputCls}
    />
  );

  const body = formData && (
    <form id="edit-client-form" onSubmit={handleSubmit} className="space-y-5">
      <Section icon={UserRound} title="Sub agent details">
        <Field label="Name" required wide>
          {input("insuredName", { required: true })}
        </Field>
        <Field label="Email" required>
          {input("email", { type: "email", required: true })}
        </Field>
        <Field label="Mobile phone">{input("mobilePhone", { type: "tel" })}</Field>
        <Field label="Contact person">{input("contactPerson")}</Field>
        <Field label="Type">{input("type")}</Field>
        <Field label="Address" wide>
          <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} className={`${inputCls} h-auto py-2`} />
        </Field>
      </Section>

      <Section icon={Wallet} title="Terms">
        <Field label="Rate">{input("rate", { type: "number", step: "0.01" })}</Field>
        <Field label="Value">{input("value")}</Field>
        <Field label="Tag">{input("tag")}</Field>
        <Field label="Registered">{input("submitDate", { type: "datetime-local" })}</Field>
        <Field label="Remarks" wide>
          <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows={3} className={`${inputCls} h-auto py-2`} />
        </Field>
      </Section>

      <Section icon={Hash} title="Other fields">
        <Field label="A1">{input("a1", { type: "number" })}</Field>
        <Field label="A2">{input("a2", { type: "number" })}</Field>
        <Field label="Custom field 1">{input("field1")}</Field>
        <Field label="Custom field 2">{input("field2")}</Field>
      </Section>
    </form>
  );

  const actions = (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={close} className={btnSecondary}>
        Cancel
      </button>
      <button type="submit" form="edit-client-form" disabled={loading || !formData} className={btnPrimary}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {loading ? "Saving…" : "Save changes"}
      </button>
    </div>
  );

  if (inSheet) {
    return (
      <Sheet open onClose={close} title={formData?.insuredName || "Edit sub agent"} sub={id} footer={actions}>
        {fetchLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#155dfd]" />
          </div>
        ) : (
          <>
            {error && <Notice tone="error">{error}</Notice>}
            {body}
          </>
        )}
      </Sheet>
    );
  }

  if (fetchLoading) return <LoadingState label="Loading the sub agent…" />;
  if (!formData) return <ErrorState title="Could not load this sub agent" message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      <div>
        <Link to={listPath} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to sub agents
        </Link>
        <PageHeader title="Edit sub agent" description={`${formData.insuredName || "Sub agent"} · ${id}`} />
      </div>
      {success && <Notice>Saved. Taking you back to the list…</Notice>}
      {error && <Notice tone="error" onClose={() => setError(null)}>{error}</Notice>}
      {body}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">{actions}</div>
    </div>
  );
}
