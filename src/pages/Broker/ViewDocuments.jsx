// src/pages/ViewDocuments.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const ViewDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Get token from localStorage or redirect to login
  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in.");
      return null;
    }
    return token;
  };

  // Redirect to login page
  const redirectToLogin = () => {
    localStorage.removeItem("token");
    window.location.href = "/login"; // Adjust based on your routing
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await axios.post(
        "https://gibsbrokersapi.newgibsonline.com/api/auth/refresh",
        {},
        {
          withCredentials: true,
          headers: {
            accept: "application/json",
          },
        }
      );

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        return response.data.token;
      }
      throw new Error("No token received");
    } catch (err) {
      redirectToLogin();
      throw new Error("Failed to refresh token");
    }
  };

  // Fetch documents from API with proper error handling
  const fetchDocuments = async (isRetry = false) => {
    try {
      setLoading(true);
      setError(null);

      let token = getToken();
      if (!token) return;

      const response = await axios.get(
        "https://gibsbrokersapi.newgibsonline.com/api/AttachDocs",
        {
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000, // 10 second timeout
        }
      );

      // Validate response structure
      if (Array.isArray(response.data)) {
        setDocuments(response.data);
        setFilteredDocuments(response.data);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("API Error:", err);

      if (err.response?.status === 401) {
        if (!isRetry && retryCount < 2) {
          try {
            const newToken = await refreshToken();
            setRetryCount((prev) => prev + 1);
            await fetchDocuments(true);
            return;
          } catch (refreshError) {
            setError("Session expired. Please log in again.");
            setTimeout(redirectToLogin, 2000);
          }
        } else {
          setError("Authentication failed. Redirecting to login...");
          setTimeout(redirectToLogin, 2000);
        }
      } else if (err.response?.status === 403) {
        setError(
          "Access forbidden. You don't have permission to view documents."
        );
      } else if (err.code === "ECONNABORTED") {
        setError(
          "Request timeout. Please check your connection and try again."
        );
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load documents. Please try again."
        );
      }

      // Fallback to mock data for demonstration
      if (process.env.NODE_ENV === "development") {
        const mockDocuments = getMockDocuments();
        setDocuments(mockDocuments);
        setFilteredDocuments(mockDocuments);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock data function
  const getMockDocuments = () => [
    {
      attachId: 1,
      docNo: "DOC-001",
      docDetails: "Marine Insurance Policy",
      docTypes: "PDF",
      docFrom: "Insurance Department",
      entryDate: "2025-09-19T12:22:55.869Z",
      zDocuments: "2.4 MB",
      mailStatus: "Active",
      active: 1,
      deleted: 0,
    },
    {
      attachId: 2,
      docNo: "DOC-002",
      docDetails: "Certificate of Coverage",
      docTypes: "PDF",
      docFrom: "Underwriting",
      entryDate: "2025-09-18T10:15:30.123Z",
      zDocuments: "1.8 MB",
      mailStatus: "Processed",
      active: 1,
      deleted: 0,
    },
  ];

  // Search functionality that filters actual data
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredDocuments(documents);
      return;
    }

    const filtered = documents.filter(
      (doc) =>
        doc.docDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.docTypes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.docFrom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.docNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocuments(filtered);
  };

  // Handle Enter key press for search
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Format date consistently
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown Date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Status badge styling
  const getStatusBadge = (status) => {
    if (!status) return "bg-gray-100 text-gray-800 border border-gray-200";

    const statusLower = status.toLowerCase();
    if (statusLower.includes("active") || statusLower.includes("processed")) {
      return "bg-green-100 text-green-800 border border-green-200";
    } else if (
      statusLower.includes("pending") ||
      statusLower.includes("processing")
    ) {
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    } else if (
      statusLower.includes("inactive") ||
      statusLower.includes("rejected")
    ) {
      return "bg-red-100 text-red-800 border border-red-200";
    }
    return "bg-gray-100 text-gray-800 border border-gray-200";
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchDocuments();
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 text-center text-gray-600">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-auto">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Marine Documents
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage your marine insurance documents
            </p>
          </div>

          {/* Search Section */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by document name, type, or number..."
                className="w-full sm:w-64 px-3 sm:px-4 py-2 pl-9 sm:pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <svg
                className="absolute left-2.5 sm:left-3 top-2.5 h-4 w-4 text-gray-400"
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
            <button
              onClick={handleSearch}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-600 mr-2 flex-shrink-0"
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
              {!error.includes("Redirecting") && !error.includes("log in") && (
                <button
                  onClick={handleRetry}
                  className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rest of your component remains similar but use filteredDocuments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Document Library
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {error && error.includes("mock")
              ? "Showing sample data for demonstration"
              : "Access and download your marine insurance documents"}
          </p>
        </div>

        {/* Document Grid - Use filteredDocuments instead of documents */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((document) => (
                <DocumentCard key={document.attachId} document={document} />
              ))
            ) : (
              <div className="col-span-full">
                <div className="text-center py-8 sm:py-12">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-10 sm:w-12 h-10 sm:h-12 text-gray-300 mb-4"
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
                    <p className="text-sm text-gray-500">
                      {searchTerm
                        ? "No documents match your search"
                        : "No documents found"}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilteredDocuments(documents);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-sm text-gray-600">
              {filteredDocuments.length} of {documents.length} document
              {documents.length !== 1 ? "s" : ""} displayed
            </p>
            {searchTerm && filteredDocuments.length < documents.length && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilteredDocuments(documents);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Separate component for document card for better organization
const DocumentCard = ({ document }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown Date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return "bg-gray-100 text-gray-800 border border-gray-200";

    const statusLower = status.toLowerCase();
    if (statusLower.includes("active") || statusLower.includes("processed")) {
      return "bg-green-100 text-green-800 border border-green-200";
    } else if (
      statusLower.includes("pending") ||
      statusLower.includes("processing")
    ) {
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    } else if (
      statusLower.includes("inactive") ||
      statusLower.includes("rejected")
    ) {
      return "bg-red-100 text-red-800 border border-red-200";
    }
    return "bg-gray-100 text-gray-800 border border-gray-200";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
      {/* Card content remains the same as your original */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 sm:w-10 h-8 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 sm:w-5 h-4 sm:h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 00-.293-.707l-5.414-5.414A1 1 0012.586 3H7a2 2 00-2 2v14a2 2 002 2z"
              />
            </svg>
          </div>
          <div className="ml-2 sm:ml-3">
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">
              {document.docTypes || "Document"}
            </span>
          </div>
        </div>
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${getStatusBadge(
            document.mailStatus
          )}`}
        >
          {document.mailStatus || "Unknown"}
        </span>
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">
        {document.docDetails || "Untitled Document"}
      </h3>

      {document.docNo && (
        <p className="text-xs text-gray-500 mb-2">
          Document #: {document.docNo}
        </p>
      )}

      <div className="space-y-2 text-xs sm:text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <svg
            className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400 mr-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 7a2 2 0 012-2h10a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span className="truncate">
            {document.docFrom || "Unknown Source"}
          </span>
        </div>
        <div className="flex items-center">
          <svg
            className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400 mr-2 flex-shrink-0"
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
          <span>{formatDate(document.entryDate)}</span>
        </div>
        <div className="flex items-center">
          <svg
            className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400 mr-2 flex-shrink-0"
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
          <span>{document.zDocuments || "Unknown Size"}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <div className="flex items-center justify-center">
            <svg
              className="w-3 sm:w-4 h-3 sm:h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View
          </div>
        </button>
        <button className="flex-1 px-3 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
          <div className="flex items-center justify-center">
            <svg
              className="w-3 sm:w-4 h-3 sm:h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download
          </div>
        </button>
      </div>
    </div>
  );
};

export default ViewDocuments;
