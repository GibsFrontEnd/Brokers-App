import React, { useState, useEffect } from "react";
import { ArrowUpRight, CalendarRange, Car, ChevronLeft, ChevronRight, Hash, History, Loader2, RefreshCw, Search, Share2, Wallet } from "lucide-react";
import PinService from "../../services/PinServices";
import UserService from "../../services/UserServices";
import CryptoJS from "crypto-js"; // Import CryptoJS
import axios from "axios";
import { getApiBaseUrl } from "../../utils/config";
import {
  Avatar,
  EmptyState,
  Field,
  LoadingState,
  Notice,
  PageHeader,
  SearchInput,
  Sheet,
  StatTile,
  StatusPill,
  Toast,
  btnPrimary,
  btnSecondary,
  iconBtn,
  inputCls,
} from "../../components/UI/PageKit";

const ACTION_TONES = { SHARED: "green", COMPLETED: "green", APPROVED: "blue", PENDING: "amber", DECLINED: "red", FAILED: "red", REVERSED: "amber" };

const formatDateTime = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "–"
    : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const BrokerPinDashboard = () => {
  const [balance, setBalance] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [pinAmount, setPinAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [sharing, setSharing] = useState(false);
  const [vehicleClasses, setVehicleClasses] = useState([]);
  const [selectedVehicleClass, setSelectedVehicleClass] = useState("");
  const [loadingVehicleClasses, setLoadingVehicleClasses] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [brokerId, setBrokerId] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [activityActionFilter, setActivityActionFilter] = useState("SHARED");
  const [activityFromDate, setActivityFromDate] = useState("");
  const [activityToDate, setActivityToDate] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(10);
  const [hasNextActivityPage, setHasNextActivityPage] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [clientSearch, setClientSearch] = useState("");

  // Add the same decrypt function from your AuthContext
  const decryptData = (encryptedData) => {
    if (!encryptedData) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, "your-secret-key");
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedString ? JSON.parse(decryptedString) : null;
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  };

  useEffect(() => {
    const getUserBrokerId = () => {
      // Get the ENCRYPTED user data from localStorage
      const encryptedUserData = localStorage.getItem("user");
      console.log("Encrypted user data from storage:", encryptedUserData);

      if (!encryptedUserData) {
        console.log("No user data found in localStorage");
        return "";
      }

      try {
        // DECRYPT the user data first
        const user = decryptData(encryptedUserData);
        console.log("Decrypted user object:", user);

        if (!user) {
          console.error("Failed to decrypt user data");
          return "";
        }

        // Common field names for broker ID in different systems
        const brokerIdFields = [
          "brokerId",
          "brokerID",
          "BrokerId",
          "brokerCode",
          "BrokerCode",
          "broker_id",
          "broker_code",
          "brokerName",
          "BrokerName",
          "userId",
          "UserId",
          "userID",
          "username",
          "userName",
          "id",
          "Id",
          "ID",
          "code",
          "Code",
          "name",
          "Name",
        ];

        // Find the first field that exists and has a value
        for (const field of brokerIdFields) {
          if (
            user[field] &&
            typeof user[field] === "string" &&
            user[field].trim()
          ) {
            console.log(`Found broker ID in field "${field}":`, user[field]);
            return user[field];
          }
        }

        console.warn(
          "No broker ID found in decrypted user data. Available fields:",
          Object.keys(user),
        );
        return "";
      } catch (e) {
        console.error("Failed to decrypt or parse user data:", e);
        return "";
      }
    };

    const foundBrokerId = getUserBrokerId();
    console.log("Final brokerId to be used:", foundBrokerId);
    setBrokerId(foundBrokerId);
  }, []);

  // Load dashboard data when brokerId changes
  useEffect(() => {
    if (brokerId) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brokerId]);

  const toApiDateTime = (dateValue, isEndOfDay = false) => {
    if (!dateValue) return undefined;
    const suffix = isEndOfDay ? "T23:59:59" : "T00:00:00";
    return new Date(`${dateValue}${suffix}`).toISOString();
  };

  const fetchRecentActivity = async (
    targetPage = 1,
    targetPageSize = activityPageSize,
    filterOverrides = {},
  ) => {
    if (!brokerId) return;

    setActivityLoading(true);
    try {
      const currentUserData = JSON.parse(
        localStorage.getItem("userData") || "{}",
      );
      const userId =
        currentUserData.username || currentUserData.email || brokerId;

      const appliedAction =
        filterOverrides.activityActionFilter ?? activityActionFilter;
      const appliedFromDate =
        filterOverrides.activityFromDate ?? activityFromDate;
      const appliedToDate = filterOverrides.activityToDate ?? activityToDate;

      const auditParams = {
        userId,
        action: appliedAction || undefined,
        fromDate: toApiDateTime(appliedFromDate),
        toDate: toApiDateTime(appliedToDate, true),
        page: targetPage,
        pageSize: targetPageSize,
      };

      const activityData = await PinService.getAuditLog(auditParams);
      const logs = Array.isArray(activityData)
        ? activityData
        : activityData?.data || [];

      setRecentActivity(logs);
      setActivityPage(targetPage);
      setHasNextActivityPage(logs.length === targetPageSize);
    } catch (activityError) {
      console.warn("Failed to load activity:", activityError);
      setRecentActivity([]);
      setHasNextActivityPage(false);
    } finally {
      setActivityLoading(false);
    }
  };

  // Rest of your component remains the same...
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load balance - FIXED: Use currentBalance instead of allocatedTotal
      try {
        const balanceData = await PinService.getBalance(brokerId);
        console.log("Balance API response:", balanceData);

        // FIX: Use currentBalance (11) instead of allocatedTotal (16)
        // currentBalance is the actual available pins that can be shared
        setBalance(balanceData.currentBalance || balanceData.balance || 0);
      } catch (balanceError) {
        console.warn("Failed to load balance:", balanceError);
        setBalance(0); // Fallback
      }

      await fetchRecentActivity(1, activityPageSize);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setError(
        "Failed to load dashboard data. Please try refreshing the page.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Load broker's clients when share modal opens
  const loadBrokerClients = async () => {
    console.log("Loading clients for brokerId:", brokerId); // Debug

    if (!brokerId) {
      const errorMsg = "Broker ID not found. Please log in again.";
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    setLoadingClients(true);
    setError("");
    try {
      console.log("Calling UserService.getBrokerClients with:", brokerId);
      const clientsData = await UserService.getBrokerClients(brokerId);
      console.log("Broker clients API response:", clientsData);

      // Handle the API response structure
      if (clientsData.success && Array.isArray(clientsData.data)) {
        const formattedClients = clientsData.data.map((client) => ({
          userId: client.insuredId || client.userId || client.id,
          fullName: client.insuredName || client.fullName || client.name,
          email: client.email || "No email",
          mobilePhone: client.mobilePhone || client.phone,
          address: client.address || "Address not specified",
        }));
        console.log("Formatted clients:", formattedClients);
        setClients(formattedClients);
      } else {
        console.warn("No sub agents data found for broker:", clientsData);
        setClients([]);
        setError("No sub agents assigned to your broker account.");
      }
    } catch (clientsError) {
      console.error("Failed to load broker sub agents:", clientsError);
      setClients([]);
      setError("Failed to load sub agents. Please try again.");
    } finally {
      setLoadingClients(false);
    }
  };

  const handleOpenShareModal = async () => {
    setShowShareModal(true);
    await loadBrokerClients(); // Load clients when modal opens
  };

  // Fetch Vehicle Classes independently
  useEffect(() => {
    const fetchVehicleClasses = async () => {
      setLoadingVehicleClasses(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${getApiBaseUrl()}/Certificate/vehicle-class`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setVehicleClasses(response.data);
      } catch (err) {
        console.error("Error fetching vehicle classes:", err);
      } finally {
        setLoadingVehicleClasses(false);
      }
    };
    fetchVehicleClasses();
  }, []);

  const handleSharePins = async (e) => {
    e.preventDefault();
    if (!selectedClient || !pinAmount || !selectedVehicleClass) {
      setError("Choose a sub agent and a vehicle class, and enter how many PINs to share.");
      return;
    }

    const pinAmountNum = parseInt(pinAmount);
    if (pinAmountNum > balance) {
      setError(`You only have ${balance} PINs to share.`);
      return;
    }

    if (pinAmountNum <= 0) {
      setError("Enter a number of PINs above zero.");
      return;
    }

    setSharing(true);
    setError("");
    try {
      console.log("Sharing pins:", {
        client: selectedClient,
        classID: selectedVehicleClass,
        amount: pinAmountNum,
        remarks,
      });
      await PinService.sharePins(
        selectedClient, // This serves as clientId in the API call below
        pinAmountNum,
        remarks,
        selectedVehicleClass,
      );

      // Show success message
      setToast({ message: `${pinAmountNum} PINs shared.`, type: "success" });
      setClientSearch("");

      // IMMEDIATELY update the balance locally for better UX
      setBalance((prevBalance) => prevBalance - pinAmountNum);

      // Reset form and close modal
      setSelectedClient("");
      setPinAmount("");
      setRemarks("");
      setSelectedVehicleClass("");
      setShowShareModal(false);

      // Reload data to get updated balance and activity from server
      setTimeout(async () => {
        await loadDashboardData();
      }, 1000);
    } catch (error) {
      const errorMessage =
        error.message || "Failed to share pins. Please try again.";
      console.error("Pin sharing error:", error);
      setError(errorMessage);
    } finally {
      setSharing(false);
    }
  };

  const handleApplyActivityFilters = async () => {
    await fetchRecentActivity(1, activityPageSize);
  };

  const handleResetActivityFilters = async () => {
    setActivityActionFilter("SHARED");
    setActivityFromDate("");
    setActivityToDate("");
    setSearchTerm("");
    await fetchRecentActivity(1, activityPageSize, {
      activityActionFilter: "SHARED",
      activityFromDate: "",
      activityToDate: "",
    });
  };

  // Filter activities based on search term
  const filteredActivities = recentActivity.filter((activity) => {
    const haystack = [
      activity.relatedEntity,
      activity.userName,
      activity.userId,
      activity.performedBy,
      activity.action,
      activity.remarks,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return <LoadingState label="Loading your PINs…" />;
  }

  const sharedOnPage = recentActivity.reduce((sum, a) => (a.action === "SHARED" ? sum + (parseInt(a.amount, 10) || 0) : sum), 0);
  const filteredClients = clients.filter((c) => {
    const q = clientSearch.trim().toLowerCase();
    return !q || [c.fullName, c.email, c.userId].some((v) => String(v || "").toLowerCase().includes(q));
  });
  const chosen = clients.find((c) => String(c.userId) === String(selectedClient));
  const chosenClass = vehicleClasses.find((v) => String(v.value) === String(selectedVehicleClass));
  const amount = parseInt(pinAmount, 10) || 0;
  const tooMany = amount > balance;
  const left = Math.max(0, balance - amount);

  const closeShare = () => {
    setShowShareModal(false);
    setError("");
    setSelectedClient("");
    setPinAmount("");
    setRemarks("");
    setClientSearch("");
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="PIN management"
        description="Share your PINs with your sub agents and follow every transfer."
        actions={
          <button type="button" onClick={handleOpenShareModal} disabled={balance === 0} className={btnPrimary} title={balance === 0 ? "You have no PINs to share" : undefined}>
            <Share2 className="h-4 w-4" />
            Share PINs
          </button>
        }
      />

      {error && !showShareModal && (
        <Notice tone="error" onClose={() => setError("")}>
          {error}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label="Available PINs" value={Number(balance || 0).toLocaleString()} hint={balance === 0 ? "Ask your administrator for more" : "Ready to share"} icon={Wallet} tone="bg-emerald-50 text-emerald-700" />
        <StatTile label="Shared" value={sharedOnPage.toLocaleString()} hint="In the activity listed below" icon={Share2} tone="bg-blue-50 text-blue-700" />
        <StatTile label="Transfers" value={recentActivity.length.toLocaleString()} hint="Listed below" icon={History} tone="bg-violet-50 text-violet-700" />
      </div>

      {/* Activity */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Sharing activity</h2>
            <p className="text-xs text-slate-500">PINs you have sent to your sub agents</p>
          </div>
          {brokerId && <span className="text-xs text-slate-400">Super agent ID {brokerId}</span>}
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:px-6 lg:flex-row lg:items-end">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search activity" className="lg:max-w-xs lg:flex-1" />
          <div className="grid grid-cols-2 gap-3 lg:flex">
            <Field label="From">
              <input type="date" value={activityFromDate} onChange={(e) => setActivityFromDate(e.target.value)} className={`${inputCls} lg:w-40`} />
            </Field>
            <Field label="To">
              <input type="date" value={activityToDate} onChange={(e) => setActivityToDate(e.target.value)} className={`${inputCls} lg:w-40`} />
            </Field>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleApplyActivityFilters} disabled={activityLoading} className={btnPrimary}>
              <CalendarRange className="h-4 w-4" />
              Apply
            </button>
            <button type="button" onClick={handleResetActivityFilters} disabled={activityLoading} className={btnSecondary}>
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {activityLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[#155dfd]" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            icon={searchTerm ? Search : Share2}
            title={searchTerm ? "No matching activity" : "No activity yet"}
            text={searchTerm ? "Try a different search." : "You haven't shared any PINs with your sub agents yet."}
            action={
              !searchTerm && balance > 0 ? (
                <button type="button" onClick={handleOpenShareModal} className={btnPrimary}>
                  <Share2 className="h-4 w-4" />
                  Share PINs
                </button>
              ) : null
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredActivities.map((activity, index) => (
              <li key={activity.logId || index} className="flex items-center gap-4 px-4 py-3.5 sm:px-6">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">Shared with {activity.relatedEntity || "a sub agent"}</p>
                    {activity.action && (
                      <StatusPill tone={ACTION_TONES[String(activity.action).toUpperCase()] || "slate"} dot={false}>
                        {activity.action}
                      </StatusPill>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {formatDateTime(activity.actionDate)}
                    {activity.remarks ? ` · ${activity.remarks}` : ""}
                    {activity.logId ? ` · #${activity.logId}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-base font-bold tabular-nums text-slate-900">{Number(activity.amount || 0).toLocaleString()}</span>
                  <span className="block text-[11px] text-slate-500">PINs</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* The server pages the activity, so this only knows whether there is a next page. */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 sm:px-6">
          <div className="flex items-center gap-3">
            <span>Page {activityPage}</span>
            <select
              value={activityPageSize}
              onChange={async (e) => {
                const pageSize = parseInt(e.target.value, 10);
                setActivityPageSize(pageSize);
                await fetchRecentActivity(1, pageSize);
              }}
              aria-label="Rows per page"
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#155dfd]"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fetchRecentActivity(activityPage - 1, activityPageSize)}
              disabled={activityPage <= 1 || activityLoading}
              aria-label="Previous page"
              className={`${iconBtn} disabled:opacity-40`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => fetchRecentActivity(activityPage + 1, activityPageSize)}
              disabled={!hasNextActivityPage || activityLoading}
              aria-label="Next page"
              className={`${iconBtn} disabled:opacity-40`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Share PINs */}
      {showShareModal && (
        <Sheet
          open
          onClose={closeShare}
          title="Share PINs"
          sub={`You have ${Number(balance || 0).toLocaleString()} PINs to share.`}
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 truncate text-sm text-slate-500">
                {chosen && amount > 0 ? (
                  <>
                    <span className="font-semibold text-slate-900">{amount.toLocaleString()} PINs</span> to{" "}
                    <span className="font-semibold text-slate-900">{chosen.fullName}</span>
                    {chosenClass ? ` · ${chosenClass.text}` : ""}
                  </>
                ) : (
                  "Choose a sub agent, a class and how many PINs."
                )}
              </p>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={closeShare} className={btnSecondary}>
                  Cancel
                </button>
                <button
                  type="submit"
                  form="share-pins-form"
                  disabled={sharing || !pinAmount || !selectedClient || tooMany || clients.length === 0 || loadingClients}
                  className={btnPrimary}
                >
                  {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                  {sharing ? "Sharing…" : "Share PINs"}
                </button>
              </div>
            </div>
          }
        >
          {error && <Notice tone="error">{error}</Notice>}

          <form id="share-pins-form" onSubmit={handleSharePins} className="space-y-5">
            {/* Step 1: sub agent */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#155dfd] text-xs font-bold text-white">1</span>
                <h3 className="text-sm font-semibold text-slate-900">Sub agent</h3>
              </div>
              <div className="p-5">
                {loadingClients ? (
                  <div className="grid place-items-center py-8 text-sm text-slate-500">
                    <Loader2 className="mb-2 h-5 w-5 animate-spin text-[#155dfd]" />
                    Loading your sub agents…
                  </div>
                ) : chosen ? (
                  <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                    <Avatar name={chosen.fullName} className="h-10 w-10 text-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{chosen.fullName}</p>
                      <p className="truncate text-xs text-slate-500">{chosen.email}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedClient("")} className={`${btnSecondary} px-3 py-1.5 text-xs`}>
                      Change
                    </button>
                  </div>
                ) : clients.length === 0 ? (
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
                    You have no sub agents to share with yet. Add one under Sub agents first.
                  </p>
                ) : (
                  <>
                    <SearchInput value={clientSearch} onChange={setClientSearch} placeholder="Search your sub agents" />
                    <ul className="mt-3 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                      {filteredClients.length === 0 ? (
                        <li className="px-4 py-6 text-center text-sm text-slate-500">No sub agents match.</li>
                      ) : (
                        filteredClients.map((c) => (
                          <li key={c.userId}>
                            <button type="button" onClick={() => setSelectedClient(c.userId)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                              <Avatar name={c.fullName} className="h-8 w-8 text-xs" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-slate-900">{c.fullName}</span>
                                <span className="block truncate text-xs text-slate-500">{c.email}</span>
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </>
                )}
              </div>
            </section>

            {/* Step 2: how many */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#155dfd] text-xs font-bold text-white">2</span>
                <h3 className="text-sm font-semibold text-slate-900">PINs</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <Field label="Vehicle class" required>
                  <div className="relative">
                    <Car className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select value={selectedVehicleClass} onChange={(e) => setSelectedVehicleClass(e.target.value)} required disabled={loadingVehicleClasses} className={`${inputCls} pl-9`}>
                      <option value="">{loadingVehicleClasses ? "Loading…" : "Select a vehicle class"}</option>
                      {vehicleClasses.map((vClass, idx) => (
                        <option key={vClass.value || idx} value={vClass.value}>
                          {vClass.text}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
                <Field label="Number of PINs" required>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="1"
                      max={balance}
                      value={pinAmount}
                      onChange={(e) => setPinAmount(e.target.value)}
                      placeholder={`Up to ${balance}`}
                      required
                      className={`${inputCls} pl-9 ${tooMany ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""}`}
                    />
                  </div>
                </Field>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={tooMany ? "font-semibold text-rose-600" : "text-slate-500"}>
                      {tooMany ? `You only have ${balance} PINs.` : `${left.toLocaleString()} left after this`}
                    </span>
                    <span className="text-slate-400">{balance.toLocaleString()} available</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${tooMany ? "bg-rose-500" : "bg-[#155dfd]"}`}
                      style={{ width: `${balance ? Math.min(100, (amount / balance) * 100) : 0}%` }}
                    />
                  </div>
                </div>
                <Field label="Remarks" wide>
                  <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows="3" placeholder="What the PINs are for (optional)" className={`${inputCls} h-auto resize-none py-2`} />
                </Field>
              </div>
            </section>
          </form>
        </Sheet>
      )}
    </div>
  );
};

export default BrokerPinDashboard;
