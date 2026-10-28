import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import CryptoJS from "crypto-js";
import { CalendarPlus, CalendarRange, Eye, Loader2, Pencil, Trash2, UserCheck, UserPlus, Users, UserX, Wallet, X } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import AddClient from "./AddClient";
import { BrokerClientDetailsSheet } from "./ViewClientDetails";
import {
  Avatar,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Notice,
  PageHeader,
  Pager,
  SearchInput,
  Sheet,
  StatTile,
  StatusPill,
  Toast,
  ViewToggle,
  btnPrimary,
  btnSecondary,
  iconBtn,
  inputCls,
} from "../../components/UI/PageKit";
import { cardItemCls, cardListCls, useViewMode } from "../../components/UI/viewMode";
import { useConfirm } from "../../components/UI/useConfirm";

// Constants
const API_BASE_URL = getApiBaseUrl();

// Utility Functions
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};
// The Edit form, in sections. BVN is not here: the API keeps the active/inactive status in field1,
// so a BVN typed into it would overwrite the status.
const EDIT_SECTIONS = [
  {
    title: "Sub agent details",
    icon: Users,
    fields: [
      { name: "insuredName", label: "Sub agent name", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "mobilePhone", label: "Mobile phone" },
      { name: "contactPerson", label: "Contact person" },
      { name: "address", label: "Address", wide: true },
      { name: "type", label: "Type" },
      { name: "brokerID", label: "Super agent ID" },
    ],
  },
  {
    title: "Terms and identity",
    icon: Wallet,
    fields: [
      { name: "rate", label: "Rate", type: "number", step: "0.01" },
      { name: "value", label: "Value" },
      { name: "field2", label: "NIN" },
      { name: "tag", label: "Tag" },
      { name: "remarks", label: "Remarks", wide: true, textarea: true },
    ],
  },
];

const isActive = (client) => String(client.status || "").toUpperCase() === "ACTIVE";

// An on/off switch for activating a sub agent.
const ActiveSwitch = ({ on, busy, onClick }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onClick}
    disabled={busy}
    title={on ? "Deactivate" : "Activate"}
    aria-label={on ? "Deactivate" : "Activate"}
    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? "bg-emerald-500" : "bg-slate-300"}`}
  >
    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
  </button>
);

const ClientList = () => {
  const { user } = useAuth();

  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(null); // stores id of client being toggled

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useViewMode("broker-sub-agents");
  const [confirm, confirmDialog] = useConfirm();
  const [toast, setToast] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  // Go back to the first page whenever the filters change.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, startDate, endDate]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Success message
  const [successMessage, setSuccessMessage] = useState("");
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // ========== EDIT SUB AGENT MODAL ==========
  const emptyEditForm = {
    brokerID: "",
    insuredName: "",
    address: "",
    email: "",
    mobilePhone: "",
    contactPerson: "",
    type: "",
    rate: "",
    value: "",
    field1: "",
    field2: "",
    remarks: "",
    tag: "",
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const openEditModal = useCallback((client) => {
    setEditClient(client);
    setEditForm({
      brokerID: client.brokerId || "",
      insuredName: client.name || "",
      address: client.address || "",
      email: client.email || "",
      mobilePhone: client.phone || "",
      contactPerson: client.contactPerson || "",
      type: client.type || "",
      rate: client.rate ?? "",
      value: client.value ?? "",
      field1: client.field1 || "",
      field2: client.field2 || "",
      remarks: client.remarks || "",
      tag: client.tag || "",
    });
    setEditError("");
    setEditModalOpen(true);
  }, []);

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditClient(null);
    setEditForm(emptyEditForm);
    setEditError("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editClient) return;

    setEditSubmitting(true);
    setEditError("");

    try {
      const token = localStorage.getItem("token");

      const payload = {
        brokerID: editForm.brokerID || "",
        insuredName: editForm.insuredName || "",
        address: editForm.address || "",
        email: editForm.email || "",
        mobilePhone: editForm.mobilePhone || "",
        contactPerson: editForm.contactPerson || "",
        type: editForm.type || "",
        a2: Number(editClient.a2) || 0,
        rate: editForm.rate?.toString() || "",
        value: editForm.value?.toString() || "",
        field1: editForm.field1 || "",
        field2: editForm.field2 || "",
        remarks: editForm.remarks || "",
        tag: editForm.tag || "",
      };

      const response = await fetch(
        `${API_BASE_URL}/Auth/edit-customer/${editClient.insuredId}`,
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
        throw new Error(errorText || "Failed to update sub agent");
      }

      // Update local state (leave field1/field2/status untouched — this
      // endpoint repurposes field1 to drive the activation status/toggle)
      setClients((prev) =>
        prev.map((c) =>
          c.id === editClient.id
            ? {
                ...c,
                brokerId: payload.brokerID,
                name: payload.insuredName,
                address: payload.address,
                email: payload.email,
                phone: payload.mobilePhone,
                contactPerson: payload.contactPerson,
                type: payload.type,
                rate: payload.rate,
                value: payload.value,
                remarks: payload.remarks,
                tag: payload.tag,
              }
            : c,
        ),
      );

      closeEditModal();
      showSuccess("Sub agent updated successfully");
    } catch (err) {
      console.error("Error updating sub agent:", err);
      setEditError(err.message || "Failed to update sub agent");
    } finally {
      setEditSubmitting(false);
    }
  };
  // ========== END EDIT SUB AGENT MODAL ==========

  // Client data transformation
  const transformClientData = useCallback((data) => {
    const clientsData = Array.isArray(data) ? data : [data];

    return clientsData.map((client) => ({
      id: client.insuredId,
      insuredId: client.insuredId,
      brokerId: client.brokerId,
      name: client.insuredName,
      email: client.email,
      phone: client.mobilePhone,
      contactPerson: client.contactPerson,
      address: client.address,
      password: client.password,
      submitDate: client.submitDate,
      type: client.type,
      a1: client.a1,
      a2: client.a2,
      rate: client.rate,
      value: client.value,
      tag: client.tag,
      remarks: client.remarks,
      field1: client.field1,
      field2: client.field2,
      dateAdded: formatDate(client.submitDate),
      status: client.field1 || "Active",
    }));
  }, []);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Decrypt user data function
      const decryptData = (encryptedData) => {
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedData, "your-secret-key");
          const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
          return decryptedString ? JSON.parse(decryptedString) : null;
        } catch (error) {
          console.error("Decryption failed:", error);
          return null;
        }
      };

      // Get broker ID from decrypted user data
      const encryptedUser = localStorage.getItem("user");
      let brokerId = "";

      if (encryptedUser) {
        const userData = decryptData(encryptedUser);

        if (!userData) {
          console.error("Failed to decrypt user data");
        } else {
          console.log("Decrypted user data:", userData);
          brokerId =
            userData.userid ||
            userData.userId ||
            userData.id ||
            userData.brokerId ||
            "";
          console.log("Extracted broker ID:", brokerId);
        }
      }

      // Debug logging
      console.log("Attempting to fetch sub agents for broker ID:", brokerId);

      if (!brokerId) {
        throw new Error("Broker ID not found. Please log in again.");
      }

      const token = localStorage.getItem("token");
      const apiUrl = `${API_BASE_URL}/Auth/brokers/${brokerId}/clients`;

      console.log("Fetching from API:", apiUrl);

      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      console.log("API Response:", response.data);

      if (response.data.success && response.data.data) {
        const mappedClients = transformClientData(response.data.data);
        setClients(mappedClients);
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error("Error fetching sub agents:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch sub agents",
      );
    } finally {
      setLoading(false);
    }
  }, [transformClientData]);

  // Delete clients
  const handleDelete = useCallback(async () => {
    const ok = await confirm({
      title: `Delete ${selectedClients.length} sub agent${selectedClients.length === 1 ? "" : "s"}?`,
      message: "They will be removed for good. This can't be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      setDeleteLoading(true);

      const deletePromises = selectedClients.map(async (clientId) => {
        const response = await fetch(
          `${API_BASE_URL}/InsuredClients/${clientId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(user?.token && { Authorization: `Bearer ${user.token}` }),
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete sub agent ${clientId}: ${response.status}`,
          );
        }

        return clientId;
      });

      await Promise.all(deletePromises);

      // Update local state
      setClients((prev) =>
        prev.filter((client) => !selectedClients.includes(client.id)),
      );
      setToast({ message: `Deleted ${selectedClients.length} sub agent${selectedClients.length === 1 ? "" : "s"}.`, type: "success" });
      setSelectedClients([]);
    } catch (err) {
      console.error("Error deleting clients:", err);
      setError(err.message || "Failed to delete clients");
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedClients, user, confirm]);

  // Handle status toggle
  const handleStatusToggle = useCallback(async (client) => {
    const isCurrentlyActive = (client.field1 || "").toUpperCase() === "ACTIVE";
    const action = isCurrentlyActive ? "deactivate" : "activate";

    const ok = await confirm({
      title: isCurrentlyActive ? "Deactivate this sub agent?" : "Activate this sub agent?",
      message: isCurrentlyActive
        ? `${client.name || "They"} will not be able to sign in until you switch them back on.`
        : `${client.name || "They"} will be able to sign in again.`,
      confirmLabel: isCurrentlyActive ? "Deactivate" : "Activate",
      tone: isCurrentlyActive ? "danger" : "primary",
    });
    if (!ok) return;

    try {
      setToggleLoading(client.id);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/InsuredClients/${action}/${client.insuredId}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );

      const responseData = response?.data;
      const responseMessage =
        typeof responseData === "string"
          ? responseData
          : responseData?.message || "";

      const requestSucceeded =
        response?.status >= 200 &&
        response?.status < 300;

      if (requestSucceeded) {
        // Update local state
        setClients((prev) =>
          prev.map((c) =>
            c.id === client.id
              ? {
                  ...c,
                  field1: isCurrentlyActive ? "INACTIVE" : "ACTIVE",
                  status: isCurrentlyActive ? "INACTIVE" : "ACTIVE",
                }
              : c,
          ),
        );
      } else {
        throw new Error(responseMessage || `Failed to ${action} sub agent`);
      }
    } catch (err) {
      console.error(`Error ${action}ing sub agent:`, err);
      setToast({
        message: err.response?.data?.message || err.message || `Failed to ${action} sub agent`,
        type: "error",
      });
    } finally {
      setToggleLoading(null);
    }
  }, [confirm]);

  // Selection handlers
  const toggleClientSelection = useCallback((clientId) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId],
    );
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Normalize date for comparison
  const normalizeDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        searchTerm === "" ||
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm) ||
        client.insuredId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === "" || client.type === filterType;

      const clientDate = normalizeDate(client.submitDate);
      const matchesStartDate = startDate === "" || clientDate >= startDate;
      const matchesEndDate = endDate === "" || clientDate <= endDate;

      return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
    });
  }, [clients, searchTerm, filterType, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setStartDate("");
    setEndDate("");
  };

  // Memoized values
  const allSelected = useMemo(
    () =>
      paginatedClients.length > 0 &&
      selectedClients.length === paginatedClients.length,
    [paginatedClients.length, selectedClients.length],
  );

  const selectedCount = selectedClients.length;

  // Select all handler (must be after paginatedClients)
  const selectAllClients = useCallback(
    (e) => {
      setSelectedClients(
        e.target.checked ? paginatedClients.map((client) => client.id) : [],
      );
    },
    [paginatedClients],
  );

  // Render states
  if (loading) return <LoadingState label="Loading your sub agents…" />;
  if (error) return <ErrorState title="Could not load your sub agents" message={error} onRetry={fetchClients} />;

  const activeCount = clients.filter(isActive).length;
  const now = new Date();
  const thisMonth = clients.filter((c) => {
    const d = new Date(c.submitDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const filtersOn = Boolean(searchTerm || filterType || startDate || endDate);
  // The types Add sub agent offers, plus any others already in the data.
  const typeOptions = [...new Set(["Individual", "Corporate", "SME", ...clients.map((c) => c.type).filter(Boolean)])];
  const dateFilterCount = [startDate, endDate].filter(Boolean).length;

  const rowActions = (client) => (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={() => setViewId(client.insuredId)} title="View" aria-label="View" className={iconBtn}>
        <Eye className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => openEditModal(client)} title="Edit" aria-label="Edit" className={iconBtn}>
        <Pencil className="h-4 w-4" />
      </button>
      <span className="ml-1.5 inline-flex">
        {toggleLoading === client.id ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : (
          <ActiveSwitch on={isActive(client)} onClick={() => handleStatusToggle(client)} />
        )}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmDialog}

      <PageHeader
        title="Sub agents"
        description="The sub agents working under you."
        actions={
          <button type="button" onClick={() => setAddOpen(true)} className={btnPrimary}>
            <UserPlus className="h-4 w-4" />
            Add sub agent
          </button>
        }
      />

      {successMessage && <Notice onClose={() => setSuccessMessage("")}>{successMessage}</Notice>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Sub agents" value={clients.length.toLocaleString()} hint="Working under you" icon={Users} />
        <StatTile label="Active" value={activeCount.toLocaleString()} hint="Switched on" icon={UserCheck} tone="bg-emerald-50 text-emerald-700" />
        <StatTile label="Inactive" value={(clients.length - activeCount).toLocaleString()} hint="Switched off" icon={UserX} tone="bg-rose-50 text-rose-700" />
        <StatTile label="Added this month" value={thisMonth.toLocaleString()} hint={now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })} icon={CalendarPlus} tone="bg-violet-50 text-violet-700" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="border-b border-slate-100 p-4 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by name, email, phone or ID" className="md:max-w-sm md:flex-1" />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} aria-label="Type" className={`${inputCls} md:w-40`}>
              <option value="">All types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              className={`${btnSecondary} h-10 py-0 ${showFilters ? "border-blue-200 bg-blue-50 text-blue-700" : ""}`}
            >
              <CalendarRange className="h-4 w-4" />
              Date added
              {dateFilterCount > 0 && <span className="rounded-full bg-[#155dfd] px-1.5 text-[11px] font-semibold text-white">{dateFilterCount}</span>}
            </button>
            {filtersOn && (
              <button type="button" onClick={clearFilters} className="text-sm font-medium text-[#155dfd] hover:underline">
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

        {/* Selection bar */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-rose-100 bg-rose-50/60 px-4 py-2.5 text-sm sm:px-6">
            <span className="font-semibold text-rose-900">{selectedCount} selected</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {deleteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete {selectedCount}
            </button>
            <button type="button" onClick={() => setSelectedClients([])} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900">
              <X className="h-3.5 w-3.5" />
              Clear selection
            </button>
          </div>
        )}

        {filteredClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtersOn ? "No sub agents match" : "No sub agents yet"}
            text={filtersOn ? "Try a different search or clear the filters." : "Add your first sub agent to get started."}
            action={
              filtersOn ? (
                <button type="button" onClick={clearFilters} className={btnSecondary}>
                  Clear filters
                </button>
              ) : (
                <button type="button" onClick={() => setAddOpen(true)} className={btnPrimary}>
                  <UserPlus className="h-4 w-4" />
                  Add sub agent
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
                    <th className="w-10 px-5 py-3">
                      <input type="checkbox" aria-label="Select all on this page" checked={allSelected} onChange={selectAllClients} className="h-4 w-4 rounded border-slate-300 accent-[#155dfd]" />
                    </th>
                    <th className="px-3 py-3">Sub agent</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Contact person</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Added</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedClients.map((client) => {
                    const selected = selectedClients.includes(client.id);
                    return (
                      <tr key={client.id} onClick={() => setViewId(client.insuredId)} className={`cursor-pointer ${selected ? "bg-blue-50/50" : "hover:bg-slate-50/70"}`}>
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" aria-label={`Select ${client.name}`} checked={selected} onChange={() => toggleClientSelection(client.id)} className="h-4 w-4 rounded border-slate-300 accent-[#155dfd]" />
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={client.name} />
                            <div className="min-w-0">
                              <p className="max-w-[14rem] truncate font-semibold text-slate-900">{client.name || "Unnamed sub agent"}</p>
                              <p className="text-xs text-slate-500">{client.insuredId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="block max-w-[14rem] truncate text-slate-700">{client.email || "–"}</span>
                          <span className="block text-xs text-slate-500">{client.phone || "–"}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="block max-w-[12rem] truncate text-slate-700">{client.contactPerson || "–"}</span>
                          {client.address && (
                            <span className="block max-w-[12rem] truncate text-xs text-slate-500" title={client.address}>
                              {client.address}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {client.type ? (
                            <StatusPill tone="slate" dot={false}>
                              {client.type}
                            </StatusPill>
                          ) : (
                            <span className="text-slate-400">–</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{client.dateAdded}</td>
                        <td className="px-4 py-3.5">
                          <StatusPill tone={isActive(client) ? "green" : "red"}>{isActive(client) ? "Active" : client.status || "Inactive"}</StatusPill>
                        </td>
                        <td className="px-5 py-3.5">{rowActions(client)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards */}
            <ul className={cardListCls(view)}>
              {paginatedClients.map((client) => {
                const selected = selectedClients.includes(client.id);
                return (
                  <li key={client.id} onClick={() => setViewId(client.insuredId)} className={`${cardItemCls(view)} cursor-pointer ${selected ? "ring-2 ring-blue-200" : ""}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${client.name}`}
                        checked={selected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleClientSelection(client.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#155dfd]"
                      />
                      <Avatar name={client.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{client.name || "Unnamed sub agent"}</p>
                        <p className="text-xs text-slate-500">{client.insuredId}</p>
                      </div>
                      <StatusPill tone={isActive(client) ? "green" : "red"}>{isActive(client) ? "Active" : client.status || "Inactive"}</StatusPill>
                    </div>
                    <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                      <dt className="text-slate-500">Email</dt>
                      <dd className="truncate text-slate-700">{client.email || "–"}</dd>
                      <dt className="text-slate-500">Phone</dt>
                      <dd className="text-slate-700">{client.phone || "–"}</dd>
                      <dt className="text-slate-500">Type</dt>
                      <dd className="text-slate-700">{client.type || "–"}</dd>
                      <dt className="text-slate-500">Added</dt>
                      <dd className="text-slate-700">{client.dateAdded}</dd>
                    </dl>
                    <div className="mt-auto pt-3">
                      <div className="flex justify-end border-t border-slate-100 pt-2">{rowActions(client)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Pager
              page={currentPage}
              totalPages={totalPages}
              total={filteredClients.length}
              pageSize={itemsPerPage}
              onPage={(n) => setCurrentPage(Math.max(1, Math.min(n, totalPages)))}
              onPageSize={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
              sizes={[5, 10, 25, 50, 100]}
              noun="sub agents"
            />
          </>
        )}
      </section>

      {/* Edit a sub agent */}
      {editModalOpen && (
        <Sheet
          open
          onClose={closeEditModal}
          title="Edit sub agent"
          sub={[editClient?.name, editClient?.insuredId].filter(Boolean).join(" · ")}
          leading={<Avatar name={editClient?.name} className="h-10 w-10 text-sm" />}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeEditModal} className={btnSecondary}>
                Cancel
              </button>
              <button type="submit" form="edit-sub-agent-form" disabled={editSubmitting} className={btnPrimary}>
                {editSubmitting ? "Saving…" : "Save changes"}
              </button>
            </div>
          }
        >
          {editError && <Notice tone="error">{editError}</Notice>}
          <form id="edit-sub-agent-form" onSubmit={handleEditSubmit} className="space-y-5">
            {EDIT_SECTIONS.map((section) => (
              <section key={section.title} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
                  <section.icon className="h-4 w-4 text-[#155dfd]" />
                  <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                  {section.fields.map((f) => (
                    <Field key={f.name} label={f.label} required={f.required} wide={f.wide}>
                      {f.textarea ? (
                        <textarea name={f.name} value={editForm[f.name]} onChange={handleEditChange} rows="3" className={`${inputCls} h-auto py-2`} />
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
                  ))}
                </div>
              </section>
            ))}
          </form>
        </Sheet>
      )}

      {/* Add a sub agent */}
      {addOpen && (
        <AddClient
          inSheet
          onClose={() => setAddOpen(false)}
          onCreated={(name) => {
            setAddOpen(false);
            showSuccess(`${name || "The sub agent"} was added.`);
            fetchClients();
          }}
        />
      )}

      {/* One sub agent */}
      {viewId && (
        <BrokerClientDetailsSheet
          clientId={viewId}
          onClose={() => setViewId(null)}
          onEdit={() => {
            const listed = clients.find((c) => c.insuredId === viewId);
            setViewId(null);
            if (listed) openEditModal(listed);
          }}
        />
      )}
    </div>
  );
};

export default ClientList;
