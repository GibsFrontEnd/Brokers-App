import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

// Constants
const API_BASE_URL = "https://gibsbrokersapi.newgibsonline.com/api";
const TABLE_HEADERS = [
  { key: "name", label: "Sub Agent Name", className: "w-1/6" },
  { key: "email", label: "Email Address", className: "w-1/6" },
  { key: "phone", label: "Phone Number", className: "w-1/8" },
  { key: "contactPerson", label: "Contact Person", className: "w-1/8" },
  { key: "brokerId", label: "Broker ID", className: "w-1/8" },
  { key: "address", label: "Address", className: "w-1/5" },
  { key: "dateAdded", label: "Date Added", className: "w-1/8" },
  { key: "tag", label: "Tag", className: "w-1/12" },
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
          No sub agents match your search criteria.
        </p>
      </div>
    </div>
  </div>
);

const ClientCard = ({ client }) => (
  <div className="border-b border-gray-200 p-6 hover:bg-gray-50 transition-colors duration-200">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-lg font-semibold text-blue-700">
              {getInitials(client.name)}
            </span>
          </div>
          <div>
            <Link
              to={`/admin/users/clients/${client.insuredId}`}
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
      {client.tag && (
        <span className="inline-flex px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
          {client.tag}
        </span>
      )}
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
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="text-gray-600">
            Broker: {client.brokerId || "N/A"}
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
      </div>
    </div>
  </div>
);

const ClientTableRow = ({ client }) => (
  <tr className="hover:bg-gray-50 transition-colors duration-200">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-sm font-semibold text-blue-700">
            {getInitials(client.name)}
          </span>
        </div>
        <div>
          <Link
            to={`/admin/users/clients/${client.insuredId}`}
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
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
      {client.brokerId || "N/A"}
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
      <span className="inline-flex px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
        {client.tag || "N/A"}
      </span>
    </td>
  </tr>
);

const ManageClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState("");
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
      submitDate: client.submitDate,
      type: client.type,
      tag: client.tag,
      remarks: client.remarks,
      field1: client.field1,
      field2: client.field2,
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
      setError(
        err.response?.data?.message || err.message || "Failed to fetch clients"
      );
    } finally {
      setLoading(false);
    }
  }, [transformClientData]);

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

  // Render states
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchClients} />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Manage Sub Agents
            </h1>
            <p className="text-gray-600 text-lg">
              View and manage all sub agents accounts across all brokers
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header with Stats */}
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Sub Agents Database
              </h2>
              <p className="text-gray-600 mt-1">
                All sub agents accounts and information
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
                  Search Clients
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
                    placeholder="Search by name, email, phone, ID, or broker..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Tag Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag
                </label>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Tags</option>
                  {uniqueTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
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
                {searchTerm || filterTag || startDate || endDate ? (
                  <span className="font-medium">
                    Active filters:{" "}
                    {[
                      searchTerm && "Search",
                      filterTag && "Tag",
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
              <ClientCard key={client.id} client={client} />
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
                    <ClientTableRow key={client.id} client={client} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={TABLE_HEADERS.length}>
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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

export default ManageClients;
