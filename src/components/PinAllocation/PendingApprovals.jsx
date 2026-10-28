// src/components/PinAllocation/PendingApprovals.jsx
import React, { useState, useEffect } from "react";
import { Check, CheckCircle2, ClipboardCheck, Clock, KeyRound, Loader2, X } from "lucide-react";
import PinService from "../../services/PinServices";
import UserService from "../../services/UserServices";
import CryptoJS from "crypto-js";
import {
  Avatar,
  DetailCard,
  DetailRow,
  EmptyState,
  Field,
  Notice,
  PermissionRequired,
  SearchInput,
  Sheet,
  StatusPill,
  Toast,
  ViewToggle,
  btnPrimary,
  btnSecondary,
  inputCls,
} from "../UI/PageKit";
import { cardItemCls, cardListCls, useViewMode } from "../UI/viewMode";

const PendingApprovals = ({ onApprovalSuccess }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [hasViewPendingPermission, setHasViewPendingPermission] =
    useState(null);
  const [hasApprovePermission, setHasApprovePermission] = useState(null);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [showPermissionDenied, setShowPermissionDenied] = useState({
    show: false,
    permission: "",
    action: "",
  });

  // Decryption function
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

  // Check for all Pin permissions
  const checkPermissions = () => {
    try {
      setCheckingPermission(true);

      // Get encrypted user data from localStorage
      const encryptedUser = localStorage.getItem("user");
      if (!encryptedUser) {
        setAllPermissionsFalse();
        setCheckingPermission(false);
        return;
      }

      // Decrypt user data
      const userData = decryptData(encryptedUser);
      if (!userData) {
        setAllPermissionsFalse();
        setCheckingPermission(false);
        return;
      }

      // Extract permissions from user data
      let permissions = [];

      // Check different possible locations for permissions
      if (userData.permissions && Array.isArray(userData.permissions)) {
        permissions = userData.permissions;
      } else if (
        userData.userPermissions &&
        Array.isArray(userData.userPermissions)
      ) {
        permissions = userData.userPermissions;
      } else if (userData.Permissions && Array.isArray(userData.Permissions)) {
        permissions = userData.Permissions;
      } else if (userData.roles && Array.isArray(userData.roles)) {
        const allPermissions = [];
        userData.roles.forEach((role) => {
          if (role.permissions && Array.isArray(role.permissions)) {
            allPermissions.push(...role.permissions);
          }
        });
        permissions = allPermissions;
      }

      // Check for each permission
      const hasViewPending = checkSpecificPermission(
        permissions,
        "Pin.ViewPending",
        60,
      );
      const hasApprove = checkSpecificPermission(
        permissions,
        "Pin.Approve",
        58,
      );

      setHasViewPendingPermission(hasViewPending);
      setHasApprovePermission(hasApprove);
    } catch (error) {
      console.error("Error checking permissions:", error);
      setAllPermissionsFalse();
    } finally {
      setCheckingPermission(false);
    }
  };

  const checkSpecificPermission = (
    permissions,
    permissionName,
    permissionId,
  ) => {
    return permissions.some((permission) => {
      if (typeof permission === "string") {
        return permission === permissionName;
      } else if (typeof permission === "object") {
        return (
          permission.permissionName === permissionName ||
          permission.name === permissionName ||
          permission.permissionID === permissionId
        );
      }
      return false;
    });
  };

  const setAllPermissionsFalse = () => {
    setHasViewPendingPermission(false);
    setHasApprovePermission(false);
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  // Load data only if user has view permission
  useEffect(() => {
    if (hasViewPendingPermission === true) {
      loadData();
    }
  }, [hasViewPendingPermission]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const showPermissionDeniedModal = (permission, action) => {
    setShowPermissionDenied({ show: true, permission, action });
  };

  const closePermissionDeniedModal = () => {
    setShowPermissionDenied({ show: false, permission: "", action: "" });
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load both pending requests and brokers in parallel
      const [requests, brokersData] = await Promise.all([
        PinService.getPendingAllocations(),
        UserService.getBrokers().catch(() => []), // Fallback to empty array if service fails
      ]);

      // Transform the API response to match component expectations
      const transformedRequests = Array.isArray(requests)
        ? requests.map((request) => ({
            allocationId: request.allocationId,
            brokerId: request.toUserId, // Map toUserId to brokerId
            pinAmount: request.pinAmount,
            remarks: request.remarks,
            requestedBy: request.fromUserName || request.fromUserId, // Use fromUserName or fromUserId
            requestDate: request.allocatedDate, // Map allocatedDate to requestDate
            status: request.status,
            // Include additional fields from API for display
            fromUserId: request.fromUserId,
            fromUserName: request.fromUserName,
            toUserName: request.toUserName,
            allocatedDate: request.allocatedDate,
            allocatedBy: request.allocatedBy,
          }))
        : [];

      setPendingRequests(transformedRequests);
      setBrokers(Array.isArray(brokersData) ? brokersData : []);
    } catch (error) {
      console.error("Failed to load data:", error);
      setPendingRequests([]);
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  };

  // Get broker details by brokerId (now using toUserId)
  const getBrokerDetails = (brokerId) => {
    const broker = brokers.find(
      (b) => b.brokerId === brokerId || b.userId === brokerId,
    );
    return broker || null;
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const handleApproval = async (allocationId, isApproved, approvalRemarks) => {
    // Check permission before approval
    if (!hasApprovePermission) {
      showPermissionDeniedModal(
        "Pin.Approve",
        "approve or reject PIN allocations",
      );
      return null;
    }

    setApproving(allocationId);
    try {
      await PinService.approveAllocation(
        allocationId,
        isApproved,
        approvalRemarks,
      );
      await loadData();

      if (onApprovalSuccess) {
        onApprovalSuccess(isApproved);
      } else {
        showToast(isApproved ? "PIN allocation approved." : "PIN allocation rejected.");
      }
      return true;
    } catch (error) {
      console.error("Approval error:", error);
      return false;
    } finally {
      setApproving(null);
    }
  };

  const filteredRequests = pendingRequests.filter((request) => {
    const broker = getBrokerDetails(request.brokerId);
    const brokerName =
      broker?.brokerName || broker?.fullName || request.toUserName || "";

    return (
      brokerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.brokerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.toUserName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // The review panel for one request.
  const [view, setView] = useViewMode("pin-approvals");
  const [reviewing, setReviewing] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reviewError, setReviewError] = useState("");

  const openReview = (request) => {
    setReviewing(request);
    setReviewRemarks("");
    setReviewError("");
  };
  const closeReview = () => setReviewing(null);

  const decide = async (isApproved) => {
    if (!isApproved && !reviewRemarks.trim()) {
      setReviewError("Give a reason for rejecting this request.");
      return;
    }
    setReviewError("");
    const ok = await handleApproval(reviewing.allocationId, isApproved, reviewRemarks.trim());
    if (ok) closeReview();
    else if (ok === false) setReviewError(`Could not ${isApproved ? "approve" : "reject"} this request. Please try again.`);
  };

  const agentOf = (request) => {
    const broker = getBrokerDetails(request.brokerId);
    return {
      name: broker?.brokerName || broker?.fullName || request.toUserName || "Unknown super agent",
      email: broker?.email || null,
      company: broker?.companyId || broker?.insCompanyId || null,
    };
  };

  const header = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Pending approvals</h2>
        <p className="text-sm text-slate-500">Allocation requests waiting for a decision.</p>
      </div>
    </div>
  );

  // Show loading while checking permission
  if (checkingPermission || (hasViewPendingPermission && loading)) {
    return (
      <div className="space-y-5">
        {header}
        <div className="grid place-items-center py-16 text-sm text-slate-500">
          <Loader2 className="mb-3 h-6 w-6 animate-spin text-[#155dfd]" />
          {checkingPermission ? "Checking your permissions…" : "Loading pending requests…"}
        </div>
      </div>
    );
  }

  // Show permission denied if user doesn't have Pin.ViewPending
  if (!hasViewPendingPermission) {
    return (
      <div className="space-y-5">
        {header}
        <PermissionRequired action="view pending PIN allocations" />
      </div>
    );
  }

  const rowCount = (r) => (
    <span className="whitespace-nowrap text-base font-bold tabular-nums text-slate-900">
      {Number(r.pinAmount || 0).toLocaleString()}
      <span className="ml-1 text-xs font-medium text-slate-500">PINs</span>
    </span>
  );

  const reviewButton = (r) => (
    <button type="button" onClick={() => openReview(r)} className={`${btnSecondary} px-3 py-1.5`}>
      <ClipboardCheck className="h-4 w-4" />
      Review
    </button>
  );

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {header}

      {showPermissionDenied.show && (
        <Notice tone="error" onClose={closePermissionDeniedModal}>
          You need permission to {showPermissionDenied.action}.
        </Notice>
      )}

      {!hasApprovePermission && (
        <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <Clock className="h-4 w-4 shrink-0 text-amber-600" />
          View only. You need the Pin.Approve permission to approve or reject requests.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by super agent, ID, requester or remarks" className="sm:max-w-sm sm:flex-1" />
        <span className="text-sm text-slate-500">
          {filteredRequests.length} request{filteredRequests.length === 1 ? "" : "s"}
        </span>
        <ViewToggle value={view} onChange={setView} className="hidden lg:ml-auto lg:inline-flex" />
      </div>

      {filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200">
          <EmptyState
            icon={searchTerm ? Clock : CheckCircle2}
            title={searchTerm ? "No matching requests" : "Nothing waiting"}
            text={searchTerm ? "Try a different search." : "Every allocation request has been dealt with."}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          {/* Table (large screens) */}
          <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Super agent</th>
                  <th className="px-4 py-3">Requested by</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Remarks</th>
                  <th className="px-4 py-3 text-right">PINs</th>
                  <th className="px-5 py-3 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRequests.map((r) => {
                  const agent = agentOf(r);
                  return (
                    <tr key={r.allocationId} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={agent.name} />
                          <div className="min-w-0">
                            <p className="max-w-[15rem] truncate font-semibold text-slate-900">{agent.name}</p>
                            <p className="text-xs text-slate-500">
                              {r.brokerId} · #{r.allocationId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{r.requestedBy || r.fromUserId || "–"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{formatDate(r.requestDate)}</td>
                      <td className="max-w-[16rem] truncate px-4 py-3.5 text-slate-500" title={r.remarks || ""}>
                        {r.remarks || "–"}
                      </td>
                      <td className="px-4 py-3.5 text-right">{rowCount(r)}</td>
                      <td className="px-5 py-3.5 text-right">{reviewButton(r)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards */}
          <ul className={`${cardListCls(view)} bg-white`}>
            {filteredRequests.map((r) => {
              const agent = agentOf(r);
              return (
                <li key={r.allocationId} className={cardItemCls(view)}>
                  <div className="flex items-start gap-3">
                    <Avatar name={agent.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{agent.name}</p>
                      <p className="text-xs text-slate-500">
                        {r.brokerId} · #{r.allocationId}
                      </p>
                    </div>
                    {rowCount(r)}
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-slate-500">Requested by</dt>
                    <dd className="truncate text-slate-700">{r.requestedBy || r.fromUserId || "–"}</dd>
                    <dt className="text-slate-500">Submitted</dt>
                    <dd className="text-slate-700">{formatDate(r.requestDate)}</dd>
                    <dt className="text-slate-500">Remarks</dt>
                    <dd className="truncate text-slate-700">{r.remarks || "–"}</dd>
                  </dl>
                  <div className="mt-auto pt-3">
                    <div className="flex justify-end border-t border-slate-100 pt-2">{reviewButton(r)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Review one request */}
      {reviewing &&
        (() => {
          const agent = agentOf(reviewing);
          const busy = approving === reviewing.allocationId;
          return (
            <Sheet
              open
              onClose={closeReview}
              title={`Review request #${reviewing.allocationId}`}
              sub={`${agent.name} · ${formatDate(reviewing.requestDate)}`}
              leading={<Avatar name={agent.name} className="h-10 w-10 text-sm" />}
              footer={
                hasApprovePermission ? (
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => decide(false)}
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(true)}
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button type="button" onClick={closeReview} className={btnPrimary}>
                      Close
                    </button>
                  </div>
                )
              }
            >
              {reviewError && <Notice tone="error">{reviewError}</Notice>}

              <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#155dfd] text-white">
                  <KeyRound className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {Number(reviewing.pinAmount || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600">PINs requested for {agent.name}</p>
                </div>
                <span className="ml-auto">
                  <StatusPill tone="amber">{reviewing.status || "Pending"}</StatusPill>
                </span>
              </div>

              <DetailCard title="Request">
                <DetailRow label="Super agent" value={agent.name} />
                <DetailRow label="Super agent ID" value={reviewing.brokerId} />
                <DetailRow label="Company" value={agent.company} />
                <DetailRow label="Email" value={agent.email} />
                <DetailRow label="Requested by" value={reviewing.requestedBy || reviewing.fromUserId} />
                <DetailRow label="Submitted" value={formatDate(reviewing.requestDate)} />
                <DetailRow label="Remarks" value={reviewing.remarks} />
              </DetailCard>

              {hasApprovePermission && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <Field label="Your remarks">
                    <textarea
                      value={reviewRemarks}
                      onChange={(e) => setReviewRemarks(e.target.value)}
                      rows="3"
                      placeholder="Optional when approving. Required when rejecting."
                      className={`${inputCls} h-auto resize-none py-2`}
                    />
                  </Field>
                </section>
              )}
            </Sheet>
          );
        })()}
    </div>
  );
};

export default PendingApprovals;
