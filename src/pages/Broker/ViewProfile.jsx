// src/pages/Broker/ViewProfile.jsx
// The super agent's own details. Read-only: the profile API has no update endpoint wired up yet
// (the old Edit only pretended to save), so changes go through the administrator.
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarDays, Info, KeyRound, Lock, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApiBaseUrl } from "../../utils/config";
import { Avatar, DetailCard, DetailRow, ErrorState, LoadingState, PageHeader, StatusPill, btnPrimary } from "../../components/UI/PageKit";

const formatDate = (value) => {
  const d = new Date(value);
  return value && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : null;
};

const ViewProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (isLoading) return <LoadingState label="Loading your profile…" />;
  if (error && !profile) return <ErrorState title="Could not load your profile" message={error} onRetry={() => window.location.reload()} />;

  const name = profile.brokerName || user?.username || "Super agent";

  return (
    <div className="space-y-6">
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
            <span>Need to change your name, email, phone or address? Ask your administrator to update them for you.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;
