import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  CalendarRange,
  Fingerprint,
  Eye,
  Pencil,
  Plus,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import AddSuperAgent from "./AddSuperAgent";
import { BrokerDetailsSheet } from "./ViewBrokerDetails";
import {
  AccessDenied,
  Avatar,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Sheet,
  Notice,
  PageHeader,
  Pager,
  SearchInput,
  ViewToggle,
  StatTile,
  StatusPill,
  btnPrimary,
  btnSecondary,
  iconBtn,
  inputCls,
} from "../../components/UI/PageKit";
import { cardItemCls, cardListCls, useViewMode } from "../../components/UI/viewMode";

// The fields in the Edit super agent form, by name.
const EDIT_FIELD_LIST = [
  { name: "brokerName", label: "Super agent name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "mobilePhone", label: "Mobile phone" },
  { name: "contactPerson", label: "Contact person" },
  { name: "address", label: "Address", wide: true },
  { name: "insCompanyID", label: "Insurance company ID" },
  { name: "tag", label: "Tag" },
  { name: "rate", label: "Rate", type: "number", step: "0.01" },
  { name: "value", label: "Value" },
  { name: "lStartDate", label: "Licence start date", type: "date" },
  { name: "lEndDate", label: "Licence end date", type: "date" },
  { name: "field1", label: "BVN" },
  { name: "field2", label: "NIN" },
  { name: "remarks", label: "Remarks", wide: true, textarea: true },
];
const EDIT_FIELDS = Object.fromEntries(EDIT_FIELD_LIST.map((f) => [f.name, f]));

// The Edit form's sections, matching the Add super agent form.
const EDIT_SECTIONS = [
  { title: "Agent details", icon: Building2, fields: ["brokerName", "email", "mobilePhone", "contactPerson", "address", "insCompanyID"] },
  { title: "Identity", icon: Fingerprint, fields: ["field1", "field2"] },
  { title: "Licence and terms", icon: CalendarDays, fields: ["lStartDate", "lEndDate", "rate", "value", "tag", "remarks"] },
];

// An on/off switch for activating a super agent.
const ActiveSwitch = ({ on, onClick }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onClick}
    title={on ? "Deactivate" : "Activate"}
    aria-label={on ? "Deactivate" : "Activate"}
    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
      on ? "bg-emerald-500" : "bg-slate-300"
    }`}
  >
    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
  </button>
);

const readStoredPermissions = () => {
  const add = (target, value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((v) => add(target, v));
      return;
    }
    if (typeof value === "string") {
      if (value.trim()) target.add(value.trim());
      return;
    }
    if (typeof value === "object") {
      // handle shapes like { permissionName }, { name }
      add(target, value.permissionName);
      add(target, value.name);
    }
  };

  const perms = new Set();

  // try localStorage.userPermissions first
  try {
    const raw = localStorage.getItem("userPermissions");
    if (raw) {
      const parsed = JSON.parse(raw);
      add(perms, parsed);
    }
  } catch {
    // ignore
  }

  // try encrypted user blob from AuthContext
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      // Note: in this app, "user" may be stored as an encrypted string.
      // We intentionally DON'T decrypt here (to avoid duplicating CryptoJS key logic).
      // If it's JSON, parse it; otherwise ignore and let the backend (403) be the source of truth.
      if (rawUser.trim().startsWith("{")) {
        const parsedUser = JSON.parse(rawUser);
        add(perms, parsedUser.permissions);
        add(perms, parsedUser.userPermissions);
        add(perms, parsedUser.Permissions);
        if (Array.isArray(parsedUser.roles)) {
          parsedUser.roles.forEach((r) => add(perms, r?.permissions));
        }
      }
    }
  } catch {
    // ignore
  }

  return Array.from(perms);
};

const hasAnyPermission = (userPermissions, requiredPermissions) => {
  if (!Array.isArray(userPermissions) || userPermissions.length === 0)
    return false;
  const set = new Set(userPermissions);
  return requiredPermissions.some((p) => set.has(p));
};

const canDeterminePermissions = () => {
  // If we have userPermissions stored, we can safely decide locally.
  // If not, we should NOT block access locally (because permissions may only exist in encrypted user blob).
  try {
    const raw = localStorage.getItem("userPermissions");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
};

// ========== LOCAL STORAGE HELPER FUNCTIONS ==========
const saveBrokerStatusToStorage = (brokerId, status, approvalStatus = "") => {
  try {
    const storedStatuses = JSON.parse(
      localStorage.getItem("brokerStatuses") || "{}",
    );
    storedStatuses[brokerId] = {
      status,
      approvalStatus,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("brokerStatuses", JSON.stringify(storedStatuses));
  } catch (error) {
    console.error("Error saving broker status:", error);
  }
};

const getBrokerStatusFromStorage = (brokerId) => {
  try {
    const storedStatuses = JSON.parse(
      localStorage.getItem("brokerStatuses") || "{}",
    );
    return storedStatuses[brokerId]?.status || null;
  } catch (error) {
    console.error("Error getting broker status:", error);
    return null;
  }
};

const getBrokerApprovalStatusFromStorage = (brokerId) => {
  try {
    const storedStatuses = JSON.parse(
      localStorage.getItem("brokerStatuses") || "{}",
    );
    return storedStatuses[brokerId]?.approvalStatus || null;
  } catch (error) {
    console.error("Error getting broker approval status:", error);
    return null;
  }
};

const clearStoredBrokerStatuses = () => {
  localStorage.removeItem("brokerStatuses");
};

// ========== END LOCAL STORAGE FUNCTIONS ==========

const ManageAgentsBrokers = () => {
  const [agentsBrokers, setAgentsBrokers] = useState([]);
  const [filteredAgentsBrokers, setFilteredAgentsBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [view, setView] = useViewMode("super-agents");

  // The slide-in panels: add, view one super agent. ?new=1 in the address opens Add.
  const [searchParams, setSearchParams] = useSearchParams();
  const [addOpen, setAddOpen] = useState(searchParams.get("new") === "1");
  const [viewId, setViewId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const closeAdd = useCallback(() => {
    setAddOpen(false);
    if (searchParams.get("new")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);
  const closeView = useCallback(() => setViewId(null), []);

  // Add a state for success messages
  const [successMessage, setSuccessMessage] = useState("");

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { day: "2-digit", month: "short", year: "numeric" };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch {
      return "Invalid Date";
    }
  };

  // Show success message temporarily
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // ========== EDIT SUPER AGENT MODAL ==========
  const emptyEditForm = {
    insCompanyID: "",
    brokerName: "",
    address: "",
    email: "",
    mobilePhone: "",
    contactPerson: "",
    rate: "",
    value: "",
    lStartDate: "",
    lEndDate: "",
    field1: "",
    field2: "",
    remarks: "",
    tag: "",
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBroker, setEditBroker] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Convert a date value to a yyyy-mm-dd string for date inputs
  const toDateInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  const openEditModal = (broker) => {
    setEditBroker(broker);
    setEditForm({
      insCompanyID: broker.insCompanyId || broker.insCompanyID || "",
      brokerName: broker.brokerName || "",
      address: broker.address || "",
      email: broker.email || "",
      mobilePhone: broker.mobilePhone || "",
      contactPerson: broker.contactPerson || "",
      rate: broker.rate ?? "",
      value: broker.value ?? "",
      lStartDate: toDateInput(broker.lStartDate),
      lEndDate: toDateInput(broker.lEndDate),
      field1: broker.field1 || "",
      field2: broker.field2 || "",
      remarks: broker.remarks || "",
      tag: broker.tag || "",
    });
    setEditError("");
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditBroker(null);
    setEditForm(emptyEditForm);
    setEditError("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editBroker) return;

    setEditSubmitting(true);
    setEditError("");

    try {
      const token = localStorage.getItem("token");

      const payload = {
        insCompanyID: editForm.insCompanyID || "",
        brokerName: editForm.brokerName || "",
        address: editForm.address || "",
        email: editForm.email || "",
        mobilePhone: editForm.mobilePhone || "",
        contactPerson: editForm.contactPerson || "",
        rate: editForm.rate?.toString() || "",
        value: editForm.value?.toString() || "",
        a2: Number(editBroker.a2) || 0,
        lStartDate: editForm.lStartDate
          ? new Date(editForm.lStartDate).toISOString()
          : null,
        lEndDate: editForm.lEndDate
          ? new Date(editForm.lEndDate).toISOString()
          : null,
        a3: Number(editBroker.a3) || 0,
        a4: Number(editBroker.a4) || 0,
        a5: Number(editBroker.a5) || 0,
        field1: editForm.field1 || "",
        field2: editForm.field2 || "",
        remarks: editForm.remarks || "",
        tag: editForm.tag || "",
      };

      const response = await fetch(
        `${getApiBaseUrl()}/Auth/edit-broker/${editBroker.brokerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update super agent");
      }

      // Update local state so the table reflects the changes
      const updateState = (prev) =>
        prev.map((b) =>
          b.brokerId === editBroker.brokerId
            ? {
                ...b,
                ...payload,
                insCompanyId: payload.insCompanyID,
              }
            : b,
        );
      setAgentsBrokers(updateState);
      setFilteredAgentsBrokers(updateState);

      closeEditModal();
      showSuccess("Super agent updated successfully");
    } catch (err) {
      console.error("Error updating super agent:", err);
      setEditError(err.message || "Failed to update super agent");
    } finally {
      setEditSubmitting(false);
    }
  };
  // ========== END EDIT SUPER AGENT MODAL ==========

  // Handle approve broker
  // Handle Toggle Activation/Deactivation
  const handleToggleActivation = async (broker) => {
    const isCurrentlyActive = broker.isApproved;
    const actionWord = isCurrentlyActive ? "deactivate" : "activate";

    // Add confirmation prompt
    const isConfirmed = window.confirm(
      `Are you sure you want to ${actionWord} this agent?`,
    );
    if (!isConfirmed) return;

    try {
      const token = localStorage.getItem("token");

      const endpoint = isCurrentlyActive
        ? `${getApiBaseUrl()}/Brokers/deactivate/${broker.brokerId}`
        : `${getApiBaseUrl()}/Brokers/activate/${broker.brokerId}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to ${actionWord} agent`);
      }

      showSuccess(`Agent ${actionWord}d successfully`);

      // Update local state
      const updateState = (prev) =>
        prev.map((b) =>
          b.brokerId === broker.brokerId
            ? { ...b, isApproved: !isCurrentlyActive }
            : b,
        );
      setAgentsBrokers(updateState);
      setFilteredAgentsBrokers(updateState);
    } catch (err) {
      console.error("Error toggling activation:", err);
      alert(err.message || `Failed to modify agent status. Please try again.`);
    }
  };

  const handleApproveBroker = async (broker) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found.");

      const requestBody = {
        userId: String(broker.brokerId),
        userType: "Broker",
        approvalNotes: "Broker approved via admin panel",
      };

      console.log("Approving broker:", {
        brokerId: broker.brokerId,
        requestBody,
      });

      // Optimistic update
      const updateState = (prev) =>
        prev.map((b) =>
          b.brokerId === broker.brokerId
            ? {
                ...b,
                tag: "Active",
                status: "Active",
                approvalStatus: "Approved",
                approvedDate: new Date().toISOString(),
              }
            : b,
        );

      setAgentsBrokers(updateState);
      setFilteredAgentsBrokers(updateState);

      // Save to localStorage
      saveBrokerStatusToStorage(broker.brokerId, "Active", "Approved");

      const response = await fetch(
        `${getApiBaseUrl()}/Auth/approvals/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        // Revert on error
        const revertState = (prev) =>
          prev.map((b) => (b.brokerId === broker.brokerId ? broker : b));

        setAgentsBrokers(revertState);
        setFilteredAgentsBrokers(revertState);

        // Clear localStorage on error
        clearStoredBrokerStatuses();

        const errorText = await response.text();
        console.error("Approve error:", { status: response.status, errorText });
        throw new Error(`Failed to approve broker: ${errorText}`);
      }

      const result = await response.json();
      console.log("Approve successful:", result);

      showSuccess("Broker approved successfully");
    } catch (err) {
      console.error("Error approving broker:", err);
      alert(err.message || "Failed to approve broker. Please try again.");
    }
  };

  // Handle reject broker
  const handleRejectBroker = async (broker) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found.");

      const requestBody = {
        userId: String(broker.brokerId),
        userType: "Broker",
        rejectionReason: "Broker rejected via admin panel",
      };

      console.log("Rejecting broker:", {
        brokerId: broker.brokerId,
        requestBody,
      });

      // Optimistic update
      const updateState = (prev) =>
        prev.map((b) =>
          b.brokerId === broker.brokerId
            ? {
                ...b,
                tag: "Inactive",
                status: "Inactive",
                approvalStatus: "Rejected",
                approvedDate: new Date().toISOString(),
              }
            : b,
        );

      setAgentsBrokers(updateState);
      setFilteredAgentsBrokers(updateState);

      // Save to localStorage
      saveBrokerStatusToStorage(broker.brokerId, "Inactive", "Rejected");

      const response = await fetch(`${getApiBaseUrl()}/Auth/approvals/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Revert on error
        const revertState = (prev) =>
          prev.map((b) => (b.brokerId === broker.brokerId ? broker : b));

        setAgentsBrokers(revertState);
        setFilteredAgentsBrokers(revertState);

        // Clear localStorage on error
        clearStoredBrokerStatuses();

        const errorText = await response.text();
        console.error("Reject error:", { status: response.status, errorText });
        throw new Error(`Failed to reject broker: ${errorText}`);
      }

      const result = await response.json();
      console.log("Reject successful:", result);

      showSuccess("Broker rejected successfully");
    } catch (err) {
      console.error("Error rejecting broker:", err);
      alert(err.message || "Failed to reject broker. Please try again.");
    }
  };

  // Handle broker status toggle (approve/reject)
  const handleStatusToggle = async (brokerId, currentStatus) => {
    const broker = agentsBrokers.find((b) => b.brokerId === brokerId);
    if (!broker) {
      alert("Broker not found");
      return;
    }

    const isCurrentlyActive = currentStatus?.toLowerCase() === "active";
    const action = isCurrentlyActive ? "reject" : "approve";

    // Confirmation dialog
    const confirmMessage = isCurrentlyActive
      ? `Are you sure you want to deactivate broker ${broker.brokerName || broker.brokerId}? This will mark them as rejected.`
      : `Are you sure you want to activate broker ${broker.brokerName || broker.brokerId}? This will mark them as approved.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      if (action === "approve") {
        await handleApproveBroker(broker);
      } else {
        await handleRejectBroker(broker);
      }
    } catch (err) {
      console.error(`Error ${action}ing broker:`, err);
      // Error is already handled in the individual functions
    }
  };

  // Transform broker data with localStorage status
  const transformBrokerData = (broker) => {
    const brokerId = broker.brokerId;

    // Get stored status from localStorage first
    const storedStatus = getBrokerStatusFromStorage(brokerId);
    const storedApprovalStatus = getBrokerApprovalStatusFromStorage(brokerId);

    // Determine the final status
    let finalStatus = "Active"; // Default

    // Priority: localStorage > API approvalStatus > API tag > default
    if (storedStatus) {
      finalStatus = storedStatus;
    } else if (broker.approvalStatus) {
      // Map approvalStatus from API to frontend status
      finalStatus =
        broker.approvalStatus === "Rejected"
          ? "Inactive"
          : broker.approvalStatus === "Approved"
            ? "Active"
            : broker.approvalStatus === "Pending"
              ? "Pending"
              : "Active";
    } else if (broker.tag) {
      finalStatus = broker.tag;
    } else if (broker.status) {
      finalStatus = broker.status;
    }

    return {
      ...broker,
      tag: finalStatus,
      status: finalStatus,
      approvalStatus: storedApprovalStatus || broker.approvalStatus || "",
    };
  };

  // Fetch agents/brokers from API
  useEffect(() => {
    const fetchAgentsBrokers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check local permissions first *only if* we can reliably read them.
        // (In this app, permissions may be stored only inside an encrypted user blob.)
        const requiredPermissions = ["SuperAgent.View", "Broker.View"];
        const storedPermissions = readStoredPermissions();
        if (canDeterminePermissions()) {
          const hasPermission = hasAnyPermission(
            storedPermissions,
            requiredPermissions,
          );
          if (!hasPermission) {
            setHasAccess(false);
            setAccessError(
              "You don't have permission to view Super Agents. Please request access from an administrator.",
            );
            return;
          }
        }

        setHasAccess(true);
        setAccessError("");

        const token = localStorage.getItem("token");

        const response = await axios.get(`${getApiBaseUrl()}/Auth/brokers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("API Response:", response.data);

        // Extract data from response and transform with localStorage status
        const brokersData = response.data.data || response.data || [];
        const transformedBrokers = brokersData.map(transformBrokerData);

        setAgentsBrokers(transformedBrokers);
        setFilteredAgentsBrokers(transformedBrokers);
      } catch (err) {
        console.error("Fetch error:", err);
        console.error("Error response:", err.response);

        if (err?.response?.status === 403) {
          setHasAccess(false);
          setAccessError(
            "Access Denied. You don't have permission to view Super Agents.",
          );
          return;
        }

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch agents/brokers",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAgentsBrokers();
  }, [reloadKey]);

  // Handle search and filter
  const handleSearch = useCallback(() => {
    let filtered = [...agentsBrokers];

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((broker) => {
        return (
          broker.brokerId?.toLowerCase().includes(searchLower) ||
          broker.brokerName?.toLowerCase().includes(searchLower) ||
          broker.email?.toLowerCase().includes(searchLower) ||
          broker.mobilePhone?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((broker) => {
        const computedStatus = broker.isApproved ? "active" : "inactive";
        return computedStatus === statusFilter.toLowerCase();
      });
    }

    // Apply date range filter
    if (startDate || endDate) {
      const normalizeDate = (value) => {
        const dateObject = new Date(value);
        if (Number.isNaN(dateObject.getTime())) {
          return null;
        }
        return new Date(
          dateObject.getFullYear(),
          dateObject.getMonth(),
          dateObject.getDate(),
        );
      };

      const start = startDate ? normalizeDate(startDate) : null;
      const end = endDate ? normalizeDate(endDate) : null;

      filtered = filtered.filter((broker) => {
        const rawDate = broker.submitDate;
        if (!rawDate) {
          return false;
        }

        const normalizedDate = normalizeDate(rawDate);
        if (!normalizedDate) {
          return false;
        }

        if (start && end) {
          return normalizedDate >= start && normalizedDate <= end;
        }
        if (start) {
          return normalizedDate >= start;
        }
        if (end) {
          return normalizedDate <= end;
        }
        return true;
      });
    }

    setFilteredAgentsBrokers(filtered);
  }, [agentsBrokers, searchTerm, statusFilter, startDate, endDate]);

  // Auto-apply filters when dependencies change
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setFilteredAgentsBrokers(agentsBrokers);
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const activeFilterCount = [
    searchTerm.trim(),
    statusFilter !== "all" ? statusFilter : "",
    startDate,
    endDate,
  ].filter(Boolean).length;

  // Pagination calculations
  const totalPages = Math.ceil(filteredAgentsBrokers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBrokers = filteredAgentsBrokers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, startDate, endDate]);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Get status badge color
  const getStatusBadge = (tag) => {
    const status = tag?.toLowerCase() || "active";

    switch (status) {
      case "active":
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
      case "suspended":
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  if (loading) {
    return <LoadingState label="Loading super agents…" />;
  }

  if (hasAccess === false) {
    return <AccessDenied title="Super agents" message={accessError} />;
  }

  if (error) {
    return <ErrorState title="Could not load super agents" message={error} onRetry={() => window.location.reload()} />;
  }

  const activeCount = agentsBrokers.filter((b) => b.isApproved).length;
  const dateFilterCount = [startDate, endDate].filter(Boolean).length;

  const rowActions = (broker) => (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={() => setViewId(broker.brokerId)} title="View" aria-label="View" className={iconBtn}>
        <Eye className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => openEditModal(broker)} title="Edit" aria-label="Edit" className={iconBtn}>
        <Pencil className="h-4 w-4" />
      </button>
      <span className="ml-1.5">
        <ActiveSwitch on={!!broker.isApproved} onClick={() => handleToggleActivation(broker)} />
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super agents"
        description="Every registered super agent across all companies."
        actions={
          <button type="button" onClick={() => setAddOpen(true)} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Add super agent
          </button>
        }
      />

      {successMessage && <Notice onClose={() => setSuccessMessage("")}>{successMessage}</Notice>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Total" value={agentsBrokers.length.toLocaleString()} hint="Registered super agents" icon={Users} />
        <StatTile label="Active" value={activeCount.toLocaleString()} hint="Can sign in and issue" icon={UserCheck} tone="bg-emerald-50 text-emerald-700" />
        <StatTile label="Inactive" value={(agentsBrokers.length - activeCount).toLocaleString()} hint="Switched off" icon={UserX} tone="bg-rose-50 text-rose-700" />
        <StatTile label="Showing" value={filteredAgentsBrokers.length.toLocaleString()} hint={activeFilterCount ? "Matching your filters" : "No filters applied"} icon={CalendarRange} tone="bg-violet-50 text-violet-700" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="border-b border-slate-100 p-4 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name, ID, email or phone"
              className="md:max-w-sm md:flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Status"
              className={`${inputCls} md:w-40`}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="button"
              onClick={toggleFilters}
              aria-expanded={showFilters}
              className={`${btnSecondary} h-10 py-0 ${showFilters ? "border-blue-200 bg-blue-50 text-blue-700" : ""}`}
            >
              <CalendarRange className="h-4 w-4" />
              Registration date
              {dateFilterCount > 0 && (
                <span className="rounded-full bg-[#155dfd] px-1.5 text-[11px] font-semibold text-white">{dateFilterCount}</span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button type="button" onClick={handleClearFilters} className="text-sm font-medium text-[#155dfd] hover:underline">
                Clear filters
              </button>
            )}
            <ViewToggle value={view} onChange={setView} className="hidden lg:ml-auto lg:inline-flex" />
          </div>

          {showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:max-w-lg">
              <Field label="From">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
              </Field>
              <Field label="To">
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
              </Field>
            </div>
          )}
        </div>

        {filteredAgentsBrokers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No super agents found"
            text={activeFilterCount ? "Try a different search or clear the filters." : "No super agents are registered yet."}
            action={
              activeFilterCount ? (
                <button type="button" onClick={handleClearFilters} className={btnSecondary}>
                  Clear filters
                </button>
              ) : (
                <button type="button" onClick={() => setAddOpen(true)} className={btnPrimary}>
                  <Plus className="h-4 w-4" />
                  Add super agent
                </button>
              )
            }
          />
        ) : (
          <>
            {/* Table (large screens) */}
            <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Super agent</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBrokers.map((broker, index) => (
                    <tr key={broker.brokerId || index} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={broker.brokerName} />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setViewId(broker.brokerId)}
                              className="block max-w-[16rem] truncate font-semibold text-slate-900 hover:text-[#155dfd] text-left"
                            >
                              {broker.brokerName || "Unnamed"}
                            </button>
                            <span className="block text-xs text-slate-500">{broker.brokerId || "No ID"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="block max-w-[15rem] truncate text-slate-700">{broker.email || "–"}</span>
                        <span className="block text-xs text-slate-500">{broker.mobilePhone || "–"}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{broker.insCompanyId || "–"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{formatDate(broker.submitDate)}</td>
                      <td className="px-4 py-3.5">
                        <StatusPill tone={broker.isApproved ? "green" : "red"}>{broker.isApproved ? "Active" : "Inactive"}</StatusPill>
                      </td>
                      <td className="px-6 py-3.5">{rowActions(broker)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards (phones and tablets) */}
            <ul className={cardListCls(view)}>
              {paginatedBrokers.map((broker, index) => (
                <li key={broker.brokerId || index} className={cardItemCls(view)}>
                  <div className="flex items-start gap-3">
                    <Avatar name={broker.brokerName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setViewId(broker.brokerId)}
                          className="truncate font-semibold text-slate-900 hover:text-[#155dfd] text-left"
                        >
                          {broker.brokerName || "Unnamed"}
                        </button>
                        <StatusPill tone={broker.isApproved ? "green" : "red"}>{broker.isApproved ? "Active" : "Inactive"}</StatusPill>
                      </div>
                      <p className="text-xs text-slate-500">{broker.brokerId || "No ID"}</p>
                      <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                        <dt className="text-slate-500">Email</dt>
                        <dd className="truncate text-slate-700">{broker.email || "–"}</dd>
                        <dt className="text-slate-500">Phone</dt>
                        <dd className="text-slate-700">{broker.mobilePhone || "–"}</dd>
                        <dt className="text-slate-500">Company</dt>
                        <dd className="text-slate-700">{broker.insCompanyId || "–"}</dd>
                        <dt className="text-slate-500">Registered</dt>
                        <dd className="text-slate-700">{formatDate(broker.submitDate)}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-auto pt-3">
                    <div className="flex justify-end border-t border-slate-100 pt-2">{rowActions(broker)}</div>
                  </div>
                </li>
              ))}
            </ul>

            <Pager
              page={currentPage}
              totalPages={totalPages}
              total={filteredAgentsBrokers.length}
              pageSize={itemsPerPage}
              onPage={goToPage}
              onPageSize={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
              sizes={[5, 10, 25, 50]}
              noun="super agents"
            />
          </>
        )}
      </section>

      {/* Edit super agent */}
      {editModalOpen && (
        <Sheet
          open
          onClose={closeEditModal}
          title="Edit super agent"
          sub={[editBroker?.brokerName, editBroker?.brokerId].filter(Boolean).join(" · ")}
          leading={<Avatar name={editBroker?.brokerName} className="h-10 w-10 text-sm" />}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeEditModal} className={btnSecondary}>
                Cancel
              </button>
              <button type="submit" form="edit-super-agent-form" disabled={editSubmitting} className={btnPrimary}>
                {editSubmitting ? "Saving…" : "Save changes"}
              </button>
            </div>
          }
        >
          {editError && <Notice tone="error">{editError}</Notice>}
          <form id="edit-super-agent-form" onSubmit={handleEditSubmit} className="space-y-5">
            {EDIT_SECTIONS.map((section) => (
              <section key={section.title} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
                  <section.icon className="h-4 w-4 text-[#155dfd]" />
                  <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                  {section.fields.map((name) => {
                    const f = EDIT_FIELDS[name];
                    return (
                      <Field key={f.name} label={f.label} required={f.required} wide={f.wide}>
                        {f.textarea ? (
                          <textarea
                            name={f.name}
                            value={editForm[f.name]}
                            onChange={handleEditChange}
                            rows="3"
                            className={`${inputCls} h-auto py-2`}
                          />
                        ) : (
                          <input
                            name={f.name}
                            type={f.type || "text"}
                            step={f.step}
                            value={editForm[f.name]}
                            onChange={handleEditChange}
                            required={f.required}
                            className={inputCls}
                          />
                        )}
                      </Field>
                    );
                  })}
                </div>
              </section>
            ))}
          </form>
        </Sheet>
      )}

      {/* Add super agent */}
      {addOpen && (
        <AddSuperAgent
          inSheet
          onClose={closeAdd}
          onCreated={(name) => {
            closeAdd();
            showSuccess(`${name || "Super agent"} was added.`);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {/* View one super agent */}
      {viewId && (
        <BrokerDetailsSheet
          brokerId={viewId}
          onClose={closeView}
          onEdit={() => {
            const listed = agentsBrokers.find((b) => b.brokerId === viewId);
            setViewId(null);
            if (listed) openEditModal(listed);
          }}
        />
      )}
    </div>
  );
};

export default ManageAgentsBrokers;
