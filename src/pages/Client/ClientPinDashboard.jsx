import React, { useState, useEffect } from "react";
import { ArrowDownLeft, FileCheck2, History, Info, Inbox, Wallet } from "lucide-react";
import PinService from "../../services/PinServices";
import CryptoJS from "crypto-js";
import { EmptyState, LoadingState, Notice, PageHeader, SearchInput, StatTile, StatusPill } from "../../components/UI/PageKit";

const STATUS_TONES = { APPROVED: "green", COMPLETED: "green", PENDING: "amber", REJECTED: "red", FAILED: "red" };

const ClientPinDashboard = () => {
  const [balance, setBalance] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [clientId, setClientId] = useState("");

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
    const getUserClientId = () => {
      // Get the ENCRYPTED user data from localStorage
      const encryptedUserData = localStorage.getItem("user");
      

      if (!encryptedUserData) {
     
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

        // Common field names for client ID in different systems
        const clientIdFields = [
          "userId",
          "userID",
          "UserId",
          "id",
          "Id",
          "ID",
          "insuredId",
          "insuredID",
          "clientId",
          "clientID",
          "username",
          "userName",
          "name",
          "Name",
          "code",
          "Code",
        ];

        // Find the first field that exists and has a value
        for (const field of clientIdFields) {
          if (
            user[field] &&
            typeof user[field] === "string" &&
            user[field].trim()
          ) {
            
            return user[field];
          }
        }

        console.warn(
          "No client ID found in decrypted user data. Available fields:",
          Object.keys(user)
        );
        return "";
      } catch (e) {
        console.error("Failed to decrypt or parse user data:", e);
        return "";
      }
    };

    const foundClientId = getUserClientId();

    setClientId(foundClientId);
  }, []);

  // Load dashboard data when clientId changes
  useEffect(() => {
    if (clientId) {
      loadDashboardData();
    }
  }, [clientId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load balance
      try {
        const balanceData = await PinService.getBalance(clientId);
       

        // Use currentBalance for client view
        setBalance(balanceData.currentBalance || balanceData.balance || 0);
      } catch (balanceError) {
        console.warn("Failed to load balance:", balanceError);
        setBalance(0); // Fallback
      }

      // Load recent activity - filter to show only allocations where client received pins
      try {
        const activityData = await PinService.getMyAllocations();
        

        // Filter to show only allocations where this client received pins
        const clientActivities = Array.isArray(activityData)
          ? activityData.filter(
              (activity) =>
                activity.toUserId === clientId && activity.status === "APPROVED"
            )
          : [];

        setRecentActivity(clientActivities);
      } catch (activityError) {
        console.warn("Failed to load activity:", activityError);
        setRecentActivity([]); // Fallback
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setError(
        "Failed to load dashboard data. Please try refreshing the page."
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter activities based on search term
  const filteredActivities = recentActivity.filter(
    (activity) =>
      activity.fromUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.fromUserId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return "–";
    const d = new Date(dateString);
    return Number.isNaN(d.getTime())
      ? "–"
      : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return <LoadingState label="Loading your PINs…" />;
  }

  const received = recentActivity.reduce((sum, activity) => sum + (parseInt(activity.pinAmount) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="My PINs" description="Your PIN balance and the PINs your super agent has sent you." />

      {error && (
        <Notice tone="error" onClose={() => setError("")}>
          {error}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile
          label="Available PINs"
          value={Number(balance || 0).toLocaleString()}
          hint={balance === 0 ? "Ask your super agent for more" : "Ready to use"}
          icon={Wallet}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatTile label="Received" value={received.toLocaleString()} hint="In the transfers listed below" icon={ArrowDownLeft} tone="bg-blue-50 text-blue-700" />
        <StatTile label="Transfers" value={recentActivity.length.toLocaleString()} hint="Approved transfers to you" icon={History} tone="bg-violet-50 text-violet-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* History */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">PINs received</h2>
              <p className="text-xs text-slate-500">Transfers from your super agent</p>
            </div>
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by sender or remarks" className="sm:w-64" />
          </div>

          {filteredActivities.length === 0 ? (
            <EmptyState
              icon={searchTerm ? History : Inbox}
              title={searchTerm ? "No matching transfers" : "No PINs received yet"}
              text={searchTerm ? "Try a different search." : "PINs your super agent sends you will show up here."}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredActivities.map((activity, index) => (
                <li key={activity.allocationId || index} className="flex items-center gap-4 px-4 py-3.5 sm:px-6">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <ArrowDownLeft className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">From {activity.fromUserName || activity.fromUserId || "your super agent"}</p>
                      {activity.status && (
                        <StatusPill tone={STATUS_TONES[String(activity.status).toUpperCase()] || "slate"} dot={false}>
                          {activity.status}
                        </StatusPill>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {formatDate(activity.allocatedDate)}
                      {activity.remarks ? ` · ${activity.remarks}` : ""}
                      {activity.allocationId ? ` · #${activity.allocationId}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block text-base font-bold tabular-nums text-emerald-700">+{Number(activity.pinAmount || 0).toLocaleString()}</span>
                    <span className="block text-[11px] text-slate-500">PINs</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* How PINs work */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Info className="h-4 w-4 text-[#155dfd]" />
              <h2 className="text-sm font-semibold text-slate-900">How PINs work</h2>
            </div>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
              {[
                "Each certificate you issue uses one PIN.",
                "The PIN is taken from your balance when the certificate is created.",
                "Your super agent sends you PINs; ask them when you run low.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {t}
                </li>
              ))}
            </ul>
          </section>
          {clientId && <p className="px-1 text-xs text-slate-400">Sub agent ID {clientId}</p>}
        </aside>
      </div>
    </div>
  );
};

export default ClientPinDashboard;
