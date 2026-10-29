// src/pages/Broker/ViewProfile.jsx
// The super agent's own details. Name and contact details can be edited here (PUT Auth/my-profile);
// the account ID, company and rates are managed by the administrator.
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarDays, Info, KeyRound, Lock, Mail, MapPin, Pencil, Phone, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApiBaseUrl } from "../../utils/config";
import {
  Avatar,
  DetailCard,
  DetailRow,
  ErrorState,
  Field,
  LoadingState,
  Notice,
  PageHeader,
  Sheet,
  StatusPill,
  Toast,
  btnPrimary,
  btnSecondary,
  inputCls,
} from "../../components/UI/PageKit";

const formatDate = (value) => {
  const d = new Date(value);
  return value && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : null;
};

const ViewProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", mobilePhone: "", contactPerson: "", address: "" });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found. Please log in.");
        }

        // The signed-in user's ID, from the login session; failing that, from the token.
        let userId = user?.userId || null;
        if (!userId) {
          try {
            const tokenPayload = JSON.parse(atob(token.split(".")[1]));
            userId = tokenPayload.nameid || tokenPayload.sub || tokenPayload.unique_name;
          } catch {
            console.warn("Could not parse token");
          }
        }

        if (!userId) {
          throw new Error("User ID not found. Please log in again.");
        }

        // Call the API
        const response = await fetch(`${getApiBaseUrl()}/Auth/user/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication failed. Please log in again.");
          } else if (response.status === 404) {
            throw new Error("User profile not found.");
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        }

        const result = await response.json();
        const userData = result.data || result;

        setProfile({
          userid: userId,
          brokerId: userData.brokerId || userId,
          brokerName: userData.brokerName || "",
          address: userData.address || "",
          mobilePhone: userData.mobilePhone || "",
          contactName: userData.contactPerson || "",
          email: userData.email || "",
          insCompanyId: userData.insCompanyId || "",
          submitDate: userData.submitDate || "",
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.message || "Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const openEdit = () => {
    setEditForm({
      name: profile.brokerName,
      email: profile.email,
      mobilePhone: profile.mobilePhone,
      contactPerson: profile.contactName,
      address: profile.address,
    });
    setEditError("");
    setEditing(true);
  };

  const handleEditChange = (e) => setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setEditError("Name is required.");
      return;
    }

    setSaving(true);
    setEditError("");
    try {
      const response = await fetch(`${getApiBaseUrl()}/Auth/my-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Could not save your changes (error ${response.status}).`);
      }

      setProfile((prev) => ({
        ...prev,
        brokerName: editForm.name.trim(),
        email: editForm.email.trim(),
        mobilePhone: editForm.mobilePhone.trim(),
        contactName: editForm.contactPerson.trim(),
        address: editForm.address.trim(),
      }));
      setEditing(false);
      setToast({ message: "Your profile was updated.", type: "success" });
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingState label="Loading your profile…" />;
  if (error && !profile) return <ErrorState title="Could not load your profile" message={error} onRetry={() => window.location.reload()} />;

  const name = profile.brokerName || user?.username || "Super agent";

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader title="Profile" description="Your details as the portal knows them." />

      {/* Who you are */}
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={name} className="h-16 w-16 text-xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{name}</h2>
              <StatusPill tone="blue" dot={false}>
                Super agent
              </StatusPill>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {profile.brokerId}
              {profile.insCompanyId ? ` · ${profile.insCompanyId}` : ""}
              {profile.submitDate ? ` · Member since ${formatDate(profile.submitDate)}` : ""}
            </p>
          </div>
        </div>
        <button type="button" onClick={openEdit} className={btnSecondary}>
          <Pencil className="h-4 w-4" />
          Edit profile
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DetailCard icon={UserRound} title="Contact">
            <DetailRow label="Email">
              {profile.email ? (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {profile.email}
                </span>
              ) : null}
            </DetailRow>
            <DetailRow label="Mobile phone">
              {profile.mobilePhone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {profile.mobilePhone}
                </span>
              ) : null}
            </DetailRow>
            <DetailRow label="Contact person" value={profile.contactName} />
            <DetailRow label="Address">
              {profile.address ? (
                <span className="inline-flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {profile.address}
                </span>
              ) : null}
            </DetailRow>
          </DetailCard>

          <DetailCard icon={Building2} title="Account">
            <DetailRow label="Super agent ID" value={profile.brokerId} mono />
            <DetailRow label="Name" value={profile.brokerName} />
            <DetailRow label="Company" value={profile.insCompanyId} />
            <DetailRow label="Registered">
              {profile.submitDate ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  {formatDate(profile.submitDate)}
                </span>
              ) : null}
            </DetailRow>
          </DetailCard>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-[#155dfd]">
                <Lock className="h-[18px] w-[18px]" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Password</h3>
                <p className="font-mono text-sm tracking-widest text-slate-400">••••••••</p>
              </div>
            </div>
            <Link to="/brokers/change-password" className={`${btnPrimary} mt-4 w-full`}>
              <KeyRound className="h-4 w-4" />
              Change password
            </Link>
          </section>

          <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600 ring-1 ring-slate-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>Your super agent ID, company and rates are managed by your administrator.</span>
          </div>
        </div>
      </div>

      {editing && (
        <Sheet
          open
          onClose={() => !saving && setEditing(false)}
          title="Edit profile"
          sub={profile.brokerId}
          leading={<Avatar name={editForm.name || name} className="h-10 w-10 text-sm" />}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(false)} disabled={saving} className={btnSecondary}>
                Cancel
              </button>
              <button type="submit" form="edit-profile-form" disabled={saving} className={btnPrimary}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          }
        >
          {editError && <Notice tone="error">{editError}</Notice>}
          <form id="edit-profile-form" onSubmit={handleSave} className="space-y-4">
            <Field label="Name" required>
              <input name="name" value={editForm.name} onChange={handleEditChange} required maxLength={200} className={inputCls} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" value={editForm.email} onChange={handleEditChange} maxLength={200} className={inputCls} />
            </Field>
            <Field label="Mobile phone">
              <input name="mobilePhone" type="tel" value={editForm.mobilePhone} onChange={handleEditChange} maxLength={20} className={inputCls} />
            </Field>
            <Field label="Contact person">
              <input name="contactPerson" value={editForm.contactPerson} onChange={handleEditChange} maxLength={200} className={inputCls} />
            </Field>
            <Field label="Address">
              <textarea name="address" value={editForm.address} onChange={handleEditChange} rows="3" maxLength={500} className={`${inputCls} h-auto py-2`} />
            </Field>
          </form>
        </Sheet>
      )}
    </div>
  );
};

export default ViewProfile;
