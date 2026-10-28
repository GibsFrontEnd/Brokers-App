import React, { useState, useEffect } from "react";
import { ArrowLeft, Eye, KeyRound, Loader2, Minus, Pencil, Plus, RefreshCw, Save, Trash2, UserCheck, UserMinus, Users } from "lucide-react";
import CryptoJS from "crypto-js";
import { getApiBaseUrl } from "../../utils/config";
import {
  AccessDenied,
  Avatar,
  EmptyState,
  Field,
  Notice,
  Pager,
  SearchInput,
  Sheet,
  StatusPill,
  Toast,
  ViewToggle,
  btnPrimary,
  btnSecondary,
  iconBtn,
  inputCls,
} from "../UI/PageKit";
import { cardItemCls, cardListCls, useViewMode } from "../UI/viewMode";
import { useConfirm } from "../UI/useConfirm";

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

const userLabel = (user) => user.fullName || user.username || user.userId;

const PermissionsTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showUserPermissions, setShowUserPermissions] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    userId: "",
    userType: "",
    permissionId: "",
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissionsPerPage, setPermissionsPerPage] = useState(10);
  const [view, setView] = useViewMode("security-permissions");
  const [confirm, confirmDialog] = useConfirm();
  const [userSearch, setUserSearch] = useState("");
  const [showRevokeForm, setShowRevokeForm] = useState(false);
  const [revokeForm, setRevokeForm] = useState({
    userId: "",
    userType: "",
    permissionId: "",
  });
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Permission check states
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [currentUserPermissions, setCurrentUserPermissions] = useState([]);
  const [showAssignAccessDenied, setShowAssignAccessDenied] = useState(false);
  const [showRevokeAccessDenied, setShowRevokeAccessDenied] = useState(false);

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
    setCurrentUserPermissions(perms);
    setCheckingAccess(false);
  }, []);

  // Permission check helpers
  const hasPermission = (permissionName) => {
    return currentUserPermissions.includes(permissionName);
  };

  const canViewPermissions = hasPermission("Permission.View");
  const canAssignPermission = hasPermission("Permission.Assign");
  const canRevokePermission = hasPermission("Permission.Revoke");

  // Fetch permissions from API
  const fetchPermissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await fetch(`${getApiBaseUrl()}/Auth/permissions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPermissions(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      // Using the correct users endpoint
      const response = await fetch(`${getApiBaseUrl()}/Auth/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Extract the data array from the response
      if (data.success && data.data) {
        // Map entityType to userType for compatibility
        const usersWithUserType = data.data.map((user) => ({
          ...user,
          userType: user.entityType, // Add userType based on entityType
          entityRole: user.entityType, // Keep original entityType as entityRole
        }));

        setUsers(usersWithUserType);
      } else if (Array.isArray(data)) {
        // Fallback: if response is already an array
        const usersWithUserType = data.map((user) => ({
          ...user,
          userType: user.entityType,
          entityRole: user.entityType,
        }));
        setUsers(usersWithUserType);
        console.log(
          "Users loaded (fallback):",
          usersWithUserType.length,
          "users",
        );
      } else {
        throw new Error("Invalid response format from users API");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };
  // Fetch user permissions
  const fetchUserPermissions = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/Auth/user-permissions/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data);
      } else {
        setUserPermissions([]);
      }
    } catch (err) {
      console.error("Error fetching user permissions:", err);
      setUserPermissions([]);
    }
  };

  // Handle view user permissions
  const handleViewUserPermissions = (user) => {
    setSelectedUser(user);
    fetchUserPermissions(user.userId);
  };

  // Fetch permissions and users on component mount
  useEffect(() => {
    fetchPermissions();
    fetchUsers();
  }, []);

  const assignPermission = async () => {
    setError(null);
    setSuccess(null);
    try {
      console.log("=== Starting assignPermission ===");
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);

      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Form data:", assignmentForm);

      if (!assignmentForm.userId || !assignmentForm.permissionId) {
        throw new Error("Please select both user and permission");
      }

      // Format data exactly as backend expects
      const requestBody = {
        userId: assignmentForm.userId.toString(),
        userType: assignmentForm.userType || "User",
        permissionId: parseInt(assignmentForm.permissionId),
      };

      console.log("Request body being sent:", requestBody);

      // Log the exact URL and headers
      console.log(
        `Making request to: ${getApiBaseUrl()}/Auth/assign-permission`,
      );
      console.log("Headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.substring(0, 20)}...`, // Log partial token for security
      });

      const response = await fetch(
        `${getApiBaseUrl()}/Auth/assign-permission`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      // Try to read the response text first
      const responseText = await response.text();
      console.log("Raw response text:", responseText);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
        console.log("Parsed response:", parsedResponse);
      } catch (e) {
        console.log("Response is not JSON:", e.message);
      }

      if (!response.ok) {
        const errorMessage =
          parsedResponse?.message ||
          parsedResponse?.Message ||
          parsedResponse?.error ||
          `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      console.log("Success! Permission assigned");

      setSuccess("Permission assigned successfully!");

      // Refresh user permissions if viewing a specific user
      if (selectedUser) {
        console.log("Refreshing user permissions for:", selectedUser.userId);
        fetchUserPermissions(selectedUser.userId);
      }
    } catch (err) {
      console.error("=== Error in assignPermission ===");
      console.error("Error message:", err.message);
      console.error("Full error:", err);
      setError(err.message);
    } finally {
      // Always close the modal so the user can see the page-level error/success
      closeAssignmentForm();
    }
  };

  // REVOKE PERMISSION FUNCTION
  const closeRevokeForm = () => {
    setShowRevokeForm(false);
    setRevokeForm({
      userId: "",
      userType: "",
      permissionId: "",
    });
  };

  const handleRevokeFormChange = (e) => {
    const { name, value } = e.target;
    setRevokeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRevokePermission = async () => {
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      if (!revokeForm.userId || !revokeForm.permissionId) {
        throw new Error("Please select both user and permission");
      }

      const ok = await confirm({
        title: "Revoke this permission?",
        message: "The user will no longer be allowed to do this.",
        confirmLabel: "Revoke",
      });
      if (!ok) return;

      const requestBody = {
        userId: revokeForm.userId.toString(),
        userType: revokeForm.userType || "User",
        permissionId: parseInt(revokeForm.permissionId),
      };

      console.log("Revoking permission with data:", requestBody);

      const response = await fetch(
        `${getApiBaseUrl()}/Auth/revoke-permission`,
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
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      setSuccess("Permission revoked successfully!");

      if (selectedUser) {
        fetchUserPermissions(selectedUser.userId);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error revoking permission:", err);
    } finally {
      // Always close the modal so the user can see the page-level error/success
      closeRevokeForm();
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter permissions based on search query
  const filteredPermissions = permissions.filter(
    (permission) =>
      permission.permissionName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      permission.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      permission.module?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.action?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredPermissions.length / permissionsPerPage);
  const currentPermissions = filteredPermissions.slice(
    (currentPage - 1) * permissionsPerPage,
    currentPage * permissionsPerPage,
  );

  // Initial permission form state
  const initialPermissionState = {
    permissionName: "",
    description: "",
    module: "",
    action: "",
    endpoint: "",
    isActive: true,
  };

  const [permissionForm, setPermissionForm] = useState(initialPermissionState);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPermissionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    setAssignmentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const url = `${getApiBaseUrl()}/Auth/permissions`;
      const method = editingPermission ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(permissionForm),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSuccess(
        editingPermission
          ? "Permission updated successfully!"
          : "Permission created successfully!",
      );
      fetchPermissions();
      closeForm();
    } catch (err) {
      setError(err.message);
      console.error("Error saving permission:", err);
    }
  };

  const handleDelete = async (permissionId) => {
    const ok = await confirm({
      title: "Delete this permission?",
      message: "It will be removed from every role and user that has it.",
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/Auth/permissions/${permissionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSuccess("Permission deleted successfully!");
      fetchPermissions();
    } catch (err) {
      setError(err.message);
      console.error("Error deleting permission:", err);
    }
  };

  const handleEdit = (permission) => {
    setPermissionForm(permission);
    setEditingPermission(permission);
    setShowPermissionForm(true);
  };

  const handleView = (permission) => {
    setPermissionForm(permission);
    setEditingPermission({ ...permission, permissionID: 0 });
    setShowPermissionForm(true);
  };

  const closeForm = () => {
    setShowPermissionForm(false);
    setPermissionForm(initialPermissionState);
    setEditingPermission(null);
  };

  const closeAssignmentForm = () => {
    setShowAssignmentForm(false);
    setAssignmentForm({
      userId: "",
      userType: "",
      permissionId: "",
    });
  };

  const closeUserPermissions = () => {
    setShowUserPermissions(false);
    setSelectedUser(null);
    setUserPermissions([]);
  };

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

  // Show Access Denied if no Permission.View permission
  if (!canViewPermissions) {
    return <AccessDenied title="Permissions" message="You don't have permission to view permissions." />;
  }

  // Handler for Assign Permission button
  const handleAssignClick = () => {
    if (!canAssignPermission) {
      setShowAssignAccessDenied(true);
    } else {
      setShowAssignmentForm(true);
    }
  };

  // Handler for Revoke Permission button
  const handleRevokeClick = () => {
    if (!canRevokePermission) {
      setShowRevokeAccessDenied(true);
    } else {
      setShowRevokeForm(true);
    }
  };

  const readOnly = Boolean(editingPermission && !editingPermission.permissionID);
  const formTitle = editingPermission ? (editingPermission.permissionID ? "Edit permission" : "Permission") : "Add permission";

  const actions = (permission) => (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={() => handleView(permission)} title="View permission" aria-label="View permission" className={iconBtn}>
        <Eye className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => handleEdit(permission)} title="Edit permission" aria-label="Edit permission" className={iconBtn}>
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => handleDelete(permission.permissionID)}
        title="Delete permission"
        aria-label="Delete permission"
        className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const userOptions = users.map((user) => (
    <option key={user.userId} value={user.userId}>
      {userLabel(user)}
      {user.email ? ` (${user.email})` : ""} · {user.entityType || user.userType}
    </option>
  ));

  const permissionOptions = permissions.map((permission) => (
    <option key={permission.permissionID} value={permission.permissionID}>
      {permission.permissionName} ({permission.module}.{permission.action})
    </option>
  ));

  const shownUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    return !q || [u.fullName, u.username, u.email, u.userId].some((v) => String(v || "").toLowerCase().includes(q));
  });

  return (
    <div className="space-y-5">
      {confirmDialog}
      {showAssignAccessDenied && (
        <Toast type="error" message="You don't have permission to assign permissions." onClose={() => setShowAssignAccessDenied(false)} />
      )}
      {showRevokeAccessDenied && (
        <Toast type="error" message="You don't have permission to revoke permissions." onClose={() => setShowRevokeAccessDenied(false)} />
      )}

      {error && (
        <Notice tone="error" onClose={() => setError(null)}>
          {error}
        </Notice>
      )}
      {success && <Notice onClose={() => setSuccess(null)}>{success}</Notice>}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, module or action" className="lg:max-w-sm lg:flex-1" />
        <span className="text-sm text-slate-500">
          {filteredPermissions.length} permission{filteredPermissions.length === 1 ? "" : "s"}
        </span>
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <ViewToggle value={view} onChange={setView} className="hidden lg:inline-flex" />
          <button type="button" onClick={fetchPermissions} disabled={loading} className={btnSecondary} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedUser(null);
              setUserSearch("");
              setShowUserPermissions(true);
            }}
            className={btnSecondary}
          >
            <Users className="h-4 w-4" />
            By user
          </button>
          <button type="button" onClick={handleRevokeClick} disabled={loading} className={btnSecondary}>
            <UserMinus className="h-4 w-4" />
            Revoke
          </button>
          <button type="button" onClick={handleAssignClick} disabled={loading} className={btnPrimary}>
            <UserCheck className="h-4 w-4" />
            Assign
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center rounded-2xl border border-slate-200 py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[#155dfd]" />
        </div>
      ) : filteredPermissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200">
          <EmptyState icon={KeyRound} title={searchQuery ? "No permissions match your search" : "No permissions found"} text={searchQuery ? "Try a different search." : undefined} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Table (large screens) */}
          <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Permission</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentPermissions.map((permission) => (
                  <tr key={permission.permissionID} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <p className="font-mono text-[13px] font-medium text-slate-900">{permission.permissionName}</p>
                      <p className="max-w-[26rem] truncate text-xs text-slate-500">{permission.description || permission.endpoint || "–"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone="slate" dot={false}>
                        {permission.module || "–"}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <ActionTag action={permission.action} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={permission.isActive ? "green" : "red"}>{permission.isActive ? "Active" : "Inactive"}</StatusPill>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(permission.createdDate)}</td>
                    <td className="px-5 py-3">{actions(permission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards */}
          <ul className={cardListCls(view)}>
            {currentPermissions.map((permission) => (
              <li key={permission.permissionID} className={cardItemCls(view)}>
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 break-all font-mono text-[13px] font-semibold text-slate-900">{permission.permissionName}</p>
                  <ActionTag action={permission.action} />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{permission.description || permission.endpoint || "No description"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill tone="slate" dot={false}>
                    {permission.module || "–"}
                  </StatusPill>
                  <StatusPill tone={permission.isActive ? "green" : "red"}>{permission.isActive ? "Active" : "Inactive"}</StatusPill>
                </div>
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-xs text-slate-400">{formatDate(permission.createdDate)}</span>
                    {actions(permission)}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Pager
            page={currentPage}
            totalPages={totalPages}
            total={filteredPermissions.length}
            pageSize={permissionsPerPage}
            onPage={(n) => setCurrentPage(Math.max(1, Math.min(n, totalPages)))}
            onPageSize={(n) => {
              setPermissionsPerPage(n);
              setCurrentPage(1);
            }}
            noun="permissions"
          />
        </div>
      )}

      {/* View / edit a permission */}
      {showPermissionForm && (
        <Sheet
          open
          onClose={closeForm}
          title={formTitle}
          sub={permissionForm.permissionName || undefined}
          leading={
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#155dfd]">
              <KeyRound className="h-5 w-5" />
            </span>
          }
          footer={
            readOnly ? (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const p = permissions.find((x) => x.permissionName === permissionForm.permissionName) || permissionForm;
                    handleEdit(p);
                  }}
                  className={btnSecondary}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button type="button" onClick={closeForm} className={btnPrimary}>
                  Done
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeForm} className={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" form="permission-form" className={btnPrimary}>
                  <Save className="h-4 w-4" />
                  {editingPermission ? "Save changes" : "Create permission"}
                </button>
              </div>
            )
          }
        >
          <form id="permission-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
            <Field label="Permission name" required wide>
              <input type="text" name="permissionName" value={permissionForm.permissionName} onChange={handleInputChange} required disabled={readOnly} placeholder="e.g. Pin.Approve" className={`${inputCls} font-mono`} />
            </Field>
            <Field label="Description" wide>
              <textarea name="description" value={permissionForm.description} onChange={handleInputChange} rows={3} disabled={readOnly} className={`${inputCls} h-auto py-2`} />
            </Field>
            <Field label="Module" required>
              <input type="text" name="module" value={permissionForm.module} onChange={handleInputChange} required disabled={readOnly} placeholder="e.g. Pin" className={inputCls} />
            </Field>
            <Field label="Action" required>
              <select name="action" value={permissionForm.action} onChange={handleInputChange} required disabled={readOnly} className={inputCls}>
                <option value="">Select action</option>
                <option value="Create">Create</option>
                <option value="Read">Read</option>
                <option value="Update">Update</option>
                <option value="Delete">Delete</option>
                <option value="Manage">Manage</option>
              </select>
            </Field>
            <Field label="Endpoint" required wide>
              <input type="text" name="endpoint" value={permissionForm.endpoint} onChange={handleInputChange} required disabled={readOnly} placeholder="POST api/auth/create-system-user" className={`${inputCls} font-mono`} />
            </Field>
            <Field label="Status">
              <select name="isActive" value={permissionForm.isActive} onChange={handleInputChange} disabled={readOnly} className={inputCls}>
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
            </Field>
          </form>
        </Sheet>
      )}

      {/* Assign a permission */}
      {showAssignmentForm && (
        <Sheet
          open
          onClose={closeAssignmentForm}
          title="Assign a permission"
          sub="Give one user one permission."
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeAssignmentForm} className={btnSecondary}>
                Cancel
              </button>
              <button type="button" onClick={assignPermission} disabled={!assignmentForm.userId || !assignmentForm.permissionId} className={btnPrimary}>
                <Plus className="h-4 w-4" />
                Assign
              </button>
            </div>
          }
        >
          {loadingUsers ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#155dfd]" />
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Field label="User" required>
                <select name="userId" value={assignmentForm.userId} onChange={handleAssignmentChange} required className={inputCls}>
                  <option value="">Choose a user</option>
                  {userOptions}
                </select>
                <span className="mt-1 block text-xs text-slate-500">{users.length} users</span>
              </Field>
              <Field label="Permission" required>
                <select name="permissionId" value={assignmentForm.permissionId} onChange={handleAssignmentChange} required className={inputCls}>
                  <option value="">Choose a permission</option>
                  {permissionOptions}
                </select>
              </Field>
            </section>
          )}
        </Sheet>
      )}

      {/* Revoke a permission */}
      {showRevokeForm && (
        <Sheet
          open
          onClose={closeRevokeForm}
          title="Revoke a permission"
          sub="Take one permission away from one user."
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeRevokeForm} className={btnSecondary}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokePermission}
                disabled={!revokeForm.userId || !revokeForm.permissionId}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-60"
              >
                <Minus className="h-4 w-4" />
                Revoke
              </button>
            </div>
          }
        >
          {loadingUsers ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#155dfd]" />
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Field label="User" required>
                <select name="userId" value={revokeForm.userId} onChange={handleRevokeFormChange} required className={inputCls}>
                  <option value="">Choose a user</option>
                  {userOptions}
                </select>
              </Field>
              <Field label="Permission to revoke" required>
                <select name="permissionId" value={revokeForm.permissionId} onChange={handleRevokeFormChange} required className={inputCls}>
                  <option value="">Choose a permission</option>
                  {permissionOptions}
                </select>
              </Field>
            </section>
          )}
        </Sheet>
      )}

      {/* Permissions by user */}
      {showUserPermissions && (
        <Sheet
          open
          size="lg"
          onClose={closeUserPermissions}
          title={selectedUser ? userLabel(selectedUser) : "Permissions by user"}
          sub={selectedUser ? `${selectedUser.userType || "User"} · ${selectedUser.email || selectedUser.userId}` : "Pick a user to see what they are allowed to do."}
          leading={selectedUser ? <Avatar name={userLabel(selectedUser)} className="h-10 w-10 text-sm" /> : undefined}
          footer={
            selectedUser ? (
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => setSelectedUser(null)} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
                  <ArrowLeft className="h-4 w-4" />
                  All users
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssignmentForm({ userId: selectedUser.userId, userType: selectedUser.userType, permissionId: "" });
                    setShowAssignmentForm(true);
                  }}
                  className={btnPrimary}
                >
                  <Plus className="h-4 w-4" />
                  Assign a permission
                </button>
              </div>
            ) : null
          }
        >
          {!selectedUser ? (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4">
                <SearchInput value={userSearch} onChange={setUserSearch} placeholder="Search users" />
              </div>
              {loadingUsers ? (
                <div className="grid place-items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#155dfd]" />
                </div>
              ) : shownUsers.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-500">No users found.</p>
              ) : (
                <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
                  {shownUsers.map((user) => (
                    <li key={user.userId}>
                      <button type="button" onClick={() => handleViewUserPermissions(user)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50">
                        <Avatar name={userLabel(user)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">{userLabel(user)}</span>
                          <span className="block truncate text-xs text-slate-500">{user.email || "No email"}</span>
                        </span>
                        <StatusPill tone="blue" dot={false}>
                          {user.userType || "User"}
                        </StatusPill>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <h3 className="text-sm font-semibold text-slate-900">Current permissions</h3>
                <span className="text-xs text-slate-500">{userPermissions?.length || 0}</span>
              </div>
              {userPermissions && userPermissions.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {userPermissions.map((permission, index) => {
                    const name = typeof permission === "string" ? permission : permission.permissionName;
                    const id = typeof permission === "string" ? permissions.find((p) => p.permissionName === permission)?.permissionID : permission.permissionID;
                    return (
                      <li key={id || index} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-[13px] text-slate-900">{name}</span>
                          {typeof permission !== "string" && permission.module && <span className="block text-xs text-slate-500">{permission.module}</span>}
                        </span>
                        {typeof permission !== "string" && <ActionTag action={permission.action} />}
                        {typeof permission !== "string" && !permission.isActive && <StatusPill tone="red">Inactive</StatusPill>}
                        <button
                          type="button"
                          onClick={() => {
                            setRevokeForm({ userId: selectedUser.userId, userType: selectedUser.userType, permissionId: id || "" });
                            setShowRevokeForm(true);
                            closeUserPermissions();
                          }}
                          title="Revoke permission"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                          Revoke
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState icon={KeyRound} title="No permissions" text="This user has no permissions of their own." />
              )}
            </section>
          )}
        </Sheet>
      )}
    </div>
  );
};

export default PermissionsTab;
