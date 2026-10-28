import React, { useState, useEffect } from "react";
import { Check, CheckCircle2, ClipboardCheck, Clock, Loader2, RefreshCw, UserCheck, Users, X } from "lucide-react";
import CryptoJS from "crypto-js";
import { getApiBaseUrl } from "../../utils/config";
import {
  AccessDenied,
  Avatar,
  DetailCard,
  DetailRow,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  SearchInput,
  Sheet,
  StatTile,
  StatusPill,
  Toast,
  ViewToggle,
  btnSecondary,
  inputCls,
} from "../../components/UI/PageKit";
import { cardItemCls, cardListCls, useViewMode } from "../../components/UI/viewMode";

const Verification = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [view, setView] = useViewMode("verification");

  // Permission states
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [currentUserPermissions, setCurrentUserPermissions] = useState([]);

  // Helper to read permissions from storage
  const readPermissionsFromStorage = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        if (userStr.trim().startsWith("{")) {
          try {
            const userData = JSON.parse(userStr);
            const perms = userData?.permissions || [];
            if (Array.isArray(perms)) return perms;
          } catch {
          // Not readable here; try the next place.
        }
        }

        try {
          const bytes = CryptoJS.AES.decrypt(userStr, "your-secret-key");
          const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
          if (decryptedStr) {
            const userData = JSON.parse(decryptedStr);
            const perms = userData?.permissions || [];
            if (Array.isArray(perms)) return perms;
          }
        } catch {
          // Not readable here; try the next place.
        }
      }

      const permsStr = localStorage.getItem("userPermissions");
      if (permsStr) {
        try {
          const perms = JSON.parse(permsStr);
          if (Array.isArray(perms)) return perms;
        } catch {
          // Not readable here; try the next place.
        }
      }

      const permsStr2 = localStorage.getItem("permissions");
      if (permsStr2) {
        try {
          const perms = JSON.parse(permsStr2);
          if (Array.isArray(perms)) return perms;
        } catch {
          // Not readable here; try the next place.
        }
      }

      return [];
    } catch (e) {
      console.error("Error reading permissions:", e);
      return [];
    }
  };

  // Check permissions on mount
  useEffect(() => {
    const perms = readPermissionsFromStorage();
    setCurrentUserPermissions(perms);
    setCheckingAccess(false);
  }, []);

  const hasPermission = (permissionName) => {
    return currentUserPermissions.includes(permissionName);
  };

  const canApproveUsers = hasPermission("User.Approve");

  // Fetch pending users
  const fetchPendingUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${getApiBaseUrl()}/Auth/approvals/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError(
            "Access denied. You don't have permission to view pending approvals.",
          );
          return;
        }
        throw new Error("Failed to fetch pending users");
      }

      const result = await response.json();

      if (result.success) {
        setPendingUsers(result.data || []);
      } else {
        setError("Failed to load pending users");
      }
    } catch (err) {
      console.error("Error fetching pending users:", err);
      setError(err.message || "Failed to load pending users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checkingAccess && canApproveUsers) {
      fetchPendingUsers();
    }
  }, [checkingAccess, canApproveUsers]);

  // Handle approve user
  const handleApprove = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${getApiBaseUrl()}/Auth/approvals/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: selectedUser.userId,
            userType: selectedUser.userType,
            approvalNotes: approvalNotes,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to approve user");
      }

      // Success - refresh the list
      await fetchPendingUsers();
      setShowApprovalModal(false);
      setSelectedUser(null);
      setApprovalNotes("");

      // Show success message (you can use a toast notification library)
      setToast("Account approved. The user can now sign in.");
    } catch (err) {
      console.error("Error approving user:", err);
      setError(err.message || "Failed to approve user");
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject user
  const handleReject = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      setError("Rejection reason is required");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getApiBaseUrl()}/Auth/approvals/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.userId,
          userType: selectedUser.userType,
          rejectionReason: rejectionReason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject user");
      }

      // Success - refresh the list
      await fetchPendingUsers();
      setShowRejectionModal(false);
      setSelectedUser(null);
      setRejectionReason("");

      // Show success message
      setToast("Account rejected.");
    } catch (err) {
      console.error("Error rejecting user:", err);
      setError(err.message || "Failed to reject user");
    } finally {
      setProcessing(false);
    }
  };

  // Open approval modal
  const openApprovalModal = (user) => {
    setSelectedUser(user);
    setShowApprovalModal(true);
    setError("");
  };

  // Open rejection modal
  const openRejectionModal = (user) => {
    setSelectedUser(user);
    setShowRejectionModal(true);
    setError("");
  };

  // Filter users based on search
  const filteredUsers = pendingUsers.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.fullName?.toLowerCase().includes(search) ||
      user.mobilePhone?.includes(search)
    );
  });

  // Show loading while checking access
  if (checkingAccess) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#155dfd]" />
      </div>
    );
  }

  // Show Access Denied if no permission
  if (!canApproveUsers) {
    return <AccessDenied title="User verification" message="You don't have permission to approve users. Required permission: User.Approve" />;
  }

  const reviewing = selectedUser && (showApprovalModal || showRejectionModal) ? selectedUser : null;
  const rejecting = showRejectionModal;
  const nameOf = (u) => u.fullName || u.username || "Unnamed user";

  const closeReview = () => {
    if (processing) return;
    setShowApprovalModal(false);
    setShowRejectionModal(false);
    setSelectedUser(null);
    setApprovalNotes("");
    setRejectionReason("");
  };

  // One notes box serves both decisions: notes when approving, the reason when rejecting.
  const notes = rejecting ? rejectionReason : approvalNotes;
  const setNotes = (value) => {
    setApprovalNotes(value);
    setRejectionReason(value);
  };

  const typeCounts = pendingUsers.reduce((acc, u) => {
    const t = u.userType || "User";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  const roles = (user) =>
    user.assignedRoles?.length ? (
      <div className="flex flex-wrap gap-1">
        {user.assignedRoles.map((role, idx) => (
          <span key={idx} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-100">
            {role}
          </span>
        ))}
      </div>
    ) : (
      <span className="text-xs text-slate-400">No roles</span>
    );

  const rowActions = (user) => (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => openRejectionModal(user)}
        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
      >
        <X className="h-3.5 w-3.5" />
        Reject
      </button>
      <button
        type="button"
        onClick={() => openApprovalModal(user)}
        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
      >
        <Check className="h-3.5 w-3.5" />
        Approve
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="User verification"
        description="Review new accounts and approve or reject them before they can sign in."
        actions={
          <button type="button" onClick={fetchPendingUsers} disabled={loading} className={btnSecondary}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Waiting for review" value={pendingUsers.length.toLocaleString()} hint="Pending accounts" icon={Clock} tone="bg-amber-50 text-amber-700" />
        {topTypes.slice(0, 2).map(([type, count]) => (
          <StatTile key={type} label={type} value={count.toLocaleString()} hint="Pending" icon={Users} tone="bg-blue-50 text-blue-700" />
        ))}
        <StatTile label="Showing" value={filteredUsers.length.toLocaleString()} hint={searchTerm ? "Matching your search" : "All pending"} icon={UserCheck} tone="bg-violet-50 text-violet-700" />
      </div>

      {error && !reviewing && (
        <Notice tone="error" onClose={() => setError("")}>
          {error}
        </Notice>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-6">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by username, email, name or phone" className="sm:max-w-sm sm:flex-1" />
          <ViewToggle value={view} onChange={setView} className="hidden lg:ml-auto lg:inline-flex" />
        </div>

        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[#155dfd]" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={searchTerm ? Users : CheckCircle2}
            title={searchTerm ? "No matching accounts" : "Nothing waiting"}
            text={searchTerm ? "No pending accounts match your search." : "Every new account has been reviewed."}
          />
        ) : (
          <>
            {/* Table (large screens) */}
            <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Roles</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-slate-50/70">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={nameOf(user)} />
                          <div className="min-w-0">
                            <p className="max-w-[14rem] truncate font-semibold text-slate-900">{nameOf(user)}</p>
                            <p className="text-xs text-slate-500">{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="block max-w-[14rem] truncate text-slate-700">{user.email || "–"}</span>
                        <span className="block text-xs text-slate-500">{user.mobilePhone || "–"}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusPill tone="blue" dot={false}>
                          {user.userType || "User"}
                        </StatusPill>
                      </td>
                      <td className="max-w-[14rem] px-4 py-3.5">{roles(user)}</td>
                      <td className="px-4 py-3.5">
                        <StatusPill tone="amber">{user.approvalStatus || "Pending"}</StatusPill>
                      </td>
                      <td className="px-6 py-3.5">{rowActions(user)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards */}
            <ul className={cardListCls(view)}>
              {filteredUsers.map((user) => (
                <li key={user.userId} className={cardItemCls(view)}>
                  <div className="flex items-start gap-3">
                    <Avatar name={nameOf(user)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{nameOf(user)}</p>
                      <p className="truncate text-xs text-slate-500">{user.username}</p>
                    </div>
                    <StatusPill tone="blue" dot={false}>
                      {user.userType || "User"}
                    </StatusPill>
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="truncate text-slate-700">{user.email || "–"}</dd>
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="text-slate-700">{user.mobilePhone || "–"}</dd>
                    <dt className="text-slate-500">Roles</dt>
                    <dd>{roles(user)}</dd>
                  </dl>
                  <div className="mt-auto pt-3">
                    <div className="border-t border-slate-100 pt-2">{rowActions(user)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Review one account */}
      {reviewing && (
        <Sheet
          open
          onClose={closeReview}
          title="Review account"
          sub={`${nameOf(reviewing)} · ${reviewing.userType || "User"}`}
          leading={<Avatar name={nameOf(reviewing)} className="h-10 w-10 text-sm" />}
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!rejecting) {
                    setShowApprovalModal(false);
                    setShowRejectionModal(true);
                    return;
                  }
                  handleReject();
                }}
                disabled={processing || (rejecting && !rejectionReason.trim())}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
              >
                {processing && rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                {rejecting ? "Reject account" : "Reject…"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (rejecting) {
                    setShowRejectionModal(false);
                    setShowApprovalModal(true);
                    return;
                  }
                  handleApprove();
                }}
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {processing && !rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {rejecting ? "Approve instead" : "Approve account"}
              </button>
            </div>
          }
        >
          {error && <Notice tone="error">{error}</Notice>}

          <DetailCard icon={ClipboardCheck} title="Account">
            <DetailRow label="Full name" value={reviewing.fullName} />
            <DetailRow label="Username" value={reviewing.username} />
            <DetailRow label="Email" value={reviewing.email} />
            <DetailRow label="Phone" value={reviewing.mobilePhone} />
            <DetailRow label="Type" value={reviewing.userType} />
            <DetailRow label="Roles">{reviewing.assignedRoles?.length ? roles(reviewing) : null}</DetailRow>
            <DetailRow label="Status">
              <StatusPill tone="amber">{reviewing.approvalStatus || "Pending"}</StatusPill>
            </DetailRow>
          </DetailCard>

          <section className={`rounded-2xl border bg-white p-5 shadow-sm ${rejecting ? "border-rose-200" : "border-slate-200"}`}>
            <Field label={rejecting ? "Reason for rejecting" : "Approval notes"} required={rejecting}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                placeholder={rejecting ? "Tell them why the account was not approved" : "Optional"}
                className={`${inputCls} h-auto resize-none py-2`}
              />
            </Field>
            {rejecting && <p className="mt-2 text-xs text-rose-600">A reason is required to reject an account.</p>}
          </section>
        </Sheet>
      )}
    </div>
  );
};

export default Verification;
