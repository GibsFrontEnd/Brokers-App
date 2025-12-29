import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";

const ClientCertificate = () => {
  const [activeTab, setActiveTab] = useState("motor");
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const navigate = useNavigate();
  const location = useLocation();
  const isAdminContext = location.pathname.startsWith("/admin");

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { day: "2-digit", month: "short", year: "numeric" };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch {
      return "Invalid Date";
    }
  };

  // Format currency for display
  const formatCurrency = (amount, currency = "NGN") => {
    if (!amount) return "N/A";
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: currency,
      }).format(amount);
    } catch {
      return "Invalid Amount";
    }
  };

  // Fetch certificates from API based on active tab
  const fetchCertificates = useCallback(async () => {
    // Only fetch for Motor Policies tab, others will be added later
    if (activeTab !== "motor") {
      setCertificates([]);
      setFilteredCertificates([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://gibsbrokersapi.newgibsonline.com/api/Certificate/motor/list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCertificates(response.data);
      setFilteredCertificates(response.data);
    } catch (err) {
      console.error("Fetch error:", err);

      if (err.response?.status === 401 && !isAdminContext) {
        setError("Authentication failed. Please login again.");
        navigate("/login");
      } else if (err.response?.status === 403 && !isAdminContext) {
        setError("You do not have permission to view certificates.");
      } else {
        setError(err.response?.data?.message || "Failed to fetch certificates");
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, isAdminContext, navigate]);

  useEffect(() => {
    const needsRefresh = location.state?.refresh;
    if (needsRefresh) {
      fetchCertificates();
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      fetchCertificates();
    }
  }, [location, navigate, fetchCertificates]);

  // Fetch certificates when active tab changes
  useEffect(() => {
    fetchCertificates();
  }, [activeTab, fetchCertificates]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedCerts([]);
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    // Data will be fetched in useEffect when activeTab changes
  };

  // Handle search and filter functionality
  const handleSearch = useCallback(() => {
    let filtered = [...certificates];

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((cert) => {
        const brokerIdentifier = cert.brokerID || cert.brokerId;

        return (
          cert.certNo?.toLowerCase().includes(searchLower) ||
          cert.policyNo?.toLowerCase().includes(searchLower) ||
          cert.insuredName?.toLowerCase().includes(searchLower) ||
          cert.name?.toLowerCase().includes(searchLower) ||
          brokerIdentifier?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply date range filter
    if (startDate || endDate) {
      const normalizeDate = (value) => {
        const dateObject = new Date(value);
        if (Number.isNaN(dateObject.getTime())) {
          return null;
        }
        return new Date(
          dateObject.getFullYear(),
          dateObject.getMonth(),
          dateObject.getDate()
        );
      };

      const start = startDate ? normalizeDate(startDate) : null;
      const end = endDate ? normalizeDate(endDate) : null;

      filtered = filtered.filter((cert) => {
        const rawDate = cert.transDate || cert.transactionDate;
        if (!rawDate) {
          return false;
        }

        const normalizedCertDate = normalizeDate(rawDate);
        if (!normalizedCertDate) {
          return false;
        }

        if (start && end) {
          return normalizedCertDate >= start && normalizedCertDate <= end;
        }
        if (start) {
          return normalizedCertDate >= start;
        }
        if (end) {
          return normalizedCertDate <= end;
        }
        return true;
      });
    }

    setFilteredCertificates(filtered);
  }, [certificates, searchTerm, startDate, endDate]);

  // Auto-apply filters when dependencies change
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setFilteredCertificates(certificates);
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const activeFilterCount = [searchTerm.trim(), startDate, endDate].filter(
    Boolean
  ).length;

  const activeFiltersSummary = [
    searchTerm.trim() ? `Search: "${searchTerm.trim()}"` : null,
    startDate ? `From ${formatDate(startDate)}` : null,
    endDate ? `To ${formatDate(endDate)}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const hasActiveFilters = activeFilterCount > 0;

  // Pagination calculations
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCertificates = filteredCertificates.slice(
    startIndex,
    endIndex
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, activeTab]);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Toggle certificate selection
  const toggleCertificateSelection = (certId) => {
    setSelectedCerts((prev) =>
      prev.includes(certId)
        ? prev.filter((id) => id !== certId)
        : [...prev, certId]
    );
  };

  // Get create certificate link based on active tab
  const getCreateCertificateLink = () => {
    // Determine base path based on context
    const basePrefix = isAdminContext ? "/admin/client" : "/client";

    switch (activeTab) {
      case "motor":
        return `${basePrefix}/certificates/create/motor`;
      case "marine":
        return `${basePrefix}/certificates/create/marine`;
      case "compulsory":
        return `${basePrefix}/certificates/create/compulsory`;
      default:
        return `${basePrefix}/certificates/create/motor`;
    }
  };

  // Get certificate view link
  const getCertificateViewLink = (certificate) => {
    const basePath = isAdminContext ? "/admin/client" : "/client";
    return `${basePath}/certificates/view/${certificate.certNo}`;
  };

  // Get unique certificate identifier
  const getCertId = (certificate) => {
    return certificate.id || certificate.certNo || Math.random().toString();
  };

  // Get tab label for display
  const getTabLabel = () => {
    const tabMap = {
      motor: "Motor",
      marine: "Marine",
      compulsory: "Compulsory Insurance",
    };
    return tabMap[activeTab] || "Motor";
  };

  // Handle select all certificates
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCerts(filteredCertificates.map((c) => getCertId(c)));
    } else {
      setSelectedCerts([]);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center text-gray-600">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p>Loading certificates...</p>
      </div>
    );
  }

  if (error && !isAdminContext) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={fetchCertificates}
            className="mt-3 text-sm bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Policies Management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage your certificates and sub agent operations
        </p>
      </div>

      {/* Tabs Section - Mobile Responsive */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            {[{ key: "motor", label: "Motor Policies" }].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`py-2 sm:py-3 px-3 sm:px-4 border-b-2 text-sm sm:text-lg font-bold transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === "motor" ? (
        <>
          {/* Search & Filter Section */}
          <div className="mb-6">
            <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={toggleFilters}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 hover:from-blue-600/10 hover:to-indigo-600/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600">
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
                        d="M4 6h16M6 10h12m-9 4h6"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-blue-900">
                      Filters
                    </p>
                    <p className="text-xs text-blue-600">
                      {hasActiveFilters
                        ? activeFiltersSummary
                        : "Refine certificate results"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                      {activeFilterCount} active
                    </span>
                  )}
                  <svg
                    className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${
                      showFilters ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {showFilters && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-5 space-y-4 border-t border-blue-100">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <svg
                          className="w-5 h-5 text-blue-600"
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
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search by certificate no, policy no, insured name..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm transition-all duration-200 hover:border-blue-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <svg
                          className="w-5 h-5 text-blue-600"
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
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm transition-all duration-200 hover:border-blue-400"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm transition-all duration-200 hover:border-blue-400"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-semibold whitespace-nowrap shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        Filter
                      </button>

                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm font-semibold whitespace-nowrap shadow-sm hover:shadow"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!showFilters && hasActiveFilters && (
                <div className="px-4 sm:px-6 py-3 border-t border-blue-100 bg-blue-50 text-xs sm:text-sm text-blue-700">
                  Active filters: {activeFiltersSummary}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Section - Mobile Responsive */}
          <div className="mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Link
                to={getCreateCertificateLink()}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium w-full sm:w-auto"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create {getTabLabel()} Policy
              </Link>
            </div>
          </div>

          {/* Certificates Section - Mobile Responsive */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                Your Certificates
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredCertificates.length} certificate
                {filteredCertificates.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onChange={handleSelectAll}
                        checked={
                          selectedCerts.length ===
                            filteredCertificates.length &&
                          filteredCertificates.length > 0
                        }
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cert No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Broker ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Insured Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Policy No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trans.Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Insured Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Premium
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCertificates.map((certificate) => (
                    <tr
                      key={getCertId(certificate)}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedCerts.includes(
                            getCertId(certificate)
                          )}
                          onChange={() =>
                            toggleCertificateSelection(getCertId(certificate))
                          }
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Link
                          to={getCertificateViewLink(certificate)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                        >
                          {certificate.certNo}
                        </Link>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {certificate.brokerID || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {certificate.insuredName || certificate.name || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {certificate.policyNo || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(
                          certificate.transDate || certificate.transactionDate
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(
                          certificate.insuredValue || certificate.suminsured
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(
                          certificate.grossPremium || certificate.premium
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                          {certificate.status || "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={getCertificateViewLink(certificate)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-full transition-colors font-medium"
                          >
                            View
                          </Link>
                          <button className="text-red-600 hover:text-red-800 font-medium transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              {paginatedCertificates.map((certificate) => (
                <div
                  key={getCertId(certificate)}
                  className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                        checked={selectedCerts.includes(getCertId(certificate))}
                        onChange={() =>
                          toggleCertificateSelection(getCertId(certificate))
                        }
                      />
                      <div>
                        <Link
                          to={getCertificateViewLink(certificate)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline block"
                        >
                          {certificate.certNo}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          Broker: {certificate.brokerID || "N/A"}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                      {certificate.status || "Active"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-500 text-xs">Insured Name</p>
                      <p className="font-medium truncate">
                        {certificate.insuredName || certificate.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Policy No</p>
                      <p className="font-medium">
                        {certificate.policyNo || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Date</p>
                      <p className="text-gray-600">
                        {formatDate(
                          certificate.transDate || certificate.transactionDate
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Premium</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(
                          certificate.grossPremium || certificate.premium
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-gray-500 text-xs">Insured Value</p>
                      <p className="font-semibold text-green-600 text-sm">
                        {formatCurrency(
                          certificate.insuredValue || certificate.sumInsured
                        )}
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <Link
                        to={getCertificateViewLink(certificate)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Print
                      </Link>
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {filteredCertificates.length > 0 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Results info */}
                  <div className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(endIndex, filteredCertificates.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredCertificates.length}
                    </span>{" "}
                    results
                  </div>

                  {/* Pagination controls */}
                  <div className="flex items-center gap-2">
                    {/* Items per page selector */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700">Per page:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    {/* Page navigation */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>

                      {/* Page numbers */}
                      <div className="hidden sm:flex items-center gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNumber = index + 1;
                          // Show first page, last page, current page, and pages around current
                          const showPage =
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 &&
                              pageNumber <= currentPage + 1);

                          const showEllipsis =
                            (pageNumber === 2 && currentPage > 3) ||
                            (pageNumber === totalPages - 1 &&
                              currentPage < totalPages - 2);

                          if (showEllipsis) {
                            return (
                              <span
                                key={pageNumber}
                                className="px-2 py-1 text-gray-500"
                              >
                                ...
                              </span>
                            );
                          }

                          if (!showPage) return null;

                          return (
                            <button
                              key={pageNumber}
                              onClick={() => goToPage(pageNumber)}
                              className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${
                                currentPage === pageNumber
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>

                      {/* Mobile page indicator */}
                      <div className="sm:hidden px-3 py-1 text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </div>

                      <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredCertificates.length === 0 && !loading && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No certificates found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? "Try a different search term"
                    : "Get started by creating a new certificate"}
                </p>
                <div className="mt-6">
                  <Link
                    to={getCreateCertificateLink()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create New Certificate
                  </Link>
                </div>
              </div>
            )}

            {/* Selection Actions - Mobile Responsive */}
            {selectedCerts.length > 0 && (
              <div className="px-4 sm:px-6 py-4 bg-blue-50 border-t border-blue-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
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
                    <span className="text-sm font-medium text-blue-800">
                      {selectedCerts.length} selected
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button className="inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex-1 sm:flex-none">
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
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-10 sm:p-12 text-center">
            <svg
              className="mx-auto h-14 w-14 text-yellow-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Not Activated
            </h3>
            <p className="text-gray-600">Coming soon.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientCertificate;
