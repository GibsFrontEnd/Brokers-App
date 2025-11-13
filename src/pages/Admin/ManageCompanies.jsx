import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");

        const response = await axios.get(
          `https://gibsbrokersapi.newgibsonline.com/api/Auth/companies`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("API Response:", response.data);

        // Extract data from response
        const companiesData = response.data.data || response.data || [];
        setCompanies(companiesData);
        setFilteredCompanies(companiesData);
      } catch (err) {
        console.error("Fetch error:", err);
        console.error("Error response:", err.response);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch companies"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Handle search and filter
  const handleSearch = useCallback(() => {
    let filtered = [...companies];

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((company) => {
        return (
          company.insCompanyId?.toLowerCase().includes(searchLower) ||
          company.companyName?.toLowerCase().includes(searchLower) ||
          company.email?.toLowerCase().includes(searchLower) ||
          company.mobilePhone?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((company) => {
        const status = company.tag?.toLowerCase() || "active";
        return status === statusFilter.toLowerCase();
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

      filtered = filtered.filter((company) => {
        const rawDate = company.submitDate;
        if (!rawDate) {
          return false;
        }

        const normalizedDate = normalizeDate(rawDate);
        if (!normalizedDate) {
          return false;
        }

        if (start && end) {
          return normalizedDate >= start && normalizedDate <= end;
        }
        if (start) {
          return normalizedDate >= start;
        }
        if (end) {
          return normalizedDate <= end;
        }
        return true;
      });
    }

    setFilteredCompanies(filtered);
  }, [companies, searchTerm, statusFilter, startDate, endDate]);

  // Auto-apply filters when dependencies change
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setFilteredCompanies(companies);
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const activeFilterCount = [
    searchTerm.trim(),
    statusFilter !== "all" ? statusFilter : "",
    startDate,
    endDate,
  ].filter(Boolean).length;

  // Pagination calculations
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, startDate, endDate]);

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

  // Get status badge color
  const getStatusBadge = (tag) => {
    const status = tag?.toLowerCase() || "active";

    switch (status) {
      case "active":
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg
              className="h-6 w-6 text-red-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Manage Companies
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          View and manage all registered insurance companies
        </p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <button
              onClick={toggleFilters}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {showFilters ? "Hide Filters" : "Show Filters"}
              {activeFilterCount > 0 && (
                <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by name, ID, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Companies</p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filtered Results</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCompanies.length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
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
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
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
              {paginatedCompanies.map((company, index) => (
                <tr
                  key={company.insCompanyId || index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/admin/users/companies/${company.insCompanyId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {company.insCompanyId || "N/A"}
                    </Link>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.companyName || "N/A"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {company.email || "N/A"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {company.mobilePhone || "N/A"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {company.contactPerson || "N/A"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(company.submitDate)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(
                        company.tag
                      )}`}
                    >
                      {company.tag || "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`/admin/users/companies/${company.insCompanyId}`}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden">
          {paginatedCompanies.map((company, index) => (
            <div
              key={company.insCompanyId || index}
              className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link
                    to={`/admin/users/companies/${company.insCompanyId}`}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-sm transition-colors"
                  >
                    {company.insCompanyId || "N/A"}
                  </Link>
                  <p className="text-gray-900 font-semibold mt-1">
                    {company.companyName || "N/A"}
                  </p>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(
                    company.tag
                  )}`}
                >
                  {company.tag || "Active"}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900">
                    {company.email || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="text-gray-900">
                    {company.mobilePhone || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact Person:</span>
                  <span className="text-gray-900">
                    {company.contactPerson || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Registered:</span>
                  <span className="text-gray-900">
                    {formatDate(company.submitDate)}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <Link
                  to={`/admin/users/companies/${company.insCompanyId}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {filteredCompanies.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Results info */}
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(endIndex, filteredCompanies.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium">{filteredCompanies.length}</span>{" "}
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
        {filteredCompanies.length === 0 && !loading && (
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No companies found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No companies are currently registered"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCompanies;
