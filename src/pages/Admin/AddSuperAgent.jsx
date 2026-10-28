import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CryptoJS from "crypto-js";
import { getApiBaseUrl } from "../../utils/config";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Eye,
  EyeOff,
  Fingerprint,
  IdCard,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Percent,
  Phone,
  Save,
  ShieldCheck,
  Tag,
  User,
  UserRound,
} from "lucide-react";
import {
  AccessDenied,
  Field,
  LoadingState,
  Notice,
  PageHeader,
  Sheet,
  btnPrimary,
  btnSecondary,
  inputCls,
} from "../../components/UI/PageKit";

// An input with an icon on the left.
const IconInput = ({ icon, className = "", ...props }) => {
  const Icon = icon;
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
      <input {...props} className={`${inputCls} ${Icon ? "pl-9" : ""} ${className}`} />
    </div>
  );
};

// One titled card in the form.
const Section = ({ icon, title, text, children }) => {
  const Icon = icon;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#155dfd]">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {text && <p className="text-xs text-slate-500">{text}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 sm:p-6 md:grid-cols-2">{children}</div>
    </section>
  );
};

// "4 / 11 digits" under the BVN and NIN fields.
const DigitHint = ({ value, label }) =>
  value ? (
    <span className={`mt-1 block text-xs ${value.length === 11 ? "text-emerald-600" : "text-rose-600"}`}>
      {value.length === 11 ? `${label} looks right` : `${value.length} / 11 digits`}
    </span>
  ) : (
    <span className="mt-1 block text-xs text-slate-400">Optional · 11 digits</span>
  );

const initialState = {
  username: "",
  password: "",
  brokerName: "",
  email: "",
  mobilePhone: "",
  contactPerson: "",
  address: "",
  insCompanyID: "STACO",
  tag: "",
  remarks: "",
  rate: "",
  value: "",
  lStartDate: "",
  lEndDate: "",
  field1: "", // Used for BVN
  field2: "", // Used for NIN
};

const AddSuperAgent = ({ inSheet = false, onClose, onCreated }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Permission check state
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check permission on mount
  useEffect(() => {
    const checkPermission = () => {
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          let userData = null;

          // Try parsing as plain JSON first
          if (rawUser.trim().startsWith("{")) {
            try {
              userData = JSON.parse(rawUser);
            } catch {
              // Not plain JSON
            }
          }

          // If not plain JSON, try decrypting (AuthContext stores encrypted)
          if (!userData) {
            try {
              const bytes = CryptoJS.AES.decrypt(rawUser, "your-secret-key");
              const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
              if (decryptedString) {
                userData = JSON.parse(decryptedString);
              }
            } catch {
              // Decrypt failed
            }
          }

          // Check permissions array
          if (userData && Array.isArray(userData.permissions)) {
            if (userData.permissions.includes("SuperAgent.Create")) {
              setHasAccess(true);
              setCheckingAccess(false);
              return;
            }
          }
        }

        // Fallback: check userPermissions in localStorage
        const permsStr = localStorage.getItem("userPermissions");
        if (permsStr) {
          try {
            const perms = JSON.parse(permsStr);
            if (Array.isArray(perms) && perms.includes("SuperAgent.Create")) {
              setHasAccess(true);
              setCheckingAccess(false);
              return;
            }
          } catch {
            // ignore
          }
        }

        // Fallback: check permissions in localStorage
        const permsStr2 = localStorage.getItem("permissions");
        if (permsStr2) {
          try {
            const perms = JSON.parse(permsStr2);
            if (Array.isArray(perms) && perms.includes("SuperAgent.Create")) {
              setHasAccess(true);
              setCheckingAccess(false);
              return;
            }
          } catch {
            // ignore
          }
        }

        // No permission found
        setHasAccess(false);
      } catch (e) {
        console.error("Permission check error:", e);
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkPermission();
  }, []);

  // In the slide-in panel everything sits inside the Sheet; on its own route it is a normal page.
  const frame = (body, footer) =>
    inSheet ? (
      <Sheet open onClose={onClose} title="Add super agent" sub="Fields marked * are required." footer={footer}>
        {body}
      </Sheet>
    ) : (
      body
    );

  // Show loading while checking
  if (checkingAccess) {
    return frame(<LoadingState label="Checking permissions…" />);
  }

  // Show Access Denied immediately if no permission
  if (!hasAccess) {
    return frame(<AccessDenied title="Access denied" message="You don't have permission to create a super agent." />);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate field1 (BVN) - only numbers, max 11 digits
    if (name === "field1") {
      const numbersOnly = value.replace(/\D/g, "").slice(0, 11);
      setForm((prev) => ({ ...prev, [name]: numbersOnly }));
    }
    // Validate field2 (NIN) - only numbers, max 11 digits
    else if (name === "field2") {
      const numbersOnly = value.replace(/\D/g, "").slice(0, 11);
      setForm((prev) => ({ ...prev, [name]: numbersOnly }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    // Validate field1 (BVN) - optional but must be 11 digits if provided
    if (form.field1 && form.field1.length !== 11) {
      setError("BVN must be 11 digits");
      setSubmitting(false);
      return;
    }

    // Validate field2 (NIN) - optional but must be 11 digits if provided
    if (form.field2 && form.field2.length !== 11) {
      setError("NIN must be 11 digits");
      setSubmitting(false);
      return;
    }

    const token = localStorage.getItem("token");

    const payload = {
      username: form.username,
      password: form.password,
      email: form.email,
      mobilePhone: form.mobilePhone,
      address: form.address || "",
      contactPerson: form.contactPerson || "",
      submitDate: new Date().toISOString(),
      tag: form.tag || "",
      remarks: form.remarks || "",
      a1: 0,
      a2: 0,
      roleIds: [4],
      brokerName: form.brokerName,
      insCompanyID: form.insCompanyID || "",
      rate: form.rate || "",
      value: form.value || "",
      lStartDate: form.lStartDate
        ? new Date(form.lStartDate).toISOString()
        : null,
      lEndDate: form.lEndDate ? new Date(form.lEndDate).toISOString() : null,
      a3: 0,
      a4: 0,
      a5: 0,
      field1: form.field1 || "", // BVN
      field2: form.field2 || "", // NIN
    };

    try {
      await axios.post(`${getApiBaseUrl()}/Auth/create-broker`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setSuccess("Super Agent created successfully.");
      setForm(initialState);
      // In the panel, the list closes it and shows its own message.
      if (onCreated) {
        onCreated(payload.brokerName);
        return;
      }
      window.alert("Super Agent created successfully.");
      setTimeout(() => navigate("/admin/users/agents-brokers"), 800);
    } catch (err) {
      console.error("Create broker error", err);

      // If 403 Forbidden, show error message (shouldn't happen if local check passed)
      if (err?.response?.status === 403) {
        setError(
          "Access Denied. You don't have permission to create a Super Agent.",
        );
        return;
      }

      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Failed to create Super Agent";
      setError(typeof message === "string" ? message : JSON.stringify(message));
    } finally {
      setSubmitting(false);
    }
  };

  const sections = (
    <>
      <Section icon={KeyRound} title="Sign-in details" text="What the super agent uses to sign in to the portal.">
        <Field label="Username" required>
          <IconInput icon={User} name="username" value={form.username} onChange={handleChange} required placeholder="sam.doe" autoComplete="off" />
        </Field>
        <Field label="Password" required>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              autoComplete="new-password"
              className={`${inputCls} pl-9 pr-10`}
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

      <Section icon={Building2} title="Agent details" text="How the super agent appears across the portal.">
        <Field label="Super agent name" required>
          <IconInput icon={Building2} name="brokerName" value={form.brokerName} onChange={handleChange} required placeholder="Staco Insurance" />
        </Field>
        <Field label="Email" required>
          <IconInput icon={Mail} type="email" name="email" value={form.email} onChange={handleChange} required placeholder="contact@agency.com" />
        </Field>
        <Field label="Mobile phone" required>
          <IconInput icon={Phone} type="number" name="mobilePhone" value={form.mobilePhone} onChange={handleChange} required placeholder="08012345678" />
        </Field>
        <Field label="Contact person">
          <IconInput icon={UserRound} name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="John Doe" />
        </Field>
        <Field label="Address">
          <IconInput icon={MapPin} name="address" value={form.address} onChange={handleChange} placeholder="123 Main Street, Lagos" />
        </Field>
        <Field label="Insurance company ID">
          <IconInput icon={ShieldCheck} name="insCompanyID" value={form.insCompanyID} onChange={handleChange} placeholder="INS-12345" />
        </Field>
      </Section>

      <Section icon={Fingerprint} title="Identity" text="Used to verify the super agent. Each number has 11 digits.">
        <Field label="BVN (Bank Verification Number)">
          <IconInput icon={IdCard} name="field1" value={form.field1} onChange={handleChange} placeholder="11-digit BVN" maxLength="11" inputMode="numeric" />
          <DigitHint value={form.field1} label="BVN" />
        </Field>
        <Field label="NIN (National Identity Number)">
          <IconInput icon={Fingerprint} name="field2" value={form.field2} onChange={handleChange} placeholder="11-digit NIN" maxLength="11" inputMode="numeric" />
          <DigitHint value={form.field2} label="NIN" />
        </Field>
      </Section>

      <Section icon={CalendarDays} title="Licence and terms" text="The agent's licence period and commercial terms.">
        <Field label="Licence start date">
          <IconInput icon={CalendarDays} type="date" name="lStartDate" value={form.lStartDate} onChange={handleChange} />
        </Field>
        <Field label="Licence end date">
          <IconInput icon={CalendarDays} type="date" name="lEndDate" value={form.lEndDate} onChange={handleChange} />
        </Field>
        <Field label="Rate">
          <IconInput icon={Percent} type="number" step="0.01" name="rate" value={form.rate} onChange={handleChange} placeholder="0.00" />
        </Field>
        <Field label="Value">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₦</span>
            <input name="value" value={form.value} onChange={handleChange} placeholder="Amount in Naira" className={`${inputCls} pl-8`} />
          </div>
        </Field>
        <Field label="Tag">
          <IconInput icon={Tag} name="tag" value={form.tag} onChange={handleChange} placeholder="Premium, Standard…" />
        </Field>
        <Field label="Remarks" wide>
          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            placeholder="Anything else worth noting"
            rows="3"
            className={`${inputCls} h-auto py-2`}
          />
        </Field>
      </Section>

    </>
  );

  const actions = (
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={inSheet ? onClose : () => navigate(-1)} className={btnSecondary}>
        Cancel
      </button>
      <button type="submit" form="add-super-agent-form" disabled={submitting} className={btnPrimary}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save super agent
          </>
        )}
      </button>
    </div>
  );

  const notices = (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice>{success}</Notice>}
    </>
  );

  if (inSheet) {
    return frame(
      <>
        {notices}
        <form id="add-super-agent-form" onSubmit={handleSubmit} className="space-y-5">
          {sections}
        </form>
      </>,
      actions,
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to super agents
        </button>
        <PageHeader
          title="Add super agent"
          description="Create the account the super agent signs in with, and their business details. Fields marked * are required."
        />
      </div>

      {notices}

      <form id="add-super-agent-form" onSubmit={handleSubmit} className="space-y-6">
        {sections}
      </form>

      {/* Stays in view while scrolling */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {actions}
      </div>
    </div>
  );
};

export default AddSuperAgent;
