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
} from "react-icons/fi";

const UsersTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const usersPerPage = 10;

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://gibsbrokersapi.newgibsonline.com/api/Users",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Add authentication headers if required
            // 'Authorization': 'Bearer your-token-here'
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.insuredName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Initial user form state based on your schema
  const initialUserState = {
    userid: 0,
    username: "",
    password: "",
    title: "",
    insuredName: "",
    location: "",
    identification: "",
    idNumber: "",
    email: "",
    phone: "",
    occupation: "",
    address: "",
    field01: "",
    field02: "",
    field03: "",
    field04: "",
    field05: "",
  };

  const [userForm, setUserForm] = useState(initialUserState);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingUser
        ? `https://gibsbrokersapi.newgibsonline.com/api/Users/${editingUser.userid}`
        : "https://gibsbrokersapi.newgibsonline.com/api/Users";

      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': 'Bearer your-token-here'
        },
        body: JSON.stringify(userForm),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the user list after successful operation
      fetchUsers();
      closeForm();
    } catch (err) {
      setError(err.message);
      console.error("Error saving user:", err);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(
        `https://gibsbrokersapi.newgibsonline.com/api/Users/${userId}`,
        {
          method: "DELETE",
          headers: {
            // 'Authorization': 'Bearer your-token-here'
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the user list after successful deletion
      fetchUsers();
    } catch (err) {
      setError(err.message);
      console.error("Error deleting user:", err);
    }
  };

  const handleEdit = (user) => {
    setUserForm(user);
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleView = (user) => {
    setUserForm(user);
    setEditingUser({ ...user, userid: 0 });
    setShowUserForm(true);
  };

  const closeForm = () => {
    setShowUserForm(false);
    setUserForm(initialUserState);
    setEditingUser(null);
  };

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
            className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg"
            onClick={fetchUsers}
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg"
            onClick={() => setShowUserForm(true)}
            disabled={loading}
          >
            <FiPlus className="mr-2" />
            Add New User
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
                    Department
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Take Off
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <tr
                      key={user.userid}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        {(currentPage - 1) * usersPerPage + index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {user.userid}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-4 py-3">{user.title}</td>
                      <td className="px-4 py-3">{user.insuredName}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{user.phone}</td>
                      <td className="px-4 py-3">{user.occupation}</td>
                      <td className="px-4 py-3">{user.idNumber}</td>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleView(user)}
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleEdit(user)}
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDelete(user.userid)}
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
                      colSpan="11"
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

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingUser
                  ? editingUser.userid
                    ? "Edit User"
                    : "View User"
                  : "Add New User"}
              </h3>
              <button
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={userForm.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={editingUser && !editingUser.userid}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={userForm.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={editingUser && !editingUser.userid}
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={userForm.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editingUser && !editingUser.userid}
                    placeholder="e.g., Mr, Mrs, Dr"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="insuredName"
                    value={userForm.insuredName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editingUser && !editingUser.userid}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={userForm.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={editingUser && !editingUser.userid}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={userForm.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editingUser && !editingUser.userid}
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={userForm.occupation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editingUser && !editingUser.userid}
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={userForm.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editingUser && !editingUser.userid}
                  />
                </div>
              </div>

              {!editingUser || editingUser.userid ? (
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
                    {editingUser ? "Update User" : "Create User"}
                  </button>
                </div>
              ) : null}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UsersTab;
