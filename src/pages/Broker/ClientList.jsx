import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import CryptoJS from "crypto-js";

// Constants
const API_BASE_URL = "https://gibsbrokersapi.newgibsonline.com/api";
const TABLE_HEADERS = [
  { key: "name", label: "Sub Agent Name", className: "w-1/6" },
  { key: "email", label: "Email Address", className: "w-1/6" },
  { key: "phone", label: "Phone Number", className: "w-1/8" },
  { key: "contactPerson", label: "Contact Person", className: "w-1/8" },
  { key: "address", label: "Address", className: "w-1/5" },
  { key: "dateAdded", label: "Date Added", className: "w-1/8" },
  { key: "type", label: "Type", className: "w-1/12" },
  { key: "status", label: "Status", className: "w-1/12" },
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
      <p className="text-gray-600 font-medium">Loading sub agents...</p>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="p-4 sm:p-8">
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-2xl mx-auto">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Sub agents
          </h3>
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
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No sub agents found
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Get started by adding your first sub agent to the system.
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
            <Link
              to={`${basePrefix}/client-management/details/${client.insuredId}`}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {client.name || "Unnamed Client"}
            </Link>
            <p className="text-sm text-gray-500">
              ID: {client.insuredId || "N/A"}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span
          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${statusVariant(
            client.status
          )}`}
        >
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
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
            />
          </svg>
          <span className="text-gray-600 break-all">
            {client.email || "No email provided"}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          <span className="text-gray-600">
            {client.phone || "No phone provided"}
          </span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-gray-600">
            {client.contactPerson || "No contact person"}
          </span>
        </div>
        {client.address && (
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-gray-600 text-sm leading-relaxed">
              {client.address}
            </span>
          </div>
        )}
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
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
          <Link
            to={`${basePrefix}/client-management/details/${client.insuredId}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            {client.name || "Unnamed Client"}
          </Link>
          <div className="text-xs text-gray-500">ID: {client.insuredId}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-2">
        <svg
          className="w-4 h-4 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
        </svg>
        <span className="text-sm text-gray-600 truncate max-w-xs">
          {client.email || "N/A"}
        </span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-2">
        <svg
          className="w-4 h-4 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
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
        <svg
          className="w-4 h-4 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
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
      <span
        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${statusVariant(
          client.status
        )}`}
      >
        {client.status}
      </span>
    </td>
  </tr>
);

const BulkActions = ({ selectedCount, onDelete, loading }) => (
  <div className="px-6 py-4 bg-red-50 border-t border-red-200">
    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <svg
            className="w-4 h-4 text-red-600"
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
            <svg
              className="w-4 h-4"
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

  const basePrefix = useMemo(
    () =>
      location.pathname.startsWith("/admin") ? "/admin/brokers" : "/brokers",
    [location.pathname]
  );

  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
          "Failed to fetch sub agents"
      );
    } finally {
      setLoading(false);
    }
  }, [transformClientData]);

  // Delete clients
  const handleDelete = useCallback(async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedClients.length} sub agent(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

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
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete sub agent ${clientId}: ${response.status}`
          );
        }

        return clientId;
      });

      await Promise.all(deletePromises);

      // Update local state
      setClients((prev) =>
        prev.filter((client) => !selectedClients.includes(client.id))
      );
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
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
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
    [paginatedClients.length, selectedClients.length]
  );

  const selectedCount = selectedClients.length;

  // Select all handler (must be after paginatedClients)
  const selectAllClients = useCallback(
    (e) => {
      setSelectedClients(
        e.target.checked ? paginatedClients.map((client) => client.id) : []
      );
    },
    [paginatedClients]
  );

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
              Sub Agent Management
            </h1>
            <p className="text-gray-600 text-lg">
              Manage and organize your sub agents accounts
            </p>
          </div>
          <Link
            to={`${basePrefix}/client-management/add-client`}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="w-5 h-5"
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
            <span>Add New Sub Agent</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header with Stats */}
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Sub Agent Database
              </h2>
              <p className="text-gray-600 mt-1">
                Manage all sub agent accounts and information
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Showing {paginatedClients.length} of {filteredClients.length}{" "}
                client{filteredClients.length !== 1 ? "s" : ""}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                  showFilters
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="font-medium">Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        {showFilters && (
          <div className="px-6 py-6 bg-gradient-to-br from-gray-50 to-blue-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Sub Agents
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, phone, or ID..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub Agent Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Types</option>
                  <option value="Individual">Individual</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Business">Business</option>
                </select>
              </div>

              {/* Date Range - Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Date Range - End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {searchTerm || filterType || startDate || endDate ? (
                  <span className="font-medium">
                    Active filters:{" "}
                    {[
                      searchTerm && "Search",
                      filterType && "Type",
                      startDate && "Start Date",
                      endDate && "End Date",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                ) : (
                  <span>No active filters</span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="block lg:hidden">
          {paginatedClients.length > 0 ? (
            paginatedClients.map((client) => (
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
                {paginatedClients.length > 0 ? (
                  paginatedClients.map((client) => (
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

        {/* Footer with Pagination */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Items per page */}
            <div className="flex items-center space-x-3">
              <label className="text-sm text-gray-600 font-medium">
                Rows per page:
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Pagination Info */}
            <div className="text-sm text-gray-600">
              Showing{" "}
              {paginatedClients.length > 0
                ? (currentPage - 1) * itemsPerPage + 1
                : 0}{" "}
              to {Math.min(currentPage * itemsPerPage, filteredClients.length)}{" "}
              of {filteredClients.length} clients
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="First page"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Last page"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientList;
