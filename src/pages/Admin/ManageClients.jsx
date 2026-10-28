import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { Briefcase, CalendarPlus, CalendarRange, Eye, Fingerprint, Pencil, Search, UserRound, Users, Wallet } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import { ClientDetailsSheet } from "./ViewClientDetails";
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

// Constants
const API_BASE_URL = getApiBaseUrl();

// The fields in the Edit sub agent form, by name.
const EDIT_FIELD_LIST = [
  { name: "insuredName", label: "Sub agent name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "mobilePhone", label: "Mobile phone" },
  { name: "contactPerson", label: "Contact person" },
  { name: "address", label: "Address", wide: true },
  { name: "brokerID", label: "Super agent (broker ID)" },
  { name: "type", label: "Type" },
  { name: "tag", label: "Tag" },
  { name: "rate", label: "Rate", type: "number", step: "0.01" },
  { name: "value", label: "Value" },
  { name: "field1", label: "BVN" },
  { name: "field2", label: "NIN" },
  { name: "remarks", label: "Remarks", wide: true, textarea: true },
];
const EDIT_FIELDS = Object.fromEntries(EDIT_FIELD_LIST.map((f) => [f.name, f]));

// The Edit form's sections.
const EDIT_SECTIONS = [
  { title: "Sub agent details", icon: UserRound, fields: ["insuredName", "email", "mobilePhone", "contactPerson", "address", "brokerID", "type"] },
  { title: "Identity", icon: Fingerprint, fields: ["field1", "field2"] },
  { title: "Terms", icon: Wallet, fields: ["rate", "value", "tag", "remarks"] },
];

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

const ManageClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Permission check states
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [view, setView] = useViewMode("sub-agents");

  // The slide-in panel for one sub agent.
  const [viewId, setViewId] = useState(null);
  const closeView = useCallback(() => setViewId(null), []);

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

  const openEditModal = (client) => {
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
  };

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

      // Update local state so the table reflects the changes
      setClients((prev) =>
        prev.map((c) =>
          c.insuredId === editClient.insuredId
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
                field1: payload.field1,
                field2: payload.field2,
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
      submitDate: client.submitDate,
      type: client.type,
      tag: client.tag,
      remarks: client.remarks,
      rate: client.rate,
      value: client.value,
      field1: client.field1,
      field2: client.field2,
      a2: client.a2,
      dateAdded: formatDate(client.submitDate),
    }));
  }, []);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const apiUrl = `${API_BASE_URL}/Auth/clients`;

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
      console.error("Error fetching clients:", err);

      // Handle 403 Forbidden
      if (err.response?.status === 403) {
        setHasAccess(false);
        setError(
          "Access Denied: You do not have permission to view this page.",
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch clients",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [transformClientData]);

  // Permission check on mount
  useEffect(() => {
    const checkPermission = () => {
      try {
        const rawUser = localStorage.getItem("user");
        if (!rawUser) {
          setHasAccess(false);
          setCheckingAccess(false);
          return;
        }

        let permissions = [];

        // Try parsing as plain JSON first
        if (rawUser.startsWith("{")) {
          try {
            const user = JSON.parse(rawUser);
            permissions = user.permissions || [];
          } catch (e) {
            console.error("JSON parse failed:", e);
          }
        }

        // If no permissions yet, try decrypting
        if (permissions.length === 0) {
          try {
            const decryptedBytes = CryptoJS.AES.decrypt(
              rawUser,
              "your-secret-key",
            );
            const decryptedUser = JSON.parse(
              decryptedBytes.toString(CryptoJS.enc.Utf8),
            );
            permissions = decryptedUser.permissions || [];
          } catch (e) {
            console.error("Decryption failed:", e);
          }
        }

        // Fallback to other storage locations
        if (permissions.length === 0) {
          const userPerms = localStorage.getItem("userPermissions");
          const perms = localStorage.getItem("permissions");

          if (userPerms) {
            try {
              permissions = JSON.parse(userPerms);
            } catch (e) {
              console.error("Failed to parse userPermissions:", e);
            }
          } else if (perms) {
            try {
              permissions = JSON.parse(perms);
            } catch (e) {
              console.error("Failed to parse permissions:", e);
            }
          }
        }

        // Check if user has any of the required permissions
        const hasRequiredPermission = permissions.some(
          (perm) => perm === "Customer.View" || perm === "SubAgent.View",
        );

        setHasAccess(hasRequiredPermission);
      } catch (error) {
        console.error("Permission check error:", error);
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkPermission();
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
        client.insuredId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.brokerId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTag = filterTag === "" || client.tag === filterTag;

      const clientDate = normalizeDate(client.submitDate);
      const matchesStartDate = startDate === "" || clientDate >= startDate;
      const matchesEndDate = endDate === "" || clientDate <= endDate;

      return matchesSearch && matchesTag && matchesStartDate && matchesEndDate;
    });
  }, [clients, searchTerm, filterTag, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterTag("");
    setStartDate("");
    setEndDate("");
  };

  // Get unique tags for filter dropdown
  const uniqueTags = useMemo(() => {
    return [...new Set(clients.map((c) => c.tag).filter(Boolean))];
  }, [clients]);

  // Go back to the first page whenever the filters change, so the list is never left on an empty page.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTag, startDate, endDate]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      superAgents: new Set(clients.map((c) => c.brokerId).filter(Boolean)).size,
      thisMonth: clients.filter((c) => {
        const d = new Date(c.submitDate);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length,
    };
  }, [clients]);

  // Render states - Permission check first
  if (checkingAccess) {
    return <LoadingState label="Checking permissions…" />;
  }

  if (!hasAccess) {
    return <AccessDenied title="Sub agents" />;
  }

  if (loading) return <LoadingState label="Loading sub agents…" />;
  if (error) return <ErrorState title="Could not load sub agents" message={error} onRetry={fetchClients} />;

  const activeFilterCount = [searchTerm, filterTag, startDate, endDate].filter(Boolean).length;
  const dateFilterCount = [startDate, endDate].filter(Boolean).length;

  const rowActions = (client) => (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={() => setViewId(client.insuredId)} title="View" aria-label="View" className={iconBtn}>
        <Eye className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => openEditModal(client)} title="Edit" aria-label="Edit" className={iconBtn}>
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Sub agents" description="Every sub agent account, under all super agents." />

      {successMessage && <Notice onClose={() => setSuccessMessage("")}>{successMessage}</Notice>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Total" value={clients.length.toLocaleString()} hint="Sub agent accounts" icon={Users} />
        <StatTile label="Super agents" value={stats.superAgents.toLocaleString()} hint="With at least one sub agent" icon={Briefcase} tone="bg-violet-50 text-violet-700" />
        <StatTile label="Added this month" value={stats.thisMonth.toLocaleString()} hint={new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })} icon={CalendarPlus} tone="bg-emerald-50 text-emerald-700" />
        <StatTile label="Showing" value={filteredClients.length.toLocaleString()} hint={activeFilterCount ? "Matching your filters" : "No filters applied"} icon={Search} tone="bg-amber-50 text-amber-700" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="border-b border-slate-100 p-4 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name, email, phone, ID or super agent"
              className="md:max-w-sm md:flex-1"
            />
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} aria-label="Tag" className={`${inputCls} md:w-40`}>
              <option value="">All tags</option>
              {uniqueTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
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
              {dateFilterCount > 0 && (
                <span className="rounded-full bg-[#155dfd] px-1.5 text-[11px] font-semibold text-white">{dateFilterCount}</span>
              )}
            </button>
            {activeFilterCount > 0 && (
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

        {filteredClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No sub agents found"
            text={activeFilterCount ? "Try a different search or clear the filters." : "No sub agents have been added yet."}
            action={
              activeFilterCount ? (
                <button type="button" onClick={clearFilters} className={btnSecondary}>
                  Clear filters
                </button>
              ) : null
            }
          />
        ) : (
          <>
            {/* Table (large screens) */}
            <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Sub agent</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Contact person</th>
                    <th className="px-4 py-3">Super agent</th>
                    <th className="px-4 py-3">Added</th>
                    <th className="px-4 py-3">Tag</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedClients.map((client) => (
                    <tr key={client.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={client.name} />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setViewId(client.insuredId)}
                              className="block max-w-[15rem] truncate font-semibold text-slate-900 hover:text-[#155dfd] text-left"
                            >
                              {client.name || "Unnamed sub agent"}
                            </button>
                            <span className="block text-xs text-slate-500">{client.insuredId || "No ID"}</span>
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
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{client.brokerId || "–"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{client.dateAdded}</td>
                      <td className="px-4 py-3.5">
                        {client.tag ? <StatusPill tone="blue" dot={false}>{client.tag}</StatusPill> : <span className="text-slate-400">–</span>}
                      </td>
                      <td className="px-6 py-3.5">{rowActions(client)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards (phones and tablets) */}
            <ul className={cardListCls(view)}>
              {paginatedClients.map((client) => (
                <li key={client.id} className={cardItemCls(view)}>
                  <div className="flex items-start gap-3">
                    <Avatar name={client.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setViewId(client.insuredId)}
                          className="truncate font-semibold text-slate-900 hover:text-[#155dfd] text-left"
                        >
                          {client.name || "Unnamed sub agent"}
                        </button>
                        {client.tag && <StatusPill tone="blue" dot={false}>{client.tag}</StatusPill>}
                      </div>
                      <p className="text-xs text-slate-500">{client.insuredId || "No ID"}</p>
                      <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                        <dt className="text-slate-500">Email</dt>
                        <dd className="truncate text-slate-700">{client.email || "–"}</dd>
                        <dt className="text-slate-500">Phone</dt>
                        <dd className="text-slate-700">{client.phone || "–"}</dd>
                        <dt className="text-slate-500">Contact</dt>
                        <dd className="truncate text-slate-700">{client.contactPerson || "–"}</dd>
                        <dt className="text-slate-500">Super agent</dt>
                        <dd className="text-slate-700">{client.brokerId || "–"}</dd>
                        <dt className="text-slate-500">Added</dt>
                        <dd className="text-slate-700">{client.dateAdded}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-auto pt-3">
                    <div className="flex justify-end border-t border-slate-100 pt-2">{rowActions(client)}</div>
                  </div>
                </li>
              ))}
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

      {/* Edit sub agent */}
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

      {/* View one sub agent */}
      {viewId && (
        <ClientDetailsSheet
          clientId={viewId}
          onClose={closeView}
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

export default ManageClients;
