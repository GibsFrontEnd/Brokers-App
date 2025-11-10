import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Constants
const API_BASE_URL = "https://gibsbrokersapi.newgibsonline.com/api";
const TABLE_HEADERS = [
  { key: "name", label: "Client Name", className: "w-1/6" },
  { key: "email", label: "Email Address", className: "w-1/6" },
  { key: "phone", label: "Phone Number", className: "w-1/8" },
  { key: "contactPerson", label: "Contact Person", className: "w-1/8" },
  { key: "address", label: "Address", className: "w-1/5" },
  { key: "dateAdded", label: "Date Added", className: "w-1/8" },
  { key: "type", label: "Type", className: "w-1/12" },
  { key: "status", label: "Status", className: "w-1/12" },
  { key: "actions", label: "Actions", className: "w-1/8" },
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
  } catch (error) {
    return "Invalid Date";
  }
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
};

const statusVariant = (status) => {
  const variants = {
    ACTIVE: "bg-green-100 text-green-800 border-green-200",
    INACTIVE: "bg-gray-100 text-gray-800 border-gray-200",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    SUSPENDED: "bg-red-100 text-red-800 border-red-200",
  };
  return variants[status] || variants.INACTIVE;
};

// Sub-components
const LoadingState = () => (
  <div className="p-4 sm:p-8 text-center">
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 font-medium">Loading clients...</p>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="p-4 sm:p-8">
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-2xl mx-auto">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Clients</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="p-12 text-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Get started by adding your first client to the system.
        </p>
      </div>
    </div>
  </div>
);

const ClientCard = ({ client, isSelected, onSelect, basePrefix }) => (
  <div className="border-b border-gray-200 p-6 hover:bg-gray-50 transition-colors duration-200">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-4">
        <input
          type="checkbox"
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
          checked={isSelected}
          onChange={onSelect}
        />
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-lg font-semibold text-blue-700">
              {getInitials(client.name)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{client.name || "Unnamed Client"}</h3>
            <p className="text-sm text-gray-500">ID: {client.insuredId || "N/A"}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${statusVariant(client.status)}`}>
          {client.status}
        </span>
        <Link
          to={`${basePrefix}/client-management/${client.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm px-3 py-1 rounded-lg hover:bg-blue-50"
        >
          Edit
        </Link>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
          <span className="text-gray-600 break-all">{client.email || "No email provided"}</span>
        </div>
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-gray-600">{client.phone || "No phone provided"}</span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-gray-600">{client.contactPerson || "No contact person"}</span>
        </div>
        {client.address && (
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-600 text-sm leading-relaxed">{client.address}</span>
          </div>
        )}
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Added {client.dateAdded}</span>
        </div>
        {client.type && (
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">
            {client.type}
          </span>
        )}
      </div>
    </div>
  </div>
);

const ClientTableRow = ({ client, isSelected, onSelect, basePrefix }) => (
  <tr className="hover:bg-gray-50 transition-colors duration-200 group">
    <td className="px-6 py-4 whitespace-nowrap">
      <input
        type="checkbox"
        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
        checked={isSelected}
        onChange={() => onSelect(client.id)}
      />
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-sm font-semibold text-blue-700">
            {getInitials(client.name)}
          </span>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{client.name || "Unnamed Client"}</div>
          <div className="text-xs text-gray-500">ID: {client.insuredId}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
        <span className="text-sm text-gray-600 truncate max-w-xs">{client.email || "N/A"}</span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span className="text-sm text-gray-600">{client.phone || "N/A"}</span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
      {client.contactPerson || "N/A"}
    </td>
    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
      <div className="truncate" title={client.address}>
        {client.address || "N/A"}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm text-gray-600">{client.dateAdded}</span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className="inline-flex px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
        {client.type || "N/A"}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${statusVariant(client.status)}`}>
        {client.status}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-3">
        <Link
          to={`${basePrefix}/client-management/${client.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm px-3 py-1 rounded-lg hover:bg-blue-50"
        >
          Edit
        </Link>
        <button
          onClick={() => onSelect(client.id)}
          className="text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm px-3 py-1 rounded-lg hover:bg-gray-100"
        >
          Select
        </button>
      </div>
    </td>
  </tr>
);

const BulkActions = ({ selectedCount, onDelete, loading }) => (
  <div className="px-6 py-4 bg-red-50 border-t border-red-200">
    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-red-800">
            {selectedCount} client{selectedCount > 1 ? "s" : ""} selected
          </p>
          <p className="text-xs text-red-600">This action cannot be undone</p>
        </div>
      </div>
      <button
        onClick={onDelete}
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Deleting...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete Selected</span>
          </>
        )}
      </button>
    </div>
  </div>
);

const ClientList = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const basePrefix = useMemo(() => 
    location.pathname.startsWith("/admin") ? "/admin/brokers" : "/brokers",
    [location.pathname]
  );

  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      status: client.status || "ACTIVE",
    }));
  }, []);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/InsuredClients`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const mappedClients = transformClientData(data);
      setClients(mappedClients);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, [user, transformClientData]);

  // Delete clients
  const handleDelete = useCallback(async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedClients.length} client(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(true);

      const deletePromises = selectedClients.map(async (clientId) => {
        const response = await fetch(`${API_BASE_URL}/InsuredClients/${clientId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(user?.token && { Authorization: `Bearer ${user.token}` }),
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete client ${clientId}: ${response.status}`);
        }

        return clientId;
      });

      await Promise.all(deletePromises);

      // Update local state
      setClients(prev => prev.filter(client => !selectedClients.includes(client.id)));
      setSelectedClients([]);
    } catch (err) {
      console.error("Error deleting clients:", err);
      setError(err.message || "Failed to delete clients");
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedClients, user]);

  // Selection handlers
  const toggleClientSelection = useCallback((clientId) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  }, []);

  const selectAllClients = useCallback((e) => {
    setSelectedClients(e.target.checked ? clients.map(client => client.id) : []);
  }, [clients]);

  // Initial data fetch
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Memoized values
  const allSelected = useMemo(() => 
    clients.length > 0 && selectedClients.length === clients.length,
    [clients.length, selectedClients.length]
  );

  const selectedCount = selectedClients.length;

  // Render states
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchClients} />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Client Management
            </h1>
            <p className="text-gray-600 text-lg">
              Manage and organize your client accounts
            </p>
          </div>
          <Link
            to={`${basePrefix}/client-management/add-client`}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add New Client</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Client Database</h2>
              <p className="text-gray-600 mt-1">Manage all client accounts and information</p>
            </div>
            <div className="text-sm text-gray-500">
              {clients.length} client{clients.length !== 1 ? "s" : ""} total
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden">
          {clients.length > 0 ? (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                isSelected={selectedClients.includes(client.id)}
                onSelect={() => toggleClientSelection(client.id)}
                basePrefix={basePrefix}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
                      checked={allSelected}
                      onChange={selectAllClients}
                    />
                  </th>
                  {TABLE_HEADERS.map((header) => (
                    <th
                      key={header.key}
                      className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${header.className}`}
                    >
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <ClientTableRow
                      key={client.id}
                      client={client}
                      isSelected={selectedClients.includes(client.id)}
                      onSelect={toggleClientSelection}
                      basePrefix={basePrefix}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={TABLE_HEADERS.length + 1}>
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <BulkActions
            selectedCount={selectedCount}
            onDelete={handleDelete}
            loading={deleteLoading}
          />
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing all {clients.length} clients</span>
            <span>Updated just now</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientList;