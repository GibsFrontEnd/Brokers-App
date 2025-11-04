// src/pages/AgentsBrokers.jsx
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const AgentsBrokers = () => {
  const location = useLocation();
  const basePrefix = location.pathname.startsWith("/admin")
    ? "/admin/company"
    : "/company";
  const [brokers, setBrokers] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const API_BASE_URL = "https://gibsbrokersapi.newgibsonline.com/api";

  // Toggle row expansion
  const toggleRowExpansion = (brokerId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(brokerId)) {
      newExpandedRows.delete(brokerId);
    } else {
      newExpandedRows.add(brokerId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Fetch brokers from real API
  const fetchBrokers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("token");

      console.log(
        "Attempting to fetch brokers from:",
        `${API_BASE_URL}/Brokers`
      );
      console.log("Using token:", token ? "Token found" : "No token");

      const response = await fetch(`${API_BASE_URL}/Brokers`, {
        method: "GET",
        headers: {
          accept: "text/plain",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);

        if (response.status === 403) {
          throw new Error(
            `Access denied to Brokers API. Please check your permissions.`
          );
        } else if (response.status === 401) {
          throw new Error(
            `Authentication failed. Please try logging in again.`
          );
        } else {
          throw new Error(
            `HTTP error! status: ${response.status} - ${
              errorText || "Unknown error"
            }`
          );
        }
      }

      const data = await response.json();
      console.log("Raw API data:", data);

      // Transform API data to match expected format
      const transformedData = data.map((broker) => ({
        id: broker.brokerId,
        companyCode: broker.insCompanyId || "N/A",
        name: broker.brokerName,
        mobile: broker.mobilePhone,
        date: broker.submitDate
          ? new Date(broker.submitDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        contactPerson: broker.contactPerson,
        // Include all original fields
        brokerId: broker.brokerId,
        insCompanyId: broker.insCompanyId,
        brokerName: broker.brokerName,
        address: broker.address,
        email: broker.email,
        mobilePhone: broker.mobilePhone,
        password: broker.password,
        submitDate: broker.submitDate,
        rate: broker.rate,
        value: broker.value,
        a1: broker.a1,
        a2: broker.a2,
        a3: broker.a3,
        a4: broker.a4,
        a5: broker.a5,
        lstartDate: broker.lstartDate,
        lendDate: broker.lendDate,
        field1: broker.field1,
        field2: broker.field2,
        remarks: broker.remarks,
        tag: broker.tag,
      }));

      console.log("Transformed brokers data:", transformedData);
      setBrokers(transformedData);
    } catch (error) {
      console.error("Error fetching brokers:", error);
      setError(`Failed to load brokers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  // Delete broker via API
  const handleDelete = async (brokerId) => {
    if (
      !confirm(
        "Are you sure you want to delete this broker? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/Brokers/${brokerId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete broker: ${response.status}`);
      }

      // Remove broker from local state
      setBrokers(brokers.filter((broker) => broker.id !== brokerId));
      setSelectedBroker(null);

      alert("Broker deleted successfully!");
    } catch (error) {
      console.error("Error deleting broker:", error);
      setError("Failed to delete broker. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading brokers...</span>
        </div>
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
            <span className="text-sm sm:text-base">
              <strong>Error:</strong> {error}
            </span>
          </div>
          <button
            onClick={() => fetchBrokers()}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Agents & Brokers
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              You Can Edit Or Delete A Broker Here
            </p>
          </div>
          <Link
            to={`${basePrefix}/add-broker`}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
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
            Add New Broker
          </Link>
        </div>
      </div>

      {/* Brokers Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Broker Management
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Manage broker accounts and permissions
          </p>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden">
          {brokers.length > 0 ? (
            brokers.map((broker) => (
              <div
                key={broker.id}
                className="border-b border-gray-200 last:border-b-0"
              >
                <div
                  className="p-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleRowExpansion(broker.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {broker.brokerId.substring(0, 8)}...
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">
                        {broker.insCompanyId || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(broker.id);
                        }}
                        className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                      >
                        <svg
                          className="w-3 h-3 mr-1"
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
                        DELETE
                      </button>
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          expandedRows.has(broker.id) ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500 font-medium text-xs">
                      Broker Name:
                    </span>
                    <div className="mt-1">
                      <Link
                        to={`${basePrefix}/agents-brokers/edit/${encodeURIComponent(
                          broker.id
                        )}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {broker.brokerName}
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <div>
                      <span className="text-gray-500 font-medium">
                        Mobile Phone:
                      </span>
                      <div className="text-gray-900 mt-1 flex items-center">
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {broker.mobilePhone || "N/A"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Date:</span>
                      <div className="text-gray-900 mt-1 flex items-center">
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
                        {broker.date}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 font-medium">
                        Contact Person:
                      </span>
                      <div className="text-gray-900 mt-1">
                        {broker.contactPerson || "N/A"}
                      </div>
                    </div>
                  </div>

                  {expandedRows.has(broker.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500 font-medium">
                            Email:
                          </span>
                          <div className="text-gray-900 mt-1">
                            {broker.email || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">
                            Address:
                          </span>
                          <div className="text-gray-900 mt-1">
                            {broker.address || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">
                            Rate:
                          </span>
                          <div className="text-gray-900 mt-1">
                            {broker.rate || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">
                            Value:
                          </span>
                          <div className="text-gray-900 mt-1">
                            {broker.value || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">A1:</span>
                          <div className="text-gray-900 mt-1">
                            {broker.a1 || 0}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">A2:</span>
                          <div className="text-gray-900 mt-1">
                            {broker.a2 || 0}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">A3:</span>
                          <div className="text-gray-900 mt-1">
                            {broker.a3 || 0}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">A4:</span>
                          <div className="text-gray-900 mt-1">
                            {broker.a4 || 0}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">A5:</span>
                          <div className="text-gray-900 mt-1">
                            {broker.a5 || 0}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">
                            Field 1:
                          </span>
                          <div className="text-gray-900 mt-1">
                            {broker.field1 || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">
                            Field 2:
                          </span>
                          <div className="text-gray-900 mt-1">
                            {broker.field2 || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">
                            Tag:
                          </span>
                          <div className="text-gray-900 mt-1">
                            {broker.tag || "N/A"}
                          </div>
                        </div>
                      </div>
                      {broker.remarks && (
                        <div>
                          <span className="text-gray-500 font-medium">
                            Remarks:
                          </span>
                          <div className="text-gray-900 mt-1">
                            {broker.remarks}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
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
                <p className="text-sm text-gray-500">No brokers found</p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brokers.length > 0 ? (
                brokers.map((broker) => (
                  <>
                    <tr
                      key={broker.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleRowExpansion(broker.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {broker.brokerId.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">
                          {broker.insCompanyId || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`${basePrefix}/agents-brokers/edit/${encodeURIComponent(
                            broker.id
                          )}`}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {broker.brokerName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {broker.contactPerson || "N/A"}
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
                          {broker.mobilePhone || "N/A"}
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
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {broker.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(broker.id);
                            }}
                            className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                          >
                            <svg
                              className="w-3 h-3 mr-1"
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
                            DELETE
                          </button>
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                              expandedRows.has(broker.id) ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.has(broker.id) && (
                      <tr key={`${broker.id}-details`} className="bg-gray-50">
                        <td colSpan="7" className="px-6 py-4">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 font-medium">
                                Email:
                              </span>
                              <div className="text-gray-900 mt-1">
                                {broker.email || "N/A"}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                Address:
                              </span>
                              <div className="text-gray-900 mt-1">
                                {broker.address || "N/A"}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                Rate:
                              </span>
                              <div className="text-gray-900 mt-1">
                                {broker.rate || "N/A"}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                Value:
                              </span>
                              <div className="text-gray-900 mt-1">
                                {broker.value || "N/A"}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                A1:
                              </span>
                              <div className="text-gray-900 mt-1">
                                {broker.a1 || 0}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                A2:
                              </span>
                              <div className="text-gray-900 mt-1">
                                {broker.a2 || 0}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                A3:
                              </span>
                              <div className="text-gray-900 mt-1">
                                {broker.a3 || 0}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                A4:
                              </span>
                              <div className="text-gray-900 mt-1">
                                {broker.a4 || 0}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                A5:
                              </span>
                              <div className="text-gray-900 mt-1">
                                {broker.a5 || 0}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                Field 1:
                              </span>
                              <div className="text-gray-900 mt-1">
                                {broker.field1 || "N/A"}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                Field 2:
                              </span>
                              <div className="text-gray-900 mt-1">
                                {broker.field2 || "N/A"}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                Tag:
                              </span>
                              <div className="text-gray-900 mt-1">
                                {broker.tag || "N/A"}
                              </div>
                            </div>
                            {broker.remarks && (
                              <div className="col-span-3">
                                <span className="text-gray-500 font-medium">
                                  Remarks:
                                </span>
                                <div className="text-gray-900 mt-1">
                                  {broker.remarks}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
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
                      <p className="text-sm text-gray-500">No brokers found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <p className="text-sm text-gray-600 text-center sm:text-left">
              {brokers.length} broker{brokers.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
      </div>

      {selectedBroker && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-yellow-800">
              Click on a broker row to expand/collapse details
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsBrokers;
