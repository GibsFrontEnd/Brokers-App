import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ClientList() {
  const location = useLocation();
  const basePrefix = location.pathname.startsWith("/admin")
    ? "/admin/brokers"
    : "/brokers";
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://gibsbrokersapi.newgibsonline.com/api/InsuredClients`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              // Add authorization header if needed
              ...(user?.token && { Authorization: `Bearer ${user.token}` }),
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch clients: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        // Handle both array response and single object response
        const clientsData = Array.isArray(data) ? data : [data];

        // Map API response to component format
        const mappedClients = clientsData.map((client) => ({
          id: client.insuredId,
          insuredId: client.insuredId,
          brokerId: client.brokerId,
          name: client.insuredName,
          email: client.email,
          phone: client.mobilePhone,
          company: client.contactPerson, // Using contactPerson as company name
          dateAdded: formatDate(client.submitDate),
          status: "ACTIVE", // Default status since it's not in the API
          address: client.address,
          password: client.password,
          type: client.type,
          a1: client.a1,
          a2: client.a2,
          rate: client.rate,
          value: client.value,
          tag: client.tag,
          remarks: client.remarks,
          field1: client.field1,
          field2: client.field2,
        }));

        setClients(mappedClients);
      } catch (err) {
        console.error("Error fetching clients:", err);
        setError(err.message || "Failed to fetch clients");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [user]);

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Delete selected clients
  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Delete each selected client
      const deletePromises = selectedClients.map(async (clientId) => {
        const response = await fetch(
          `https://gibsbrokersapi.newgibsonline.com/api/InsuredClients/${clientId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              // Add authorization header if needed
              ...(user?.token && { Authorization: `Bearer ${user.token}` }),
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete client ${clientId}: ${response.status} ${response.statusText}`
          );
        }

        return clientId;
      });

      await Promise.all(deletePromises);

      // Remove deleted clients from local state
      setClients(
        clients.filter((client) => !selectedClients.includes(client.id))
      );
      setSelectedClients([]);
    } catch (err) {
      console.error("Error deleting clients:", err);
      setError(err.message || "Failed to delete clients");
    } finally {
      setLoading(false);
    }
  };

  const toggleClientSelection = (clientId) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <div className="animate-pulse text-gray-600">Loading clients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 sm:px-6 py-4 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Error:</strong> {error}
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="text-center lg:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Client Management
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              You Can Edit Or Delete A Client Here
            </p>
          </div>
          <Link
            to={`${basePrefix}/client-management/add-client`}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add New Client
          </Link>
        </div>
      </div>

      {/* Clients Table/Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Client Database
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage client accounts and information
          </p>
        </div>

        {/* Mobile Card View for small screens */}
        <div className="block lg:hidden">
          {clients.length > 0 ? (
            clients.map((client) => (
              <div
                key={client.id}
                className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => toggleClientSelection(client.id)}
                    />
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-700">
                          {client.name ? client.name.charAt(0) : "?"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 block">
                          {client.name || "N/A"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {client.company || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        client.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                      }`}
                    >
                      {client.status}
                    </span>
                    <Link
                      to={`${basePrefix}/client-management/edit/${client.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                    <span className="text-gray-600 break-all">
                      {client.email || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span className="text-gray-600">
                      {client.phone || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500">
                    <svg
                      className="w-3 h-3 text-gray-400 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Added {client.dateAdded}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <div className="flex flex-col items-center">
                <svg
                  className="w-12 h-12 text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-sm text-gray-500">No clients found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add your first client to get started
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View for large screens */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    checked={
                      selectedClients.length === clients.length &&
                      clients.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClients(clients.map((client) => client.id));
                      } else {
                        setSelectedClients([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date Added
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.length > 0 ? (
                clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        checked={selectedClients.includes(client.id)}
                        onChange={() => toggleClientSelection(client.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-700">
                            {client.name ? client.name.charAt(0) : "?"}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {client.name || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 text-gray-400 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                        {client.email || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 text-gray-400 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {client.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.company || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 text-gray-400 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {client.dateAdded}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          client.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-gray-100 text-gray-800 border border-gray-200"
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/brokers/client-management/edit/${client.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-gray-300 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <p className="text-sm text-gray-500">No clients found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Add your first client to get started
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action Buttons Section - Mobile Responsive */}
        {selectedClients.length > 0 && (
          <div className="px-4 sm:px-6 py-4 bg-red-50 border-t border-red-200">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-red-800">
                  {selectedClients.length} client
                  {selectedClients.length > 1 ? "s" : ""} selected
                </span>
              </div>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    DELETE SELECTED ({selectedClients.length})
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer with Add Client Button - Mobile Responsive */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <p className="text-sm text-gray-600 text-center sm:text-left">
              {clients.length} client{clients.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
