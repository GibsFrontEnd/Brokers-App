import React, { useState, useEffect } from "react";
import { Eye, KeyRound, Loader2, Pencil, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import CryptoJS from "crypto-js";
import { getApiBaseUrl } from "../../utils/config";
import {
  AccessDenied,
  DetailCard,
  DetailRow,
  EmptyState,
  Field,
  Notice,
  Pager,
  SearchInput,
  Sheet,
  StatusPill,
  ViewToggle,
  btnPrimary,
  btnSecondary,
  iconBtn,
  inputCls,
} from "../UI/PageKit";
import { cardItemCls, cardListCls, useViewMode } from "../UI/viewMode";
import { useConfirm } from "../UI/useConfirm";

const ROLES_API_URL = `${getApiBaseUrl()}/Auth/roles`;
const PERMISSIONS_API_URL = `${getApiBaseUrl()}/Auth/permissions`;

const readResponseBodySafely = async (response) => {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  } catch {
    return "";
  }
};

// Normalizes fetch failures so we don't always show the generic "Failed to fetch".
// Common causes:
// - CORS blocked (browser won't give a status)
// - Network error / SSL / DNS
// - API unreachable
const requestJson = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const body = await readResponseBodySafely(response);

      // Prefer backend message if available
      const backendMessage =
        body && typeof body === "object"
          ? body.message || body.error || JSON.stringify(body)
          : String(body || "");

      if (response.status === 403) {
        throw new Error("Access Denied");
      }
      throw new Error(
        backendMessage?.trim() || `HTTP error! status: ${response.status}`,
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    // Some endpoints return empty body on success (DELETE)
    return null;
  } catch (err) {
    // When fetch throws, there's usually *no HTTP response*.
    // Make it clearer than "Failed to fetch".
    if (
      err instanceof TypeError &&
      String(err.message).includes("Failed to fetch")
    ) {
      throw new Error(
        "Network/CORS error: the browser couldn't reach the API (check API availability, HTTPS, and CORS).",
      );
    }
    throw err;
  }
};

// Colour for a permission's action.
const ACTION_TONES = {
  Create: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Read: "bg-blue-50 text-blue-700 ring-blue-200",
  Update: "bg-amber-50 text-amber-800 ring-amber-200",
  Delete: "bg-rose-50 text-rose-700 ring-rose-200",
};

const ActionTag = ({ action }) => (
  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${ACTION_TONES[action] || "bg-violet-50 text-violet-700 ring-violet-200"}`}>
    {action || "–"}
  </span>
);

const formatDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "–" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// Permissions grouped by module, each group sorted by name.
const byModule = (list) => {
  const groups = {};
  list.forEach((p) => {
    const key = p?.module || "Other";
    (groups[key] = groups[key] || []).push(p);
  });
  return Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .map((module) => ({
      module,
      items: groups[module].sort((a, b) => String(a.permissionName || "").localeCompare(String(b.permissionName || ""))),
    }));
};

const RolesTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleDetails, setShowRoleDetails] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [editRoleTarget, setEditRoleTarget] = useState(null);
  const [editRoleForm, setEditRoleForm] = useState({
    roleName: "",
    description: "",
    isActive: true,
    permissionIds: [],
  });
  const [createRoleForm, setCreateRoleForm] = useState({
    roleName: "",
    description: "",
    permissionIds: [],
  });

  // Permission check states
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [userPermissions, setUserPermissions] = useState([]);

  const [rolesPerPage, setRolesPerPage] = useState(10);
  const [view, setView] = useViewMode("security-roles");
  const [confirm, confirmDialog] = useConfirm();
  const [pickerSearch, setPickerSearch] = useState("");

  // Helper to read permissions from storage
  const readPermissionsFromStorage = () => {
    try {
      // Try reading from localStorage.user
      const userStr = localStorage.getItem("user");
      if (userStr) {
        // Try plain JSON first
        if (userStr.trim().startsWith("{")) {
          try {
            const userData = JSON.parse(userStr);
            const perms = userData?.permissions || [];
            if (Array.isArray(perms)) return perms;
          } catch {
            // Not plain JSON
          }
        }

        // Try decrypting
        try {
          const bytes = CryptoJS.AES.decrypt(userStr, "your-secret-key");
          const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
          if (decryptedStr) {
            const userData = JSON.parse(decryptedStr);
            const perms = userData?.permissions || [];
            if (Array.isArray(perms)) return perms;
          }
        } catch {
          // Decryption failed
        }
      }

      // Fallback: try userPermissions
      const permsStr = localStorage.getItem("userPermissions");
      if (permsStr) {
        try {
          const perms = JSON.parse(permsStr);
          if (Array.isArray(perms)) return perms;
        } catch {
          // ignore
        }
      }

      // Fallback: try permissions
      const permsStr2 = localStorage.getItem("permissions");
      if (permsStr2) {
        try {
          const perms = JSON.parse(permsStr2);
          if (Array.isArray(perms)) return perms;
        } catch {
          // ignore
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
    setUserPermissions(perms);
    setCheckingAccess(false);
  }, []);

  // Permission check helpers
  const hasPermission = (permissionName) => {
    return userPermissions.includes(permissionName);
  };

  const canViewRoles = hasPermission("Role.View");
  const canUpdateRole = hasPermission("Role.Update");
  const canDeleteRole = hasPermission("Role.Delete");

  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    setPermissionsError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const data = await requestJson(PERMISSIONS_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const permissionsData = Array.isArray(data) ? data : data.data || [];
      setPermissions(permissionsData);
    } catch (err) {
      setPermissionsError(err.message);
      console.error("Error fetching permissions:", err);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const data = await requestJson(ROLES_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Extract roles from data.data if it exists, otherwise use data directly
      const rolesData = data.data || data;
      setRoles(rolesData);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching roles:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  // View role details
  const handleViewRole = (role) => {
    setSelectedRole(role);
    setShowRoleDetails(true);
  };

  const openCreateRoleModal = () => {
    setCreateRoleForm({ roleName: "", description: "", permissionIds: [] });
    setError(null);
    setSuccess(null);
    setShowCreateRoleModal(true);
  };

  const closeCreateRoleModal = () => {
    if (creatingRole) return;
    setShowCreateRoleModal(false);
  };

  const togglePermissionId = (permissionID) => {
    setCreateRoleForm((prev) => {
      const exists = prev.permissionIds.includes(permissionID);
      return {
        ...prev,
        permissionIds: exists
          ? prev.permissionIds.filter((id) => id !== permissionID)
          : [...prev.permissionIds, permissionID],
      };
    });
  };

  const toggleEditPermissionId = (permissionID) => {
    setEditRoleForm((prev) => {
      const exists = prev.permissionIds.includes(permissionID);
      return {
        ...prev,
        permissionIds: exists
          ? prev.permissionIds.filter((id) => id !== permissionID)
          : [...prev.permissionIds, permissionID],
      };
    });
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setCreatingRole(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const payload = {
        roleName: createRoleForm.roleName.trim(),
        description: createRoleForm.description.trim(),
        permissionIds: Array.isArray(createRoleForm.permissionIds)
          ? createRoleForm.permissionIds
          : [],
      };

      if (!payload.roleName) {
        throw new Error("Role Name is required.");
      }

      await requestJson(ROLES_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setSuccess("Role created successfully.");
      setShowCreateRoleModal(false);
      await fetchRoles();
    } catch (err) {
      console.error("Error creating role:", err);
      setError(err.message);
    } finally {
      setCreatingRole(false);
    }
  };

  const openEditRoleModal = (role) => {
    if (!role || role?.isSystemRole) return;

    // Convert existing permissions to IDs
    const existingPermissionIds = Array.isArray(role?.permissions)
      ? role.permissions
          .map((p) => p?.permissionID)
          .filter((id) => typeof id === "number")
      : [];

    setEditRoleTarget(role);
    setEditRoleForm({
      roleName: role.roleName || "",
      description: role.description || "",
      isActive: role.isActive ?? true,
      permissionIds: existingPermissionIds,
    });
    setError(null);
    setSuccess(null);
    setShowEditRoleModal(true);
  };

  const closeEditRoleModal = () => {
    if (editingRole) return;
    setShowEditRoleModal(false);
    setEditRoleTarget(null);
  };

  const handleEditRole = (role) => {
    openEditRoleModal(role);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editRoleTarget?.roleID) return;

    setEditingRole(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const payload = {
        roleName: editRoleForm.roleName.trim(),
        description: editRoleForm.description.trim(),
        isActive: Boolean(editRoleForm.isActive),
        permissionIds: Array.isArray(editRoleForm.permissionIds)
          ? editRoleForm.permissionIds
          : [],
      };

      if (!payload.roleName) {
        throw new Error("Role Name is required.");
      }

      await requestJson(`${ROLES_API_URL}/${editRoleTarget.roleID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setSuccess("Role updated successfully.");
      setShowEditRoleModal(false);
      setEditRoleTarget(null);
      await fetchRoles();
    } catch (err) {
      console.error("Error updating role:", err);
      setError(err.message);
    } finally {
      setEditingRole(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role?.isSystemRole) return;
    const ok = await confirm({
      title: "Delete this role?",
      message: `"${getRoleDisplayName(role.roleName)}" will be removed. Users who had it lose its permissions.`,
      confirmLabel: "Delete role",
    });
    if (!ok) return;

    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      await requestJson(`${ROLES_API_URL}/${role.roleID}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Role deleted successfully.");
      await fetchRoles();
    } catch (err) {
      console.error("Error deleting role:", err);
      setError(err.message);
    }
  };

  // Close role details modal
  const closeRoleDetails = () => {
    setShowRoleDetails(false);
    setSelectedRole(null);
  };

  // Helper function to get display name for roles
  const getRoleDisplayName = (roleName) => {
    const nameMap = {
      Broker: "Super Agents",
      BrokerAdmin: "Super Agent Admin",
      Customer: "SubAgent",
    };
    return nameMap[roleName] || roleName;
  };

  // Helper function to get display description for roles
  const getRoleDisplayDescription = (description) => {
    if (!description) return description;

    // Replace description text
    return description
      .replace(/Broker User/gi, "Super Agent User")
      .replace(/Broker Administrator/gi, "Super Agent Administrator")
      .replace(/Insured Client/gi, "Sub Agent");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredRoles = (Array.isArray(roles) ? roles : [])
    .filter((role) => !["Company", "CompanyAdmin"].includes(role.roleName))
    .filter(
      (role) =>
        role.roleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  // Pagination logic
  const totalPages = Math.ceil(filteredRoles.length / rolesPerPage);
  const currentRoles = filteredRoles.slice(
    (currentPage - 1) * rolesPerPage,
    currentPage * rolesPerPage,
  );

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Show loading while checking access
  if (checkingAccess) {
    return (
      <div className="grid min-h-[300px] place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#155dfd]" />
      </div>
    );
  }

  if (!canViewRoles) {
    return <AccessDenied title="Roles" message="You don't have permission to view roles." />;
  }

  // The permission picker shared by Add role and Edit role.
  const permissionPicker = (selectedIds, toggle, disabled) => {
    const q = pickerSearch.trim().toLowerCase();
    const groups = byModule(
      permissions
        .filter((p) => p?.isActive !== false)
        .filter(
          (p) =>
            !q ||
            String(p.permissionName || "").toLowerCase().includes(q) ||
            String(p.module || "").toLowerCase().includes(q) ||
            String(p.description || "").toLowerCase().includes(q),
        ),
    );

    return (
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-4 w-4 text-[#155dfd]" />
            <h3 className="text-sm font-semibold text-slate-900">Permissions</h3>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#155dfd]">{selectedIds.length} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput value={pickerSearch} onChange={setPickerSearch} placeholder="Find a permission" className="sm:w-56" />
            <button type="button" onClick={fetchPermissions} disabled={permissionsLoading} className={iconBtn} title="Reload permissions">
              <RefreshCw className={`h-4 w-4 ${permissionsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        {permissionsLoading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#155dfd]" />
          </div>
        ) : groups.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">{q ? "No permissions match." : "No permissions available."}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {groups.map((g) => {
              const ids = g.items.map((p) => p.permissionID);
              const chosen = ids.filter((id) => selectedIds.includes(id));
              const all = chosen.length === ids.length;
              return (
                <div key={g.module}>
                  <div className="flex items-center justify-between bg-slate-50/70 px-5 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {g.module} <span className="font-normal normal-case text-slate-400">· {chosen.length}/{ids.length}</span>
                    </span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => (all ? chosen : ids.filter((id) => !selectedIds.includes(id))).forEach((id) => toggle(id))}
                      className="text-xs font-medium text-[#155dfd] hover:underline disabled:opacity-50"
                    >
                      {all ? "Clear" : "Select all"}
                    </button>
                  </div>
                  <ul>
                    {g.items.map((p) => {
                      const checked = selectedIds.includes(p.permissionID);
                      return (
                        <li key={p.permissionID}>
                          <label className={`flex cursor-pointer items-start gap-3 px-5 py-2.5 transition-colors ${checked ? "bg-blue-50/40" : "hover:bg-slate-50"}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(p.permissionID)}
                              disabled={disabled}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#155dfd]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[13px] font-medium text-slate-900">{p.permissionName}</span>
                                <ActionTag action={p.action} />
                              </span>
                              {(p.description || p.endpoint) && (
                                <span className="block truncate text-xs text-slate-500">{p.description || p.endpoint}</span>
                              )}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  const actions = (role) => (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={() => handleViewRole(role)} disabled={!canViewRoles} title="View role" aria-label="View role" className={`${iconBtn} disabled:opacity-30`}>
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          setPickerSearch("");
          handleEditRole(role);
        }}
        disabled={role.isSystemRole || !canUpdateRole}
        title={role.isSystemRole ? "System roles can't be edited" : !canUpdateRole ? "No permission to update roles" : "Edit role"}
        aria-label="Edit role"
        className={`${iconBtn} disabled:opacity-30`}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => handleDeleteRole(role)}
        disabled={role.isSystemRole || !canDeleteRole}
        title={role.isSystemRole ? "System roles can't be deleted" : !canDeleteRole ? "No permission to delete roles" : "Delete role"}
        aria-label="Delete role"
        className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const typePill = (role) => (
    <StatusPill tone={role.isSystemRole ? "slate" : "blue"} dot={false}>
      {role.isSystemRole ? "System" : "Custom"}
    </StatusPill>
  );

  const activePill = (active) => <StatusPill tone={active ? "green" : "red"}>{active ? "Active" : "Inactive"}</StatusPill>;

  return (
    <div className="space-y-5">
      {confirmDialog}

      {error && (
        <Notice tone="error" onClose={() => setError(null)}>
          {error}
        </Notice>
      )}
      {success && <Notice onClose={() => setSuccess(null)}>{success}</Notice>}
      {permissionsError && (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span>Permissions could not be loaded: {permissionsError}</span>
          <button type="button" onClick={() => setPermissionsError(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by role name or description" className="sm:max-w-sm sm:flex-1" />
        <span className="text-sm text-slate-500">
          {filteredRoles.length} role{filteredRoles.length === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2 sm:ml-auto">
          <ViewToggle value={view} onChange={setView} className="hidden lg:inline-flex" />
          <button type="button" onClick={fetchRoles} disabled={loading} className={btnSecondary} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPickerSearch("");
              openCreateRoleModal();
            }}
            className={btnPrimary}
          >
            <Plus className="h-4 w-4" />
            Add role
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center rounded-2xl border border-slate-200 py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[#155dfd]" />
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200">
          <EmptyState icon={ShieldCheck} title={searchQuery ? "No roles match your search" : "No roles yet"} text={searchQuery ? "Try a different search." : "Add a role to group permissions together."} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Table (large screens) */}
          <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRoles.map((role) => (
                  <tr key={role.roleID} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                          <ShieldCheck className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{getRoleDisplayName(role.roleName)}</p>
                          <p className="max-w-[22rem] truncate text-xs text-slate-500">{getRoleDisplayDescription(role.description) || "No description"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">
                      <span className="font-semibold text-slate-900">{role.permissions?.length || 0}</span> permissions
                    </td>
                    <td className="px-4 py-3.5">{typePill(role)}</td>
                    <td className="px-4 py-3.5">{activePill(role.isActive)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{formatDate(role.createdDate)}</td>
                    <td className="px-5 py-3.5">{actions(role)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards */}
          <ul className={cardListCls(view)}>
            {currentRoles.map((role) => (
              <li key={role.roleID} className={cardItemCls(view)}>
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{getRoleDisplayName(role.roleName)}</p>
                    <p className="line-clamp-2 text-xs text-slate-500">{getRoleDisplayDescription(role.description) || "No description"}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {typePill(role)}
                  {activePill(role.isActive)}
                  <span className="text-xs text-slate-500">{role.permissions?.length || 0} permissions</span>
                </div>
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-xs text-slate-400">Created {formatDate(role.createdDate)}</span>
                    {actions(role)}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Pager
            page={currentPage}
            totalPages={totalPages}
            total={filteredRoles.length}
            pageSize={rolesPerPage}
            onPage={(n) => setCurrentPage(Math.max(1, Math.min(n, totalPages)))}
            onPageSize={(n) => {
              setRolesPerPage(n);
              setCurrentPage(1);
            }}
            noun="roles"
          />
        </div>
      )}

      {/* Add role */}
      {showCreateRoleModal && (
        <Sheet
          open
          size="lg"
          onClose={closeCreateRoleModal}
          title="Add role"
          sub="Name the role and choose what it allows."
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeCreateRoleModal} disabled={creatingRole} className={btnSecondary}>
                Cancel
              </button>
              <button type="submit" form="create-role-form" disabled={creatingRole} className={btnPrimary}>
                {creatingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {creatingRole ? "Creating…" : "Create role"}
              </button>
            </div>
          }
        >
          {error && <Notice tone="error">{error}</Notice>}
          <form id="create-role-form" onSubmit={handleCreateRole} className="space-y-5">
            <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Field label="Role name" required>
                <input
                  type="text"
                  value={createRoleForm.roleName}
                  onChange={(e) => setCreateRoleForm((prev) => ({ ...prev, roleName: e.target.value }))}
                  placeholder="e.g. Claims Officer"
                  required
                  disabled={creatingRole}
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={createRoleForm.description}
                  onChange={(e) => setCreateRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="What this role is for"
                  rows={2}
                  disabled={creatingRole}
                  className={`${inputCls} h-auto py-2`}
                />
              </Field>
            </section>
            {permissionPicker(createRoleForm.permissionIds, togglePermissionId, creatingRole)}
          </form>
        </Sheet>
      )}

      {/* Edit role */}
      {showEditRoleModal && editRoleTarget && (
        <Sheet
          open
          size="lg"
          onClose={closeEditRoleModal}
          title="Edit role"
          sub={getRoleDisplayName(editRoleTarget.roleName)}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeEditRoleModal} disabled={editingRole} className={btnSecondary}>
                Cancel
              </button>
              <button type="submit" form="edit-role-form" disabled={editingRole} className={btnPrimary}>
                {editingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                {editingRole ? "Saving…" : "Save changes"}
              </button>
            </div>
          }
        >
          {error && <Notice tone="error">{error}</Notice>}
          <form id="edit-role-form" onSubmit={handleUpdateRole} className="space-y-5">
            <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Field label="Role name" required>
                <input
                  type="text"
                  value={editRoleForm.roleName}
                  onChange={(e) => setEditRoleForm((prev) => ({ ...prev, roleName: e.target.value }))}
                  required
                  disabled={editingRole}
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={editRoleForm.description}
                  onChange={(e) => setEditRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  disabled={editingRole}
                  className={`${inputCls} h-auto py-2`}
                />
              </Field>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-slate-900">Active</span>
                  <span className="block text-xs text-slate-500">Inactive roles give their users nothing.</span>
                </span>
                <span className="relative inline-flex shrink-0">
                  <input
                    type="checkbox"
                    checked={Boolean(editRoleForm.isActive)}
                    onChange={(e) => setEditRoleForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    disabled={editingRole}
                    className="peer sr-only"
                  />
                  <span className="h-5 w-9 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500" />
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </span>
              </label>
            </section>
            {permissionPicker(editRoleForm.permissionIds, toggleEditPermissionId, editingRole)}
          </form>
        </Sheet>
      )}

      {/* View role */}
      {showRoleDetails && selectedRole && (
        <Sheet
          open
          size="lg"
          onClose={closeRoleDetails}
          title={getRoleDisplayName(selectedRole.roleName)}
          sub={getRoleDisplayDescription(selectedRole.description) || "Role"}
          leading={
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
          }
          footer={
            <div className="flex justify-end gap-2">
              {!selectedRole.isSystemRole && canUpdateRole && (
                <button
                  type="button"
                  onClick={() => {
                    const role = selectedRole;
                    closeRoleDetails();
                    setPickerSearch("");
                    handleEditRole(role);
                  }}
                  className={btnSecondary}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}
              <button type="button" onClick={closeRoleDetails} className={btnPrimary}>
                Done
              </button>
            </div>
          }
        >
          <DetailCard title="Role">
            <DetailRow label="Name" value={getRoleDisplayName(selectedRole.roleName)} />
            <DetailRow label="Description" value={getRoleDisplayDescription(selectedRole.description)} />
            <DetailRow label="Status">{activePill(selectedRole.isActive)}</DetailRow>
            <DetailRow label="Type">{typePill(selectedRole)}</DetailRow>
            <DetailRow label="Created" value={formatDate(selectedRole.createdDate)} />
            <DetailRow label="Permissions" value={String(selectedRole.permissions?.length || 0)} />
          </DetailCard>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
              <KeyRound className="h-4 w-4 text-[#155dfd]" />
              <h3 className="text-sm font-semibold text-slate-900">What this role allows</h3>
            </div>
            {selectedRole.permissions?.length ? (
              <div className="divide-y divide-slate-100">
                {byModule(selectedRole.permissions).map((g) => (
                  <div key={g.module}>
                    <p className="bg-slate-50/70 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {g.module} <span className="font-normal normal-case text-slate-400">· {g.items.length}</span>
                    </p>
                    <ul>
                      {g.items.map((p, i) => (
                        <li key={p.permissionID || i} className="flex items-center gap-3 px-5 py-2.5">
                          <span className="min-w-0 flex-1">
                            <span className="block font-mono text-[13px] text-slate-900">{p.permissionName}</span>
                            {p.endpoint && <span className="block truncate text-xs text-slate-500">{p.endpoint}</span>}
                          </span>
                          <ActionTag action={p.action} />
                          {!p.isActive && <StatusPill tone="red">Inactive</StatusPill>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={KeyRound} title="No permissions" text="This role does not allow anything yet." />
            )}
          </section>
        </Sheet>
      )}
    </div>
  );
};

export default RolesTab;
