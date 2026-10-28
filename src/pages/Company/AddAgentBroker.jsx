import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import CryptoJS from "crypto-js";
import { ArrowLeft, Building2, CalendarDays, Hash, KeyRound, Loader2, Save, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApiBaseUrl } from "../../utils/config";
import { Field, Notice, PageHeader, Sheet, btnPrimary, btnSecondary, inputCls } from "../../components/UI/PageKit";

// One titled card in the form.
const Section = ({ icon, title, text, children }) => {
  const Icon = icon;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-2.5 border-b border-slate-100 px-5 py-3.5">
        <Icon className="mt-0.5 h-4 w-4 text-[#155dfd]" />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {text && <p className="text-xs text-slate-500">{text}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">{children}</div>
    </section>
  );
};

const SECRET_KEY = "your-secret-key";

const decryptStoredUser = (encrypted) => {
  if (!encrypted) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted ? JSON.parse(decrypted) : null;
  } catch (error) {
    console.error("Failed to decrypt stored user payload", error);
    return null;
  }
};

const extractCompanyId = (payload) => {
  if (!payload) return "";
  return (
    payload.insCompanyId ||
    payload.insCompanyID ||
    payload.companyId ||
    payload.companyID ||
    payload.userid ||
    payload.userId ||
    payload.id ||
    payload.nameid ||
    payload.sub ||
    ""
  );
};

const parseTokenUser = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch (error) {
    console.warn("Failed to parse token payload", error);
    return null;
  }
};

/** Add an agent. On its own route it is a page; with inSheet it opens in the slide-in panel. */
const AddAgentBroker = ({ inSheet = false, onClose, onCreated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    brokerName: "",
    password: "",
    email: "",
    mobilePhone: "",
    address: "",
    contactPerson: "",
    tag: "",
    remarks: "",
    rate: "",
    value: "",
    field1: "",
    field2: "",
    a1: "",
    a2: "",
    a3: "",
    a4: "",
    a5: "",
    lStartDate: "",
    lEndDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resolvedCompanyId = useMemo(() => {
    const directId = extractCompanyId(user);
    if (directId) return String(directId);

    if (typeof window === "undefined") return "";

    const encryptedUser = window.localStorage.getItem("user");
    const decryptedUser = decryptStoredUser(encryptedUser);
    if (decryptedUser) {
      const decryptedId = extractCompanyId(decryptedUser);
      if (decryptedId) return String(decryptedId);
    }

    const token = window.localStorage.getItem("token");
    const tokenPayload = parseTokenUser(token);
    const tokenId = extractCompanyId(tokenPayload);
    return tokenId ? String(tokenId) : "";
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toNumber = (value) => {
    if (value === "" || value === null || value === undefined) {
      return 0;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const isoOrNull = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (!resolvedCompanyId) {
        throw new Error("Unable to resolve company ID. Please log in again.");
      }

      if (typeof window === "undefined") {
        throw new Error("Window context unavailable.");
      }

      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      setLoading(true);
      setError("");

      const payload = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        mobilePhone: formData.mobilePhone,
        address: formData.address,
        contactPerson: formData.contactPerson,
        submitDate: new Date().toISOString(),
        tag: formData.tag,
        remarks: formData.remarks,
        a1: toNumber(formData.a1),
        a2: toNumber(formData.a2),
        brokerName: formData.brokerName,
        insCompanyID: resolvedCompanyId,
        rate: formData.rate,
        value: formData.value,
        lStartDate: isoOrNull(formData.lStartDate),
        lEndDate: isoOrNull(formData.lEndDate),
        a3: toNumber(formData.a3),
        a4: toNumber(formData.a4),
        a5: toNumber(formData.a5),
        field1: formData.field1,
        field2: formData.field2,
      };

      await axios.post(`${getApiBaseUrl()}/Auth/create-broker`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // In the panel, the list closes it and shows its own message.
      if (onCreated) {
        onCreated(formData.brokerName);
        return;
      }
      navigate("/company/agents-brokers");
    } catch (err) {
      console.error("Error creating broker", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create agent/broker",
      );
    } finally {
      setLoading(false);
    }
  };

  const input = (name, props = {}) => (
    <input name={name} value={formData[name]} onChange={handleChange} type={props.type || "text"} required={props.required} placeholder={props.placeholder} step={props.step} className={inputCls} />
  );

  const sections = (
    <>
      <Section icon={KeyRound} title="Sign-in details" text="What the agent signs in with.">
        <Field label="Username" required>
          {input("username", { required: true, placeholder: "A unique username" })}
        </Field>
        <Field label="Password" required>
          {input("password", { type: "password", required: true, placeholder: "Choose a password" })}
        </Field>
      </Section>

      <Section icon={Users} title="Agent details">
        <Field label="Full name" required>
          {input("brokerName", { required: true, placeholder: "Agent or broker name" })}
        </Field>
        <Field label="Email" required>
          {input("email", { type: "email", required: true, placeholder: "agent@example.com" })}
        </Field>
        <Field label="Mobile phone">{input("mobilePhone", { placeholder: "08012345678" })}</Field>
        <Field label="Contact person">{input("contactPerson")}</Field>
        <Field label="Address" wide>
          {input("address")}
        </Field>
        <Field label="Company ID">
          <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
            <Building2 className="mr-2 h-4 w-4 text-slate-400" />
            {resolvedCompanyId || "Not available"}
          </div>
        </Field>
      </Section>

      <Section icon={CalendarDays} title="Contract and terms" text="Optional.">
        <Field label="Contract start">{input("lStartDate", { type: "date" })}</Field>
        <Field label="Contract end">{input("lEndDate", { type: "date" })}</Field>
        <Field label="Rate">{input("rate", { type: "number", step: "0.01", placeholder: "0.00" })}</Field>
        <Field label="Value">{input("value")}</Field>
        <Field label="Tag">{input("tag")}</Field>
        <Field label="Remarks" wide>
          <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3} className={`${inputCls} h-auto py-2`} />
        </Field>
      </Section>

      <Section icon={Hash} title="Other fields" text="Optional.">
        <Field label="Custom field 1">{input("field1")}</Field>
        <Field label="Custom field 2">{input("field2")}</Field>
        {["a1", "a2", "a3", "a4", "a5"].map((f) => (
          <Field key={f} label={f.toUpperCase()}>
            {input(f, { type: "number", placeholder: "0" })}
          </Field>
        ))}
      </Section>
    </>
  );

  const actions = (
    <div className="flex justify-end gap-2">
      {inSheet ? (
        <button type="button" onClick={onClose} className={btnSecondary}>
          Cancel
        </button>
      ) : (
        <Link to="/company/agents-brokers" className={btnSecondary}>
          Cancel
        </Link>
      )}
      <button type="submit" form="add-agent-form" disabled={loading} className={btnPrimary}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {loading ? "Creating…" : "Create agent"}
      </button>
    </div>
  );

  if (inSheet) {
    return (
      <Sheet open onClose={onClose} title="Add agent or broker" sub="Fields marked * are required." footer={actions}>
        {error && <Notice tone="error">{error}</Notice>}
        <form id="add-agent-form" onSubmit={handleSubmit} className="space-y-5">
          {sections}
        </form>
      </Sheet>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/company/agents-brokers" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to agents and brokers
        </Link>
        <PageHeader title="Add agent or broker" description="Onboard a new agent or broker into your network. Fields marked * are required." />
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <form id="add-agent-form" onSubmit={handleSubmit} className="space-y-6">
        {sections}
      </form>
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">{actions}</div>
    </div>
  );
};

export default AddAgentBroker;
