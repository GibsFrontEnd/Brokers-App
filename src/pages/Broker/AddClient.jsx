import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Save, Users, Wallet } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import CryptoJS from "crypto-js";
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

/**
 * Add a sub agent. On its own route it is a page; with inSheet it opens in the slide-in panel and
 * calls onCreated(name) when done.
 */
export default function AddClient({ inSheet = false, onClose, onCreated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    mobilePhone: "",
    address: "",
    contactPerson: "",
    insuredName: "",
    type: "",
    rate: "",
    value: "",
    tag: "",
    remarks: "",
    field1: "",
    field2: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Determine the base path based on current URL
  const getBackLink = () => {
    if (location.pathname.startsWith("/company")) {
      return "/company/client-management";
    } else if (
      location.pathname.startsWith("/brokers") ||
      location.pathname.startsWith("/admin/brokers")
    ) {
      return "/brokers/client-management";
    } else if (location.pathname.startsWith("/admin")) {
      return "/admin/company/client-management";
    }
    // Default fallback
    return "/client-management";
  };

  // Get the appropriate navigation path for form submission
  const getNavigationPath = () => {
    if (location.pathname.startsWith("/company")) {
      return "/company/client-management";
    } else if (
      location.pathname.startsWith("/brokers") ||
      location.pathname.startsWith("/admin/brokers")
    ) {
      return "/brokers/client-management";
    } else if (location.pathname.startsWith("/admin")) {
      return "/admin/client-management";
    }
    return "/client-management";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Decrypt user data function
      const decryptData = (encryptedData) => {
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedData, "your-secret-key");
          const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
          return decryptedString ? JSON.parse(decryptedString) : null;
        } catch (error) {
          console.error("Decryption failed:", error);
          return null;
        }
      };

      // Get broker ID from decrypted user data
      let brokerId = "";
      const encryptedUser = localStorage.getItem("user");

      if (encryptedUser) {
        const userData = decryptData(encryptedUser);

        if (!userData) {
          console.error("Failed to decrypt user data");
        } else {
          console.log("Decrypted user data:", userData);
          brokerId =
            userData.userid ||
            userData.userId ||
            userData.id ||
            userData.brokerId ||
            "";
          console.log("Extracted broker ID:", brokerId);
        }
      }

      if (!brokerId) {
        throw new Error("Broker ID not found. Please log in again.");
      }

      // Prepare API payload according to new backend schema
      const apiPayload = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        mobilePhone: formData.mobilePhone,
        address: formData.address,
        contactPerson: formData.contactPerson,
        submitDate: new Date().toISOString(),
        tag: formData.tag || "",
        remarks: formData.remarks || "",
        a1: 0,
        a2: 0,
        insuredName: formData.insuredName,
        brokerID: brokerId.toString(),
        type: formData.type || "",
        rate: formData.rate || "",
        value: formData.value || "",
        field1: "ACTIVE",
        field2: formData.field2 || "",
      };

      console.log("Submitting payload:", apiPayload);

      const response = await fetch(`${getApiBaseUrl()}/Auth/create-customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to create sub agent: ${response.status} ${
            response.statusText
          }${errorData ? ` - ${errorData}` : ""}`,
        );
      }

      // In the panel, the list closes it and shows its own message.
      if (onCreated) {
        onCreated(formData.insuredName);
        return;
      }

      // Navigate back to client list on success using dynamic path
      navigate(getNavigationPath());
    } catch (err) {
      console.error("Error creating sub agent:", err);
      setError(err.message || "Sub Agent creation failed");
    } finally {
      setLoading(false);
    }
  };

  const sections = (
    <>
      <Section icon={KeyRound} title="Sign-in details" text="What the sub agent signs in with.">
        <Field label="Username" required>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="A unique username" autoComplete="off" className={inputCls} />
        </Field>
        <Field label="Password" required>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Choose a password"
              autoComplete="new-password"
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
      </Section>

      <Section icon={Users} title="Sub agent details">
        <Field label="Full name" required>
          <input type="text" name="insuredName" value={formData.insuredName} onChange={handleChange} required placeholder="Sub agent's full name" className={inputCls} />
        </Field>
        <Field label="Email" required>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="name@example.com" className={inputCls} />
        </Field>
        <Field label="Mobile phone">
          <input type="number" name="mobilePhone" value={formData.mobilePhone} onChange={handleChange} placeholder="08012345678" className={inputCls} />
        </Field>
        <Field label="Contact person">
          <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="Who to contact" className={inputCls} />
        </Field>
        <Field label="Address" wide>
          <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Sub agent's address" className={inputCls} />
        </Field>
        <Field label="Type">
          <select name="type" value={formData.type} onChange={handleChange} className={inputCls}>
            <option value="">Select a type</option>
            <option value="Individual">Individual</option>
            <option value="Corporate">Corporate</option>
            <option value="SME">SME</option>
          </select>
        </Field>
      </Section>

      <Section icon={Wallet} title="Terms" text="Optional.">
        <Field label="Rate">
          <input type="number" name="rate" value={formData.rate} onChange={handleChange} placeholder="0.00" className={inputCls} />
        </Field>
        <Field label="Value">
          <input type="text" name="value" value={formData.value} onChange={handleChange} placeholder="Value" className={inputCls} />
        </Field>
        <Field label="Tag" wide>
          <input type="text" name="tag" value={formData.tag} onChange={handleChange} placeholder="Tag" className={inputCls} />
        </Field>
        <Field label="Remarks" wide>
          <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="3" placeholder="Anything else worth noting" className={`${inputCls} h-auto py-2`} />
        </Field>
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
        <Link to={getBackLink()} className={btnSecondary}>
          Cancel
        </Link>
      )}
      <button type="submit" form="add-sub-agent-form" disabled={loading} className={btnPrimary}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {loading ? "Creating…" : "Create sub agent"}
      </button>
    </div>
  );

  if (inSheet) {
    return (
      <Sheet open onClose={onClose} title="Add sub agent" sub="Fields marked * are required." footer={actions}>
        {error && <Notice tone="error">{error}</Notice>}
        <form id="add-sub-agent-form" onSubmit={handleSubmit} className="space-y-5">
          {sections}
        </form>
      </Sheet>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={getBackLink()} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to sub agents
        </Link>
        <PageHeader title="Add sub agent" description="Create the account a sub agent signs in with. Fields marked * are required." />
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <form id="add-sub-agent-form" onSubmit={handleSubmit} className="space-y-6">
        {sections}
      </form>
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">{actions}</div>
    </div>
  );
}
