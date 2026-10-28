import React, { useState, useEffect } from "react";
import { Check, KeyRound, Loader2, Minus, Plus, RefreshCw, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import Addnewuser from "./Addnewuser";
import CryptoJS from "crypto-js";
import { getApiBaseUrl } from "../../utils/config";
import {
  AccessDenied,
  Avatar,
  EmptyState,
  Notice,
  Pager,
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
import { useConfirm } from "../UI/useConfirm";

const statusTone = (status) => {
  const s = String(status || "active").toLowerCase();
  return s === "active" ? "green" : s === "pending" ? "amber" : "red";
};

const UsersTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [view, setView] = useViewMode("security-users");
  const [toast, setToast] = useState(null);
  const [confirm, confirmDialog] = useConfirm();
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Permission Modal States
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [allPermissions, setAllPermissions] = useState([]);
  const [assigningPermission, setAssigningPermission] = useState(false);

  // Assign permission UI state (inside modal)
  const [permissionSearch, setPermissionSearch] = useState("");
  const [selectedPermissionIdToAssign, setSelectedPermissionIdToAssign] =
    useState("");

  // Roles assignment states
  const [availableRoles, setAvailableRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [rolesTargetUser, setRolesTargetUser] = useState(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [replaceExistingRoles, setReplaceExistingRoles] = useState(true);
  const [assigningRoles, setAssigningRoles] = useState(false);

  // Permission check states
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [currentUserPermissions, setCurrentUserPermissions] = useState([]);
  const [showCreateUserAccessDenied, setShowCreateUserAccessDenied] =
    useState(false);

  const USERS_API = `${getApiBaseUrl()}/Auth/users`;
  const PERMISSIONS_API = `${getApiBaseUrl()}/Auth/permissions`;
  const USER_PERMISSIONS_API = `${getApiBaseUrl()}/Auth/user-permissions`;
  const ASSIGN_PERMISSION_API = `${getApiBaseUrl()}/Auth/assign-permission`;
  const REVOKE_PERMISSION_API = `${getApiBaseUrl()}/Auth/revoke-permission`;
  const ROLES_API = `${getApiBaseUrl()}/Auth/roles`;

  // ========== LOCAL STORAGE HELPER FUNCTIONS ==========

  // Save user status to localStorage
  const saveUserStatusToStorage = (userId, status, approvalStatus = "") => {
    try {
      const storedStatuses = JSON.parse(
        localStorage.getItem("userStatuses") || "{}",
      );
      storedStatuses[userId] = {
        status,
        approvalStatus,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("userStatuses", JSON.stringify(storedStatuses));
    } catch (error) {
      console.error("Error saving user status:", error);
    }
  };

  // Get user status from localStorage
  const getUserStatusFromStorage = (userId) => {
    try {
      const storedStatuses = JSON.parse(
        localStorage.getItem("userStatuses") || "{}",
      );
      return storedStatuses[userId]?.status || null;
    } catch (error) {
      console.error("Error getting user status:", error);
      return null;
    }
  };

  // Get user approvalStatus from localStorage
  const getUserApprovalStatusFromStorage = (userId) => {
    try {
      const storedStatuses = JSON.parse(
        localStorage.getItem("userStatuses") || "{}",
      );
      return storedStatuses[userId]?.approvalStatus || null;
    } catch (error) {
      console.error("Error getting approval status:", error);
      return null;
    }
  };

  // ========== END LOCAL STORAGE FUNCTIONS ==========

  // Helpers for new Users API shape
  const getUserRolesText = (user) => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    if (roles.length === 0) return "";
    return roles
      .map((r) => r?.roleName)
      .filter(Boolean)
      .join(", ");
  };

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

  const canViewUsers = hasPermission("User.View");
  const canCreateUser = hasPermission("SystemUser.Create");

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await fetch(USERS_API, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          console.log("Could not parse error as JSON");
        }
        throw new Error(
          errorData.message ||
            errorData.error ||
            errorText ||
            `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();

      // Handle different response structures
      let usersArray = [];

      if (data.success && Array.isArray(data.data)) {
        usersArray = data.data;
      } else if (Array.isArray(data)) {
        usersArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        usersArray = data.data;
      } else {
        console.warn(
          "Unexpected API response format, using empty array:",
          data,
        );
        usersArray = [];
      }

      // Transform users to ensure consistent field names
      const transformedUsers = usersArray.map((user) => {
        const userId = user.userId || user.userid;

        // Get stored status from localStorage first
        const storedStatus = getUserStatusFromStorage(userId);
        const storedApprovalStatus = getUserApprovalStatusFromStorage(userId);

        // Determine the final status
        let finalStatus = "Active"; // Default

        // Priority: localStorage > API approvalStatus > API status
        if (storedStatus) {
          finalStatus = storedStatus;
        } else if (user.approvalStatus) {
          // Map approvalStatus from API to frontend status
          finalStatus =
            user.approvalStatus === "Rejected"
              ? "Inactive"
              : user.approvalStatus === "Approved"
                ? "Active"
                : user.approvalStatus === "Pending"
                  ? "Pending"
                  : "Active";
        } else if (user.status) {
          finalStatus = user.status;
        }

        const userObj = {
          // Standardize field names
          userId: user.userId || user.userid || "",
          userid: user.userid || user.userId || "",
          username: user.username || "",
          email: user.email || "",
          fullName: user.fullName || "",
          mobilePhone: user.mobilePhone || "",
          entityType: user.entityType || "",
          userType: user.entityType || "",
          insuredName: user.insuredName || "",
          roles: user.roles || [],
          submitDate: user.submitDate || "",
          // Use the determined status
          status: finalStatus,
          // Store approvalStatus from localStorage or API
          approvalStatus: storedApprovalStatus || user.approvalStatus || "",
          approvedDate: user.approvedDate || "",
          approvedBy: user.approvedBy || "",
        };

        return userObj;
      });

      setUsers(transformedUsers);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch roles for role assignment
  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found.");

      const response = await fetch(ROLES_API, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rolesArray =
        (data && data.success && Array.isArray(data.data) && data.data) ||
        (Array.isArray(data) ? data : []) ||
        [];

      // Normalize a bit
      const normalized = rolesArray
        .map((r) => ({
          roleID: r.roleID ?? r.roleId ?? r.id,
          roleName: r.roleName ?? r.name,
          description: r.description,
          isActive: r.isActive,
          isSystemRole: r.isSystemRole,
        }))
        .filter((r) => Boolean(r.roleID) && Boolean(r.roleName));

      setAvailableRoles(normalized);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setAvailableRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openRolesModal = (user) => {
    const existingRoleIds = Array.isArray(user?.roles)
      ? user.roles.map((r) => r?.roleID).filter(Boolean)
      : [];

    setRolesTargetUser(user);
    setSelectedRoleIds(existingRoleIds);
    setReplaceExistingRoles(true);
    setShowRolesModal(true);
  };

  const closeRolesModal = () => {
    setShowRolesModal(false);
    setRolesTargetUser(null);
    setSelectedRoleIds([]);
    setReplaceExistingRoles(true);
  };

  const toggleRoleId = (roleID) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleID)
        ? prev.filter((id) => id !== roleID)
        : [...prev, roleID],
    );
  };

  const assignRolesToUser = async () => {
    const userId = rolesTargetUser?.userId || rolesTargetUser?.userid;
    if (!userId) {
      setError("User ID not found.");
      return;
    }

    setAssigningRoles(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found.");

      const payload = {
        userId: String(userId),
        roleIds: selectedRoleIds,
        replaceExisting: replaceExistingRoles,
      };

      const response = await fetch(
        `${getApiBaseUrl()}/Auth/users/${encodeURIComponent(
          String(userId),
        )}/roles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      setToast({ message: "Roles updated.", type: "success" });
      closeRolesModal();
      await fetchUsers();
    } catch (err) {
      console.error("Error assigning roles:", err);
      setToast({ message: err.message || "Failed to update roles", type: "error" });
    } finally {
      setAssigningRoles(false);
    }
  };

  // Handle user added successfully
  const handleUserAdded = () => {
    // Refresh the users list after adding a new user
    fetchUsers();
    setShowAddUserModal(false);
  };

  // Handle approve user
  const handleApproveUser = async (user) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found.");

      const requestBody = {
        userId: String(user.userId || user.userid),
        userType: user.userType || user.entityType || "User",
        approvalNotes: "Approved via admin panel",
      };

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          (u.userId || u.userid) === (user.userId || user.userid)
            ? {
                ...u,
                status: "Active",
                approvalStatus: "Approved",
                approvedDate: new Date().toISOString(),
              }
            : u,
        ),
      );

      // Save to localStorage
      saveUserStatusToStorage(user.userId || user.userid, "Active", "Approved");

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
        setUsers((prev) =>
          prev.map((u) =>
            (u.userId || u.userid) === (user.userId || user.userid) ? user : u,
          ),
        );

        const errorText = await response.text();
        throw new Error(`Failed to approve user: ${errorText}`);
      }

      const result = await response.json();
      console.log("Approve successful:", result);

      setError("User approved successfully");
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error("Error approving user:", err);
      // Revert on error
      setUsers((prev) =>
        prev.map((u) =>
          (u.userId || u.userid) === (user.userId || user.userid) ? user : u,
        ),
      );
      setToast({ message: err.message || "Failed to approve user. Please try again.", type: "error" });
    }
  };

  // Handle reject user
  const handleRejectUser = async (user) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found.");

      const requestBody = {
        userId: String(user.userId || user.userid),
        userType: user.userType || user.entityType || "User",
        rejectionReason: "Rejected via admin panel",
      };

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          (u.userId || u.userid) === (user.userId || user.userid)
            ? {
                ...u,
                status: "Inactive",
                approvalStatus: "Rejected",
                approvedDate: new Date().toISOString(),
              }
            : u,
        ),
      );

      // Save to localStorage
      saveUserStatusToStorage(
        user.userId || user.userid,
        "Inactive",
        "Rejected",
      );

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
        setUsers((prev) =>
          prev.map((u) =>
            (u.userId || u.userid) === (user.userId || user.userid) ? user : u,
          ),
        );

        const errorText = await response.text();
        throw new Error(`Failed to reject user: ${errorText}`);
      }

      const result = await response.json();
      console.log("Reject successful:", result);

      setError("User rejected successfully");
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error("Error rejecting user:", err);
      // Revert on error
      setUsers((prev) =>
        prev.map((u) =>
          (u.userId || u.userid) === (user.userId || user.userid) ? user : u,
        ),
      );
      setToast({ message: err.message || "Failed to reject user. Please try again.", type: "error" });
    }
  };

  // Fetch user permissions
  const fetchUserPermissions = async (userId) => {
    setPermissionsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      // Extract just the username portion before any colon
      const cleanUserId = userId.split(":")[0];

      // URL-encode the userId to handle special characters
      const encodedUserId = encodeURIComponent(cleanUserId);

      console.log(
        `Fetching permissions for userId: "${userId}" -> encoded: "${encodedUserId}"`,
      );

      const response = await fetch(`${USER_PERMISSIONS_API}/${encodedUserId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Try to get more detailed error information
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If response is not JSON, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Permissions API response:", data);

      // Handle different response structures
      let permissions = [];
      if (data.success && Array.isArray(data.data)) {
        permissions = data.data;
      } else if (Array.isArray(data)) {
        permissions = data;
      } else if (data.permissions && Array.isArray(data.permissions)) {
        permissions = data.permissions;
      } else if (data.data && Array.isArray(data.data)) {
        permissions = data.data;
      }

      // Extract permission names from the response
      const permissionNames = permissions
        .map((p) => p.permissionName || p.name || p)
        .filter(Boolean);
      console.log("Extracted permission names:", permissionNames);

      setUserPermissions(permissionNames);

      return permissions;
    } catch (err) {
      console.error("Error fetching user permissions:", err);
      setUserPermissions([]);
      setError(`Failed to fetch permissions: ${err.message}`);
      return [];
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Fetch all available permissions
  const fetchAllPermissions = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await fetch(PERMISSIONS_API, {
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
      // Filter active permissions
      const activePermissions = Array.isArray(data)
        ? data.filter((p) => p.isActive === true)
        : [];
      setAllPermissions(activePermissions);

      return activePermissions;
    } catch (err) {
      console.error("Error fetching all permissions:", err);
      setAllPermissions([]);
      setError(`Failed to load permissions: ${err.message}`);
      return [];
    }
  };

  // Assign a permission to the selected user from the modal
  const handleAssignPermission = async () => {
    const permissionIdNum = Number(selectedPermissionIdToAssign);
    if (!selectedUser) {
      setError("No user selected.");
      return;
    }
    if (!Number.isFinite(permissionIdNum) || permissionIdNum <= 0) {
      setError("Please select a permission to assign.");
      return;
    }

    setAssigningPermission(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const permission = allPermissions.find(
        (p) => p.permissionID === permissionIdNum,
      );
      if (!permission) {
        throw new Error("Permission not found.");
      }

      const requestBody = {
        userId: (selectedUser.userid || selectedUser.userId).toString(),
        userType: selectedUser.userType || "User",
        permissionId: permissionIdNum,
      };

      const response = await fetch(ASSIGN_PERMISSION_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      await response.json().catch(() => null);

      // Refresh user permissions after assignment
      await fetchUserPermissions(selectedUser.userid || selectedUser.userId);

      // Clear selection
      setSelectedPermissionIdToAssign("");

      setError("Permission assigned successfully.");
      setTimeout(() => setError(null), 2500);
    } catch (err) {
      console.error("Error assigning permission:", err);
      setError(`Failed to assign permission: ${err.message}`);
    } finally {
      setAssigningPermission(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleViewPermissions = async (user) => {
    console.log("Opening permissions for user:", user);

    // Ensure we have the user ID correctly
    const userId = user.userId || user.userid;
    if (!userId) {
      setError("User ID not found");
      return;
    }

    setSelectedUser(user);
    setShowPermissionsModal(true);
    setPermissionsLoading(true);

    try {
      // Load both user permissions and all permissions
      await Promise.all([fetchUserPermissions(userId), fetchAllPermissions()]);
    } catch (err) {
      console.error("Error loading permissions:", err);
      setError(`Failed to load permissions: ${err.message}`);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Handle revoking permission
  const handleRevokePermission = async (permissionId, permissionName) => {
    if (!selectedUser || !permissionId) return;

    const ok = await confirm({
      title: "Revoke this permission?",
      message: `${selectedUser.username || "This user"} will no longer have ${permissionName}.`,
      confirmLabel: "Revoke",
    });
    if (!ok) return;

    setAssigningPermission(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const requestBody = {
        userId: (selectedUser.userid || selectedUser.userId).toString(),
        userType: selectedUser.userType || "User",
        permissionId: permissionId,
      };

      const response = await fetch(REVOKE_PERMISSION_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();

      // Refresh user permissions after revocation
      await fetchUserPermissions(selectedUser.userid || selectedUser.userId);

      // Show success message
      const successMsg =
        result.message || `Permission "${permissionName}" revoked successfully`;
      setError(successMsg);
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error("Error revoking permission:", err);
      setError(`Failed to revoke permission: ${err.message}`);
    } finally {
      setAssigningPermission(false);
    }
  };

  // Close permissions modal
  const closePermissionsModal = () => {
    setShowPermissionsModal(false);
    setSelectedUser(null);
    setUserPermissions([]);
    setPermissionSearch("");
    setSelectedPermissionIdToAssign("");
  };

  // Open the permissions modal from the table
  const openPermissionsModal = async (user) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
    // Keep allPermissions in the background (needed to resolve Permission ID for revokes)
    // but the UI will show only assigned permissions.
    await fetchAllPermissions();
    await fetchUserPermissions(user?.userid || user?.userId);
  };

  // Note: we now render only assigned permissions in the modal,
  // so we no longer need an "isPermissionAssigned" check over allPermissions.

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.fullName?.toLowerCase().includes(q) ||
      user.insuredName?.toLowerCase().includes(q) ||
      user.userId?.toString().toLowerCase().includes(q) ||
      user.userid?.toString().toLowerCase().includes(q) ||
      user.mobilePhone?.toLowerCase().includes(q) ||
      user.entityType?.toLowerCase().includes(q) ||
      user.contactPerson?.toLowerCase().includes(q) ||
      getUserRolesText(user).toLowerCase().includes(q)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage,
  );

  // Show loading while checking access
  if (checkingAccess) {
    return (
      <div className="grid min-h-[300px] place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#155dfd]" />
      </div>
    );
  }

  // Show Access Denied if no User.View permission
  if (!canViewUsers) {
    return <AccessDenied title="Users" message="You don't have permission to view users." />;
  }

  // Show Access Denied for Add User action if no SystemUser.Create permission
  const handleAddUserClick = () => {
    if (!canCreateUser) {
      setShowCreateUserAccessDenied(true);
    } else {
      setShowAddUserModal(true);
    }
  };

  const nameOf = (user) => user.fullName || user.insuredName || user.username || "Unnamed user";
  const idOf = (user) => user.userId || user.userid || "";
  const message = error && !showPermissionsModal ? error : null;
  const messageIsSuccess = String(message || "").toLowerCase().includes("success");

  const rolePills = (user) =>
    Array.isArray(user.roles) && user.roles.some((r) => r?.roleName) ? (
      <div className="flex flex-wrap gap-1">
        {user.roles
          .filter((r) => r?.roleName)
          .map((r) => (
            <span
              key={r.roleID ?? r.roleName}
              title={r.description || r.roleName}
              className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-100"
            >
              {r.roleName}
            </span>
          ))}
      </div>
    ) : (
      <span className="text-xs text-slate-400">No roles</span>
    );

  const statusCell = (user) =>
    user.status?.toLowerCase() === "pending" ? (
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => handleApproveUser(user)}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          <Check className="h-3.5 w-3.5" />
          Approve
        </button>
        <button
          type="button"
          onClick={() => handleRejectUser(user)}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </button>
      </div>
    ) : (
      <StatusPill tone={statusTone(user.status)}>{user.status || "Active"}</StatusPill>
    );

  const actions = (user) => (
    <div className="flex items-center justify-end gap-1.5">
      <button type="button" onClick={() => openRolesModal(user)} disabled={rolesLoading} className={`${btnSecondary} px-2.5 py-1.5 text-xs`} title="Assign roles">
        <ShieldCheck className="h-3.5 w-3.5" />
        Roles
      </button>
      <button type="button" onClick={() => openPermissionsModal(user)} className={`${btnSecondary} px-2.5 py-1.5 text-xs`} title="Manage permissions">
        <KeyRound className="h-3.5 w-3.5" />
        Permissions
      </button>
    </div>
  );

  const assignable = allPermissions.filter((p) => {
    const name = p.permissionName || "";
    const matchesSearch = !permissionSearch ? true : name.toLowerCase().includes(permissionSearch.toLowerCase());
    return matchesSearch && !userPermissions.includes(name);
  });

  const visibleRoles = availableRoles
    .filter((r) => r?.isActive !== false)
    .filter((r) => !["Company", "CompanyAdmin"].includes(r.roleName))
    .sort((a, b) => String(a.roleName).localeCompare(String(b.roleName)));

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showCreateUserAccessDenied && (
        <Toast message="You don't have permission to create users." type="error" onClose={() => setShowCreateUserAccessDenied(false)} />
      )}
      {confirmDialog}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, username, email, role…" className="sm:max-w-sm sm:flex-1" />
        <span className="text-sm text-slate-500">
          {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2 sm:ml-auto">
          <ViewToggle value={view} onChange={setView} className="hidden lg:inline-flex" />
          <button type="button" onClick={fetchUsers} disabled={loading} className={btnSecondary} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button type="button" onClick={handleAddUserClick} className={btnPrimary}>
            <UserPlus className="h-4 w-4" />
            Add user
          </button>
        </div>
      </div>

      {message && (
        <Notice tone={messageIsSuccess ? "success" : "error"} onClose={() => setError(null)}>
          {message}
        </Notice>
      )}

      {loading ? (
        <div className="grid place-items-center rounded-2xl border border-slate-200 py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[#155dfd]" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200">
          <EmptyState icon={Users} title={searchQuery ? "No users match your search" : "No users yet"} text={searchQuery ? "Try a different search." : "Add the first system user."} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Table (large screens) */}
          <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentUsers.map((user, index) => (
                  <tr key={idOf(user) || index} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={nameOf(user)} />
                        <div className="min-w-0">
                          <p className="max-w-[14rem] truncate font-semibold text-slate-900">{nameOf(user)}</p>
                          <p className="text-xs text-slate-500">
                            {user.username || "–"} · {idOf(user)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block max-w-[14rem] truncate text-slate-700">{user.email || "–"}</span>
                      <span className="block text-xs text-slate-500">{user.mobilePhone || user.phone || "–"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill tone="blue" dot={false}>
                        {user.entityType || user.userType || "User"}
                      </StatusPill>
                    </td>
                    <td className="max-w-[14rem] px-4 py-3.5">{rolePills(user)}</td>
                    <td className="px-4 py-3.5">{statusCell(user)}</td>
                    <td className="px-5 py-3.5">{actions(user)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards */}
          <ul className={cardListCls(view)}>
            {currentUsers.map((user, index) => (
              <li key={idOf(user) || index} className={cardItemCls(view)}>
                <div className="flex items-start gap-3">
                  <Avatar name={nameOf(user)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{nameOf(user)}</p>
                    <p className="truncate text-xs text-slate-500">
                      {user.username || "–"} · {idOf(user)}
                    </p>
                  </div>
                  <StatusPill tone="blue" dot={false}>
                    {user.entityType || user.userType || "User"}
                  </StatusPill>
                </div>
                <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="truncate text-slate-700">{user.email || "–"}</dd>
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="text-slate-700">{user.mobilePhone || user.phone || "–"}</dd>
                  <dt className="text-slate-500">Roles</dt>
                  <dd>{rolePills(user)}</dd>
                  <dt className="text-slate-500">Status</dt>
                  <dd>{statusCell(user)}</dd>
                </dl>
                <div className="mt-auto pt-3">
                  <div className="border-t border-slate-100 pt-2">{actions(user)}</div>
                </div>
              </li>
            ))}
          </ul>

          <Pager
            page={currentPage}
            totalPages={totalPages}
            total={filteredUsers.length}
            pageSize={usersPerPage}
            onPage={(n) => setCurrentPage(Math.max(1, Math.min(n, totalPages)))}
            onPageSize={(n) => {
              setUsersPerPage(n);
              setCurrentPage(1);
            }}
            noun="users"
          />
        </div>
      )}

      {/* Add user */}
      <Addnewuser isOpen={showAddUserModal} onClose={() => setShowAddUserModal(false)} onUserAdded={handleUserAdded} />

      {/* Assign roles */}
      {showRolesModal && rolesTargetUser && (
        <Sheet
          open
          onClose={() => !assigningRoles && closeRolesModal()}
          title="Assign roles"
          sub={nameOf(rolesTargetUser)}
          leading={<Avatar name={nameOf(rolesTargetUser)} className="h-10 w-10 text-sm" />}
          footer={
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={fetchRoles} disabled={rolesLoading || assigningRoles} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${rolesLoading ? "animate-spin" : ""}`} />
                Reload roles
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={closeRolesModal} disabled={assigningRoles} className={btnSecondary}>
                  Cancel
                </button>
                <button type="button" onClick={assignRolesToUser} disabled={assigningRoles || selectedRoleIds.length === 0} className={btnPrimary}>
                  {assigningRoles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {assigningRoles ? "Saving…" : `Save ${selectedRoleIds.length || ""} role${selectedRoleIds.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>
          }
        >
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <span>
              <span className="block text-sm font-semibold text-slate-900">Replace existing roles</span>
              <span className="block text-xs text-slate-500">On: the user keeps only the roles ticked below. Off: these are added to what they have.</span>
            </span>
            <span className="relative inline-flex shrink-0">
              <input type="checkbox" checked={replaceExistingRoles} onChange={(e) => setReplaceExistingRoles(e.target.checked)} disabled={assigningRoles} className="peer sr-only" />
              <span className="h-5 w-9 rounded-full bg-slate-300 transition-colors peer-checked:bg-[#155dfd]" />
              <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
            </span>
          </label>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <h3 className="text-sm font-semibold text-slate-900">Roles</h3>
              <span className="text-xs text-slate-500">{selectedRoleIds.length} selected</span>
            </div>
            {rolesLoading ? (
              <div className="grid place-items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#155dfd]" />
              </div>
            ) : visibleRoles.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">No roles available.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {visibleRoles.map((r) => {
                  const checked = selectedRoleIds.includes(r.roleID);
                  return (
                    <li key={r.roleID}>
                      <label className={`flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors ${checked ? "bg-blue-50/50" : "hover:bg-slate-50"}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleRoleId(r.roleID)} disabled={assigningRoles} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#155dfd]" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900">{r.roleName}</span>
                          {r.description && <span className="block text-xs text-slate-500">{r.description}</span>}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </Sheet>
      )}

      {/* Manage permissions */}
      {showPermissionsModal && selectedUser && (
        <Sheet
          open
          size="lg"
          onClose={closePermissionsModal}
          title="Permissions"
          sub={`${nameOf(selectedUser)} · ${idOf(selectedUser)} · ${selectedUser.entityType || selectedUser.userType || "User"}`}
          leading={<Avatar name={nameOf(selectedUser)} className="h-10 w-10 text-sm" />}
          footer={
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => fetchUserPermissions(selectedUser?.userid || selectedUser?.userId)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                <RefreshCw className={`h-4 w-4 ${permissionsLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button type="button" onClick={closePermissionsModal} className={btnPrimary}>
                Done
              </button>
            </div>
          }
        >
          {error && (
            <Notice tone={String(error).toLowerCase().includes("success") ? "success" : "error"} onClose={() => setError(null)}>
              {error}
            </Notice>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Assigned", value: userPermissions.length, tone: "text-[#155dfd]" },
              { label: "Available", value: allPermissions.length, tone: "text-slate-900" },
              { label: "Roles", value: Array.isArray(selectedUser.roles) ? selectedUser.roles.length : 0, tone: "text-slate-900" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`text-2xl font-bold tracking-tight ${s.tone}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Assign */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Give a permission</h3>
            <p className="text-xs text-slate-500">Only permissions this user does not already have are listed.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]">
              <SearchInput value={permissionSearch} onChange={setPermissionSearch} placeholder="Filter permissions" />
              <select value={selectedPermissionIdToAssign} onChange={(e) => setSelectedPermissionIdToAssign(e.target.value)} className={inputCls}>
                <option value="">{assignable.length ? `Choose one of ${assignable.length}` : "No permissions to add"}</option>
                {assignable.map((p) => (
                  <option key={p.permissionID} value={p.permissionID}>
                    {p.permissionName}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAssignPermission} disabled={assigningPermission || !selectedPermissionIdToAssign} className={btnPrimary}>
                {assigningPermission ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Assign
              </button>
            </div>
          </section>

          {/* Assigned */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <h3 className="text-sm font-semibold text-slate-900">Assigned permissions</h3>
              {permissionsLoading && <Loader2 className="h-4 w-4 animate-spin text-[#155dfd]" />}
            </div>
            {userPermissions.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {userPermissions.map((permissionName, idx) => (
                  <li key={`${permissionName}-${idx}`} className="flex items-center gap-3 px-5 py-2.5">
                    <KeyRound className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-slate-800">{permissionName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const match = allPermissions.find((p) => p.permissionName === permissionName);
                        if (!match) {
                          setError(`Can't revoke "${permissionName}" because its Permission ID wasn't found in the permissions list.`);
                          return;
                        }
                        handleRevokePermission(match.permissionID, match.permissionName);
                      }}
                      disabled={assigningPermission}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Minus className="h-3.5 w-3.5" />
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={KeyRound} title="No permissions yet" text="This user has no permissions of their own. Give one above." />
            )}
          </section>
        </Sheet>
      )}
    </div>
  );
};

export default UsersTab;
