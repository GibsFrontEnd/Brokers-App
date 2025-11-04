import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiX,
  FiSave,
  FiRefreshCw,
  FiUser,
  FiKey,
  FiUserCheck,
  FiUserX,
  FiUsers,
} from "react-icons/fi";
import CryptoJS from "crypto-js";

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
  const permissionsPerPage = 10;
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showRevokeForm, setShowRevokeForm] = useState(false);
  const [revokeForm, setRevokeForm] = useState({
    userId: "",
    userType: "",
    permissionId: "",
  });

  // Fetch permissions from API
  const fetchPermissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await fetch(
        "https://gibsbrokersapi.newgibsonline.com/api/Auth/permissions",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Directly parse as JSON since API returns JSON
      const data = await response.json();
      setPermissions(data);
      console.log("Permissions loaded successfully:", data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await fetch(
        "https://gibsbrokersapi.newgibsonline.com/api/Auth/permissions",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      // If users endpoint doesn't exist, create a mock list
      setUsers([
        {
          id: "1",
          username: "john.doe",
          email: "john@example.com",
          userType: "Admin",
        },
        {
          id: "2",
          username: "jane.smith",
          email: "jane@example.com",
          userType: "User",
        },
        {
          id: "3",
          username: "bob.wilson",
          email: "bob@example.com",
          userType: "Manager",
        },
      ]);
    }
  };

  // Fetch user permissions
  const fetchUserPermissions = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      // This endpoint might need to be created on your backend
      const response = await fetch(
        `https://gibsbrokersapi.newgibsonline.com/api/Auth/user-permissions/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data);
      } else {
        // If endpoint doesn't exist, show empty state
        setUserPermissions([]);
      }
    } catch (err) {
      console.error("Error fetching user permissions:", err);
      setUserPermissions([]);
    }
  };

  // Fetch permissions and users on component mount
  useEffect(() => {
    fetchPermissions();
    fetchUsers();
  }, []);

  // ASSIGN PERMISSION FUNCTION
 const assignPermission = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error('No authentication token found');
    }

    if (!assignmentForm.userId || !assignmentForm.permissionId) {
      throw new Error('Please select both user and permission');
    }

    // Format data exactly as backend expects
    const requestBody = {
      userId: assignmentForm.userId.toString(), // Ensure it's a string
      userType: assignmentForm.userType || 'User', // Default if empty
      permissionId: parseInt(assignmentForm.permissionId) // Ensure it's a number
    };

    console.log('Sending data:', requestBody); // Debug log

    const response = await fetch('https://gibsbrokersapi.newgibsonline.com/api/Auth/assign-permission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    setSuccess('Permission assigned successfully!');
    closeAssignmentForm();
    
    // Refresh user permissions if viewing a specific user
    if (selectedUser) {
      fetchUserPermissions(selectedUser.id);
    }
  } catch (err) {
    setError(err.message);
    console.error('Error assigning permission:', err);
  }
};

  //REVOKE PERMISSION FUNCTION
  const openRevokeForm = () => {
    setShowRevokeForm(true);
  };

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
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error('No authentication token found');
    }

    if (!revokeForm.userId || !revokeForm.permissionId) {
      throw new Error('Please select both user and permission');
    }

    if (!window.confirm('Are you sure you want to revoke this permission?')) {
      return;
    }

    // Format data exactly as backend expects
    const requestBody = {
      userId: revokeForm.userId.toString(),
      userType: revokeForm.userType || 'User',
      permissionId: parseInt(revokeForm.permissionId)
    };

    console.log('Revoking permission with data:', requestBody); // Debug log

    const response = await fetch('https://gibsbrokersapi.newgibsonline.com/api/Auth/revoke-permission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    setSuccess('Permission revoked successfully!');
    closeRevokeForm();
    
    // Refresh user permissions if viewing a specific user
    if (selectedUser) {
      fetchUserPermissions(selectedUser.id);
    }
  } catch (err) {
    setError(err.message);
    console.error('Error revoking permission:', err);
  }
};


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
      permission.action?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredPermissions.length / permissionsPerPage);
  const currentPermissions = filteredPermissions.slice(
    (currentPage - 1) * permissionsPerPage,
    currentPage * permissionsPerPage
  );

  // Initial permission form state
  const initialPermissionState = {
    permissionName: "",
    description: "",
    module: "",
    action: "",
    endpoint: "",
    IsActive: "",
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

      const url =
        "https://gibsbrokersapi.newgibsonline.com/api/Auth/permissions";
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
          : "Permission created successfully!"
      );
      fetchPermissions();
      closeForm();
    } catch (err) {
      setError(err.message);
      console.error("Error saving permission:", err);
    }
  };

  const handleDelete = async (permissionId) => {
    if (!window.confirm("Are you sure you want to delete this permission?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `https://gibsbrokersapi.newgibsonline.com/api/Auth/permissions/${permissionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
    setEditingPermission({ ...permission, id: 0 });
    setShowPermissionForm(true);
  };

  const openAssignmentForm = () => {
    setShowAssignmentForm(true);
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

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
          <button
            onClick={() => setError(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          <button
            onClick={() => setSuccess(null)}
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
            placeholder="Search by permission name, module, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-2 flex-wrap gap-2">
          <button
            className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg"
            onClick={fetchPermissions}
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg"
            onClick={openAssignmentForm}
            disabled={loading}
          >
            <FiUserCheck className="mr-2" />
            Assign Permission
          </button>
          <button
            className="flex items-center bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg"
            onClick={openRevokeForm}
            disabled={loading}
          >
            <FiUserX className="mr-2" />
            Revoke Permission
          </button>
          <button
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg"
            onClick={() => setShowPermissionForm(true)}
            disabled={loading}
          >
            <FiPlus className="mr-2" />
            Add Permission
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Permissions Table */}
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
                    Permission Name
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Description
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Module
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Action
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Endpoint
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Is Active
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentPermissions.length > 0 ? (
                  currentPermissions.map((permission, index) => (
                    <tr
                      key={permission.permissionID}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        {(currentPage - 1) * permissionsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {permission.permissionName}
                      </td>
                      <td className="px-4 py-3">{permission.description}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {permission.module}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            permission.action === "Create"
                              ? "bg-green-100 text-green-800"
                              : permission.action === "Read"
                              ? "bg-blue-100 text-blue-800"
                              : permission.action === "Update"
                              ? "bg-yellow-100 text-yellow-800"
                              : permission.action === "Delete"
                              ? "bg-red-100 text-red-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {permission.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {permission.endpoint}
                      </td>
                      <td className="px-4 py-3">
                        {permission.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(permission.createdDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleView(permission)}
                            title="View Permission"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleEdit(permission)}
                            title="Edit Permission"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() =>
                              handleDelete(permission.permissionID)
                            }
                            title="Delete Permission"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
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
                        ? "No permissions match your search"
                        : "No permissions found"}
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
                {(currentPage - 1) * permissionsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  currentPage * permissionsPerPage,
                  filteredPermissions.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium">{filteredPermissions.length}</span>{" "}
              Permissions
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

      {/* Permission Form Modal */}
      {showPermissionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingPermission
                  ? editingPermission.permissionID
                    ? "Edit Permission"
                    : "View Permission"
                  : "Add New Permission"}
              </h3>
              <button
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permission Name *
                  </label>
                  <input
                    type="text"
                    name="permissionName"
                    value={permissionForm.permissionName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={
                      editingPermission && !editingPermission.permissionID
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={permissionForm.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={
                      editingPermission && !editingPermission.permissionID
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module *
                  </label>
                  <input
                    type="text"
                    name="module"
                    value={permissionForm.module}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={
                      editingPermission && !editingPermission.permissionID
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action *
                  </label>
                  <select
                    name="action"
                    value={permissionForm.action}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={
                      editingPermission && !editingPermission.permissionID
                    }
                  >
                    <option value="">Select Action</option>
                    <option value="Create">Create</option>
                    <option value="Read">Read</option>
                    <option value="Update">Update</option>
                    <option value="Delete">Delete</option>
                    <option value="Manage">Manage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endpoint *
                  </label>
                  <input
                    type="text"
                    name="endpoint"
                    value={permissionForm.endpoint}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="POST api/auth/create-system-user"
                    disabled={
                      editingPermission && !editingPermission.permissionID
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="isActive"
                    value={permissionForm.isActive}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={
                      editingPermission && !editingPermission.permissionID
                    }
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
              </div>

              {(!editingPermission || editingPermission.permissionID) && (
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <FiSave className="mr-2" />
                    {editingPermission
                      ? "Update Permission"
                      : "Create Permission"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Assign Permission Modal */}
      {showAssignmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                Assign Permission to User
              </h3>
              <button
                onClick={closeAssignmentForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User *
                  </label>
                  <select
  name="userId"
  value={assignmentForm.userId}
  onChange={handleAssignmentChange}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  required
>
  <option value="">Choose a user</option>
  {users.map((user) => (
    <option key={user.id} value={user.id}>
      {user.username} ({user.email}) - {user.userType}
    </option>
  ))}
</select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Type
                  </label>
                  <select
                    name="userType"
                    value={assignmentForm.userType}
                    onChange={handleAssignmentChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select user type</option>
                    <option value="Broker">Broker</option>
                    <option value="Client">Client</option>
                    <option value="Company">Company</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Permission *
                  </label>
                  <select
                    name="permissionId"
                    value={assignmentForm.permissionId}
                    onChange={handleAssignmentChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a permission</option>
                    {permissions.map((permission) => (
                      <option key={permission.id} value={permission.id}>
                        {permission.permissionName} ({permission.module}.
                        {permission.action})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeAssignmentForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={assignPermission}
                  className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center"
                >
                  <FiUserCheck className="mr-2" />
                  Assign Permission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Permission Modal */}
      {showRevokeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                Revoke Permission from User
              </h3>
              <button
                onClick={closeRevokeForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User *
                  </label>
                  <select
                    name="userId"
                    value={revokeForm.userId}
                    onChange={handleRevokeFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email}) - {user.userType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Type
                  </label>
                  <select
                    name="userType"
                    value={revokeForm.userType}
                    onChange={handleRevokeFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select user type</option>
                    <option value="Broker">Broker</option>
                    <option value="Client">Client</option>
                    <option value="Company">Company</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Permission to Revoke *
                  </label>
                  <select
                    name="permissionId"
                    value={revokeForm.permissionId}
                    onChange={handleRevokeFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a permission to revoke</option>
                    {permissions.map((permission) => (
                      <option key={permission.id} value={permission.id}>
                        {permission.permissionName} ({permission.module}.
                        {permission.action})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeRevokeForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRevokePermission}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center"
                >
                  <FiUserX className="mr-2" />
                  Revoke Permission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Permissions Modal */}
     {showUserPermissions && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b">
        <h3 className="text-xl font-semibold text-gray-800">
          {selectedUser
            ? `Permissions for ${selectedUser.username}`
            : "User Permissions"}
        </h3>
        <button
          onClick={closeUserPermissions}
          className="text-gray-500 hover:text-gray-700"
        >
          <FiX size={24} />
        </button>
      </div>

      <div className="p-6">
        {!selectedUser ? (
          <div>
            <h4 className="text-lg font-medium mb-4">
              Select a user to view their permissions:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div onClick={() => handleViewUserPermissions(user)}>
                    <h5 className="font-medium">{user.username}</h5>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      Type: {user.userType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-semibold">
                    {selectedUser.username}
                  </h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <p className="text-sm text-gray-500">
                    User Type: {selectedUser.userType}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Back to Users
                  </button>
                  <button
                    onClick={() => {
                      setAssignmentForm({
                        userId: selectedUser.id,
                        userType: selectedUser.userType,
                        permissionId: "",
                      });
                      setShowAssignmentForm(true);
                    }}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    <FiUserCheck className="mr-2" />
                    Assign New Permission
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-4">
                Current Permissions:
              </h4>
              {userPermissions && userPermissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                      <tr>
                        <th className="px-4 py-3">Permission Name</th>
                        <th className="px-4 py-3">Module</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Endpoint</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPermissions.map((permission, index) => (
                        <tr
                          key={permission.permissionID || index}
                          className="bg-white border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {permission.permissionName || permission.name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              {permission.module}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                permission.action === "Create"
                                  ? "bg-green-100 text-green-800"
                                  : permission.action === "Read"
                                  ? "bg-blue-100 text-blue-800"
                                  : permission.action === "Update"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : permission.action === "Delete"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {permission.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {permission.endpoint}
                          </td>
                          <td className="px-4 py-3">
                            {permission.isActive ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                handleRevokePermission(
                                  selectedUser.id,
                                  permission.permissionID || permission.id
                                )
                              }
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                              title="Revoke Permission"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiUserX
                    size={48}
                    className="mx-auto mb-4 text-gray-300"
                  />
                  <p>No permissions assigned to this user.</p>
                </div>
              )}
            </div>

            {loading && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default PermissionsTab;
