import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiPlus,
  FiX,
  FiRefreshCw,
  FiKey,
  FiMinus,
  FiPlusCircle,
  FiCheck,
    FiUserPlus 
} from "react-icons/fi";
import Addnewuser from "./Addnewuser"; 




const UsersTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const usersPerPage = 10;
   const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Permission Modal States
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [allPermissions, setAllPermissions] = useState([]);
  const [assigningPermission, setAssigningPermission] = useState(false);

  const USERS_API = "https://gibsbrokersapi.newgibsonline.com/api/Auth/users";
  const PERMISSIONS_API = "https://gibsbrokersapi.newgibsonline.com/api/Auth/permissions";
  const USER_PERMISSIONS_API = "https://gibsbrokersapi.newgibsonline.com/api/Auth/user-permissions";
  const ASSIGN_PERMISSION_API = "https://gibsbrokersapi.newgibsonline.com/api/Auth/assign-permission";
  const REVOKE_PERMISSION_API = "https://gibsbrokersapi.newgibsonline.com/api/Auth/revoke-permission";

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
          `HTTP error! status: ${response.status}`
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
      console.warn("Unexpected API response format, using empty array:", data);
      usersArray = [];
    }

    // Transform users to ensure consistent field names
    const transformedUsers = usersArray.map(user => {
      const userObj = {
        // Standardize field names
        userId: user.userId || user.userid || '',
        userid: user.userid || user.userId || '',
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        mobilePhone: user.mobilePhone || '',
        entityType: user.entityType || '',
        userType: user.entityType || '', // Map entityType to userType for backward compatibility
        insuredName: user.insuredName || '',
        roles: user.roles || [],
        submitDate: user.submitDate || '',
        status: "Active" // Default status
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


  // Handle user added successfully
  const handleUserAdded = () => {
    // Refresh the users list after adding a new user
    fetchUsers();
    setShowAddUserModal(false);
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
    const cleanUserId = userId.split(':')[0];
    
    // URL-encode the userId to handle special characters
    const encodedUserId = encodeURIComponent(cleanUserId);
    
    console.log(`Fetching permissions for userId: "${userId}" -> encoded: "${encodedUserId}"`);
    
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
      } catch (e) {
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
    const permissionNames = permissions.map(p => p.permissionName || p.name || p).filter(Boolean);
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
        ? data.filter(p => p.isActive === true)
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
    await Promise.all([
      fetchUserPermissions(userId),
      fetchAllPermissions()
    ]);
  } catch (err) {
    console.error("Error loading permissions:", err);
    setError(`Failed to load permissions: ${err.message}`);
  } finally {
    setPermissionsLoading(false);
  }
};

  // Handle assigning permission
  const handleAssignPermission = async (permissionId) => {
    if (!selectedUser || !permissionId) return;
    
    setAssigningPermission(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const permission = allPermissions.find(p => p.permissionID === permissionId);
      if (!permission) {
        throw new Error("Permission not found");
      }

      const requestBody = {
        userId: (selectedUser.userid || selectedUser.userId).toString(),
        userType: selectedUser.userType || "User",
        permissionId: permissionId
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
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Refresh user permissions after assignment
      await fetchUserPermissions(selectedUser.userid || selectedUser.userId);
      
      // Show success message
      const successMsg = result.message || `Permission "${permission.permissionName}" assigned successfully`;
      setError(successMsg);
      setTimeout(() => setError(null), 3000);
      
    } catch (err) {
      console.error("Error assigning permission:", err);
      setError(`Failed to assign permission: ${err.message}`);
    } finally {
      setAssigningPermission(false);
    }
  };

  // Handle revoking permission
  const handleRevokePermission = async (permissionId, permissionName) => {
    if (!selectedUser || !permissionId) return;
    
    if (!window.confirm(`Are you sure you want to revoke permission: ${permissionName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const requestBody = {
        userId: (selectedUser.userid || selectedUser.userId).toString(),
        userType: selectedUser.userType || "User",
        permissionId: permissionId
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
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Refresh user permissions after revocation
      await fetchUserPermissions(selectedUser.userid || selectedUser.userId);
      
      // Show success message
      const successMsg = result.message || `Permission "${permissionName}" revoked successfully`;
      setError(successMsg);
      setTimeout(() => setError(null), 3000);
      
    } catch (err) {
      console.error("Error revoking permission:", err);
      setError(`Failed to revoke permission: ${err.message}`);
    }
  };

  // Close permissions modal
  const closePermissionsModal = () => {
    setShowPermissionsModal(false);
    setSelectedUser(null);
    setUserPermissions([]);
  };

  // Check if a permission is assigned to user
  const isPermissionAssigned = (permissionName) => {
    return userPermissions.includes(permissionName);
  };

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
      user.mobilePhone?.toLowerCase().includes(q)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

       {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Search by username, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          <button
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg"
            onClick={() => setShowAddUserModal(true)}
          >
            <FiUserPlus className="mr-2" />
            Add User
          </button>
          <button
            className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg"
            onClick={fetchUsers}
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Users Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    S/N
                  </th>
                  <th scope="col" className="px-4 py-3">
                    User ID
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Username
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Title
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Full Name
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Phone
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Permissions
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <tr
                      key={user.userId || user.userid || index}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        {(currentPage - 1) * usersPerPage + index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {user.userId || user.userid || ""}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {user.username || ""}
                      </td>
                      <td className="px-4 py-3">
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
    {user.entityType || user.userType || "User"}
  </span>
</td>
                      <td className="px-4 py-3">
                        {user.fullName || user.insuredName || ""}
                      </td>
                      <td className="px-4 py-3">{user.email || ""}</td>
                      <td className="px-4 py-3">
                        {user.mobilePhone || user.phone || ""}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewPermissions(user)}
                          className="flex items-center bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          title="View/Manage Permissions"
                        >
                          <FiKey className="mr-1" size={14} />
                          Permissions
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.status || "Active"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {searchQuery
                        ? "No users match your search"
                        : "No users found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border-t border-gray-200">
            <span className="text-sm text-gray-700 mb-4 sm:mb-0">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * usersPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * usersPerPage, filteredUsers.length)}
              </span>{" "}
              of <span className="font-medium">{filteredUsers.length}</span>{" "}
              Users
            </span>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Addnewuser 
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={handleUserAdded}
      />

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Manage Permissions: {selectedUser.username}
                </h3>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    <FiKey className="text-purple-500 mr-1" size={16} />
                    <span className="text-sm text-gray-600">
                      User ID: <span className="font-bold">{selectedUser.userid || selectedUser.userId}</span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FiKey className="text-blue-500 mr-1" size={16} />
                   <span className="text-sm text-gray-600">
  Roles: <span className="font-bold capitalize">{selectedUser.entityType || selectedUser.userType || "User"}</span>
</span>
                  </div>
                  <div className="flex items-center">
                    <FiKey className="text-green-500 mr-1" size={16} />
                    <span className="text-sm text-gray-600">
                      Assigned: <span className="font-bold">{userPermissions.length}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={closePermissionsModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Controls */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    All Permissions ({allPermissions.length})
                  </h4>
                  {permissionsLoading && (
                    <div className="flex items-center text-blue-600">
                      <FiRefreshCw className="animate-spin mr-2" size={16} />
                      <span className="text-sm">Loading...</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={fetchAllPermissions}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiRefreshCw className="mr-2" />
                    Refresh Permissions
                  </button>
                </div>
              </div>

              {/* Permissions Table */}
              {allPermissions.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Permission Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Module
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allPermissions.map((permission) => {
                        const isAssigned = isPermissionAssigned(permission.permissionName);
                        
                        return (
                          <tr 
                            key={permission.permissionID} 
                            className={`hover:bg-gray-50 ${isAssigned ? 'bg-green-50' : ''}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FiKey className={`mr-2 ${isAssigned ? 'text-green-500' : 'text-gray-400'}`} size={16} />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {permission.permissionName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {permission.permissionID}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {permission.module || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                permission.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                permission.action === 'READ' ? 'bg-blue-100 text-blue-800' :
                                permission.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                                permission.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {permission.action || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate" title={permission.description}>
                                {permission.description || "No description"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isAssigned 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {isAssigned ? (
                                  <>
                                    <FiCheck className="mr-1" size={12} />
                                    Assigned
                                  </>
                                ) : (
                                  "Not Assigned"
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isAssigned ? (
                                <button
                                  onClick={() => handleRevokePermission(permission.permissionID, permission.permissionName)}
                                  disabled={assigningPermission}
                                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FiMinus className="mr-1" size={12} />
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAssignPermission(permission.permissionID)}
                                  disabled={assigningPermission}
                                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FiPlusCircle className="mr-1" size={12} />
                                  Assign
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <FiKey size={56} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Permissions Found</h3>
                  <p className="text-gray-600 mb-6">There are no permissions available to assign.</p>
                  <button
                    onClick={fetchAllPermissions}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    <FiRefreshCw className="mr-2" />
                    Load Permissions
                  </button>
                </div>
              )}

              {/* Summary Stats */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Assigned Permissions</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">{userPermissions.length}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FiKey className="text-blue-600" size={24} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Available Permissions</p>
                      <p className="text-2xl font-bold text-green-900 mt-1">{allPermissions.length}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <FiKey className="text-green-600" size={24} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Current Roles</p>
                      <p className="text-2xl font-bold text-purple-900 mt-1 capitalize">{selectedUser.userType || "User"}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <FiKey className="text-purple-600" size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                User: <span className="font-medium">{selectedUser.username}</span> • 
                ID: <span className="font-medium">{selectedUser.userid || selectedUser.userId}</span> • 
                Type: <span className="font-medium capitalize">{selectedUser.userType || "User"}</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={closePermissionsModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTab;