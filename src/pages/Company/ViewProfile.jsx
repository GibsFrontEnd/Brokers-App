import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import CryptoJS from "crypto-js";
import { Building2, KeyRound, Lock, Mail, MapPin, Pencil, Phone, Save } from "lucide-react";
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

const extractUserId = (payload) => {
  if (!payload) return "";
  return (
    payload.userid ||
    payload.userId ||
    payload.id ||
    payload.insCompanyId ||
    payload.companyId ||
    payload.nameid ||
    payload.sub ||
    payload.unique_name ||
    ""
  );
};

const parseTokenUserId = (token) => {
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return extractUserId(payload);
  } catch (error) {
    console.warn("Failed to parse token payload", error);
    return "";
  }
};

const ViewProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    insCompanyId: "",
    companyName: "",
    address: "",
    mobilePhone: "",
    contactPerson: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);

  const resolvedUserId = useMemo(() => {
    const directId = extractUserId(user);
    if (directId) return String(directId);

    if (typeof window === "undefined") return "";

    const encryptedUser = window.localStorage.getItem("user");
    const decryptedUser = decryptStoredUser(encryptedUser);
    if (decryptedUser) {
      const decryptedId = extractUserId(decryptedUser);
      if (decryptedId) return String(decryptedId);
    }

    const storedToken = window.localStorage.getItem("token");
    return String(parseTokenUserId(storedToken) || "");
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (typeof window === "undefined") {
          throw new Error("Window context unavailable.");
        }

        const token = window.localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found. Please log in.");
        }

        if (!resolvedUserId) {
          throw new Error("Company ID not found. Please log in again.");
        }

        const response = await axios.get(
          `${getApiBaseUrl()}/Auth/companies/${resolvedUserId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        let profileData = response.data?.data ?? response.data;
        if (Array.isArray(profileData)) {
          profileData = profileData[0] ?? null;
        }

        if (!profileData) {
          throw new Error("Profile data not found.");
        }

        const normalizedProfile = {
          insCompanyId:
            profileData.insCompanyId ||
            profileData.companyId ||
            String(resolvedUserId),
          companyName: profileData.companyName || profileData.name || "",
          address: profileData.address || "",
          mobilePhone: profileData.mobilePhone || profileData.phoneNumber || "",
          contactPerson:
            profileData.contactPerson || profileData.contactName || "",
          email: profileData.email || "",
        };

        if (!isMounted) return;
        setProfile(normalizedProfile);
        setFormData(normalizedProfile);
      } catch (err) {
        console.error("Error fetching company profile", err);
        if (!isMounted) return;
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load profile data.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (resolvedUserId) {
      fetchProfile();
    } else {
      setIsLoading(false);
      setError("Company ID not found. Please log in again.");
    }

    return () => {
      isMounted = false;
    };
  }, [resolvedUserId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (typeof window === "undefined") {
        throw new Error("Window context unavailable.");
      }

      setIsSaving(true);
      setError("");

      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const profileId =
        profile?.insCompanyId ||
        profile?.companyId ||
        profile?.id ||
        resolvedUserId;

      await axios.put(
        `${getApiBaseUrl()}/Auth/companies/${profileId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setProfile(formData);
      setIsEditing(false);
      setToast("Profile updated.");
    } catch (err) {
      console.error("Error updating company profile", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData(profile);
    }
  };

  if (isLoading) return <LoadingState label="Loading your company profile…" />;
  if (error && !profile) return <ErrorState title="Could not load your company profile" message={error} onRetry={() => window.location.reload()} />;

  const name = profile?.companyName || user?.username || "Insurance company";
  const withIcon = (Icon, value) =>
    value ? (
      <span className="inline-flex items-start gap-1.5">
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        {value}
      </span>
    ) : null;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Profile"
        description="Your company's details as the portal knows them."
        actions={
          <button type="button" onClick={() => setIsEditing(true)} className={btnPrimary}>
            <Pencil className="h-4 w-4" />
            Edit profile
          </button>
        }
      />

      {/* Who you are */}
      <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <Avatar name={name} className="h-16 w-16 text-xl" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{name}</h2>
            <StatusPill tone="blue" dot={false}>
              Insurance company
            </StatusPill>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{profile?.insCompanyId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <DetailCard icon={Building2} title="Company details">
          <DetailRow label="Company ID" value={profile?.insCompanyId} mono />
          <DetailRow label="Company name" value={profile?.companyName} />
          <DetailRow label="Email">{withIcon(Mail, profile?.email)}</DetailRow>
          <DetailRow label="Mobile phone">{withIcon(Phone, profile?.mobilePhone)}</DetailRow>
          <DetailRow label="Contact person" value={profile?.contactPerson} />
          <DetailRow label="Address">{withIcon(MapPin, profile?.address)}</DetailRow>
        </DetailCard>

        <section className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-[#155dfd]">
              <Lock className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Password</h3>
              <p className="font-mono text-sm tracking-widest text-slate-400">••••••••</p>
            </div>
          </div>
          <Link to="/company/change-password" className={`${btnSecondary} mt-4 w-full`}>
            <KeyRound className="h-4 w-4" />
            Change password
          </Link>
        </section>
      </div>

      {/* Edit */}
      {isEditing && (
        <Sheet
          open
          onClose={handleCancel}
          title="Edit profile"
          sub={profile?.insCompanyId}
          leading={<Avatar name={name} className="h-10 w-10 text-sm" />}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={handleCancel} className={btnSecondary}>
                Cancel
              </button>
              <button type="submit" form="edit-company-profile-form" disabled={isSaving} className={btnPrimary}>
                <Save className="h-4 w-4" />
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          }
        >
          {error && <Notice tone="error">{error}</Notice>}
          <form id="edit-company-profile-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
            <Field label="Company name" required wide>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className={inputCls} />
            </Field>
            <Field label="Email" required wide>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} />
            </Field>
            <Field label="Mobile phone">
              <input type="tel" name="mobilePhone" value={formData.mobilePhone} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Contact person">
              <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Address" wide>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className={`${inputCls} h-auto py-2`} />
            </Field>
          </form>
        </Sheet>
      )}
    </div>
  );
};

export default ViewProfile;
