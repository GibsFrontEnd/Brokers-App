import React, { useEffect, useState } from "react";
import { Eye, EyeOff, IdCard, KeyRound, Loader2, RefreshCw, ShieldCheck, SlidersHorizontal, UserPlus, UserRound } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import { Field, Notice, Sheet, btnPrimary, btnSecondary, inputCls } from "../UI/PageKit";

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

const Addnewuser = ({ isOpen, onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    mobilePhone: "",
    address: "",
    contactPerson: "",
    submitDate: new Date().toISOString(),
    tag: "",
    remarks: "",
    a1: 0,
    a2: 0,
    roleIds: [0],
    title: "",
    insured_name: "",
    location: "",
    identification: "",
    id_number: "",
    phone: "",
    occupation: "",
    field01: "",
    field02: "",
    field03: "",
    field04: "",
    field05: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState(null);

  const API_URL = `${getApiBaseUrl()}/Auth/create-system-user`;
  const ROLES_API_URL = `${getApiBaseUrl()}/Auth/roles`;

  const fetchRoles = async () => {
    setRolesLoading(true);
    setRolesError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await fetch(ROLES_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(bodyText || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rolesData = Array.isArray(data) ? data : data?.data || [];
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setRolesError(err.message || "Failed to load roles");
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e, fieldName) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      // For a1 and a2 fields, ensure they're numbers (not strings)
      if (fieldName === "a1" || fieldName === "a2") {
        // Convert to number and ensure it's not too large
        const numValue = value === "" ? 0 : parseInt(value, 10);
        setFormData((prev) => ({
          ...prev,
          [fieldName]: numValue,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [fieldName]: value,
        }));
      }
    }
  };

  const handleRoleIdsChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and commas
    if (value === "" || /^[\d,]*$/.test(value)) {
      const roleIdsArray = value
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "")
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));

      // Ensure at least one role ID (default to [0] if empty)
      const finalRoleIds = roleIdsArray.length > 0 ? roleIdsArray : [0];

      setFormData((prev) => ({
        ...prev,
        roleIds: finalRoleIds,
      }));
    }
  };

  const toggleRoleId = (roleID) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.roleIds) ? prev.roleIds : [];
      const normalized = current.length ? current.filter((id) => id !== 0) : [];
      const exists = normalized.includes(roleID);
      const next = exists
        ? normalized.filter((id) => id !== roleID)
        : [...normalized, roleID];

      return {
        ...prev,
        roleIds: next.length ? next : [0],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      // Prepare the data to send
      const dataToSend = {
        ...formData,
        // Ensure a1 and a2 are numbers
        a1:
          typeof formData.a1 === "string"
            ? parseFloat(formData.a1) || 0
            : formData.a1,
        a2:
          typeof formData.a2 === "string"
            ? parseFloat(formData.a2) || 0
            : formData.a2,
        // Ensure roleIds is always an array with at least one element
        roleIds: formData.roleIds.length > 0 ? formData.roleIds : [0],
      };

      console.log("Sending data:", dataToSend); // For debugging

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          accept: "*/*",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          console.log("Could not parse error as JSON");
        }
        throw new Error(
          errorData.message ||
            errorData.error ||
            errorText ||
            `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();
      console.log("User created successfully:", result);

      setSuccess(true);
      if (onUserAdded) {
        onUserAdded(result);
      }

      // Reset form after successful creation
      setTimeout(() => {
        setFormData({
          username: "",
          password: "",
          email: "",
          mobilePhone: "",
          address: "",
          contactPerson: "",
          submitDate: new Date().toISOString(),
          tag: "",
          remarks: "",
          a1: 0,
          a2: 0,
          roleIds: [0],
          title: "",
          insured_name: "",
          location: "",
          identification: "",
          id_number: "",
          phone: "",
          occupation: "",
          field01: "",
          field02: "",
          field03: "",
          field04: "",
          field05: "",
        });
        setShowPassword(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
      console.error("Error creating user:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Load roles when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetchRoles();
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedRoleIds = (Array.isArray(formData.roleIds) ? formData.roleIds : []).filter((id) => id !== 0);
  const roleList = roles
    .filter((r) => r?.isActive !== false)
    .sort((a, b) => String(a.roleName || "").localeCompare(String(b.roleName || "")));

  return (
    <Sheet
      open
      onClose={onClose}
      title="Add system user"
      sub="Fields marked * are required."
      leading={
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#155dfd]">
          <UserPlus className="h-5 w-5" />
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" form="add-system-user-form" disabled={loading || success} className={btnPrimary}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {loading ? "Creating…" : "Create user"}
          </button>
        </div>
      }
    >
      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice>User created. Closing…</Notice>}

      <form id="add-system-user-form" onSubmit={handleSubmit} className="space-y-5">
        <Section icon={KeyRound} title="Sign-in details" text="What the user signs in with.">
          <Field label="Username" required>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="Enter username" autoComplete="off" className={inputCls} />
          </Field>
          <Field label="Password" required>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
                autoComplete="new-password"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Email" required wide>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Enter email address" className={inputCls} />
          </Field>
        </Section>

        <Section icon={UserRound} title="Personal details">
          <Field label="Title">
            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Mr, Mrs, Dr" className={inputCls} />
          </Field>
          <Field label="Full name">
            <input type="text" name="insured_name" value={formData.insured_name} onChange={handleChange} placeholder="Full name" className={inputCls} />
          </Field>
          <Field label="Phone number">
            <input type="tel" name="mobilePhone" value={formData.mobilePhone} onChange={(e) => handleNumberChange(e, "mobilePhone")} placeholder="2348000000000" inputMode="numeric" className={inputCls} />
          </Field>
          <Field label="Contact person phone">
            <input type="tel" name="contactPerson" value={formData.contactPerson} onChange={(e) => handleNumberChange(e, "contactPerson")} placeholder="2348000000000" inputMode="numeric" className={inputCls} />
          </Field>
          <Field label="Address" wide>
            <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Full address" className={inputCls} />
          </Field>
          <Field label="Occupation">
            <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} placeholder="Professional occupation" className={inputCls} />
          </Field>
          <Field label="Location">
            <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="User location" className={inputCls} />
          </Field>
        </Section>

        <Section icon={IdCard} title="Identification">
          <Field label="Identification type">
            <input type="text" name="identification" value={formData.identification} onChange={handleChange} placeholder="e.g. Passport, Driver's Licence" className={inputCls} />
          </Field>
          <Field label="ID number">
            <input type="text" name="id_number" value={formData.id_number} onChange={handleChange} placeholder="Identification number" className={inputCls} />
          </Field>
        </Section>

        {/* Roles */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#155dfd]" />
              <h3 className="text-sm font-semibold text-slate-900">Roles</h3>
              <span className="text-xs text-slate-500">{selectedRoleIds.length} selected</span>
            </div>
            <button
              type="button"
              onClick={fetchRoles}
              disabled={rolesLoading || loading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${rolesLoading ? "animate-spin" : ""}`} />
              Reload
            </button>
          </div>
          {rolesError ? (
            <div className="p-5">
              <Notice tone="error">{rolesError}</Notice>
            </div>
          ) : rolesLoading ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#155dfd]" />
            </div>
          ) : roleList.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No roles available.</p>
          ) : (
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {roleList.map((r) => {
                const checked = selectedRoleIds.includes(r.roleID);
                return (
                  <li key={r.roleID}>
                    <label className={`flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors ${checked ? "bg-blue-50/50" : "hover:bg-slate-50"}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleRoleId(r.roleID)} disabled={loading} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#155dfd]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">{r.roleName}</span>
                        {r.description && <span className="block text-xs text-slate-500">{r.description}</span>}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">#{r.roleID}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {/* Keep the old manual roleIds parser as a hidden fallback for edge cases */}
          <input type="hidden" name="roleIds" value={Array.isArray(formData.roleIds) ? formData.roleIds.join(",") : ""} onChange={handleRoleIdsChange} />
        </section>

        <Section icon={SlidersHorizontal} title="Other details" text="Optional.">
          <Field label="A1">
            <input type="text" name="a1" value={formData.a1} onChange={(e) => handleNumberChange(e, "a1")} placeholder="0" inputMode="numeric" className={inputCls} />
          </Field>
          <Field label="A2">
            <input type="text" name="a2" value={formData.a2} onChange={(e) => handleNumberChange(e, "a2")} placeholder="0" inputMode="numeric" className={inputCls} />
          </Field>
          <Field label="Tag" wide>
            <input type="text" name="tag" value={formData.tag} onChange={handleChange} placeholder="User tag" className={inputCls} />
          </Field>
          <Field label="Remarks" wide>
            <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="3" placeholder="Additional remarks or notes" className={`${inputCls} h-auto py-2`} />
          </Field>
        </Section>
      </form>
    </Sheet>
  );
};

export default Addnewuser;
