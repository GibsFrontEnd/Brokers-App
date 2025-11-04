import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import WelcomeMessage from "../../components/WelcomeMessage";

const CompanyDashboard = () => {
  const [certificates, setCertificates] = useState([]);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Check if we're at the root company dashboard path
  const isRootPath =
    location.pathname === "/company" ||
    location.pathname === "/company/" ||
    location.pathname === "/company/dashboard";

  const API_BASE_URL = "https://gibsbrokersapi.newgibsonline.com/api";

  // Add these missing API functions that are referenced in the Outlet context
  const handleApprove = async (certIds) => {
    setIsProcessing(true);
    try {
      // Add your approve logic here
      console.log("Approving certificates:", certIds);

      await fetchCertificates(); // Refresh data
    } catch (error) {
      console.error("Error approving certificates:", error);
      setError("Failed to approve certificates");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (certIds) => {
    setIsProcessing(true);
    try {
      // Add your reject logic here
      console.log("Rejecting certificates:", certIds);
      await fetchCertificates(); // Refresh data
    } catch (error) {
      console.error("Error rejecting certificates:", error);
      setError("Failed to reject certificates");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (certIds) => {
    setIsProcessing(true);
    try {
      // Add your delete logic here
      console.log("Deleting certificates:", certIds);
      await fetchCertificates(); // Refresh data
    } catch (error) {
      console.error("Error deleting certificates:", error);
      setError("Failed to delete certificates");
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch data from real API
  const fetchCertificates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/Certificates`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check if data is an array
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from API");
      }

      const transformedData = data.map((cert) => ({
        id: cert.certNo,
        certNo: cert.certNo,
        brokerId: cert.brokerId,
        clientId: cert.clientId,
        insCompanyId: cert.insCompanyId,
        insuredName: cert.insuredName || "N/A",
        policyNo: cert.policyNo || "N/A",
        transDate: cert.transDate
          ? new Date(cert.transDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        submitDate: cert.submitDate
          ? new Date(cert.submitDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : null,
        rate: cert.rate ? `${(cert.rate * 100).toFixed(2)}%` : "0%",
        insuredValue: cert.insuredValue
          ? `₦${cert.insuredValue.toLocaleString()}`
          : "₦0",
        grossPremium: cert.grossPrenium
          ? `₦${cert.grossPrenium.toLocaleString()}`
          : "₦0",
        status: cert.tag || "PENDING",
        perDesc: cert.perDesc || "",
        fromDesc: cert.fromDesc || "",
        toDesc: cert.toDesc || "",
        interestDesc: cert.interestDesc || "",
        formMno: cert.formMno || "",
        remarks: cert.remarks || "",
        ...cert,
      }));

      setCertificates(transformedData);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      setError(`Failed to load certificates: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch certificates if we're not on the root path
    if (!isRootPath) {
      fetchCertificates();
    } else {
      setIsLoading(false);
    }
  }, [isRootPath]);

  const toggleCertificateSelection = (certId) => {
    setSelectedCerts((prev) =>
      prev.includes(certId)
        ? prev.filter((id) => id !== certId)
        : [...prev, certId]
    );
  };

  const isActivePath = (path) => {
    return location.pathname.includes(path);
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Loading state for non-root paths
  if (isLoading && !isRootPath) {
    return (
      <div className="p-8 text-center text-gray-600">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading certificates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Alert */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <span className="font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className="text-white px-4 sm:px-6 py-4 shadow-sm sticky top-0 z-50 w-full"
        style={{ backgroundColor: "#3f33ef" }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-white hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            <div className="w-8 h-8 bg-white bg-opacity-15 rounded-lg flex items-center justify-center shadow-md backdrop-blur-sm border border-white border-opacity-20">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM11 19.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zM17.9 17.39c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight">
                Global Insurance
              </h1>
              <p className="text-white text-opacity-80 text-md font-normal">
                Business Solution
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:block relative">
              <input
                type="text"
                placeholder="Search..."
                className="bg-white text-gray-800 pl-4 pr-10 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-48 lg:w-64"
              />
              <svg
                className="absolute right-3 top-2.5 h-4 w-4 text-gray-400"
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
            <button className="md:hidden p-2 rounded-md text-white hover:bg-white hover:bg-opacity-10">
              <svg
                className="h-5 w-5"
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
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">A</span>
              </div>
              <span className="text-sm hidden sm:block">Admin</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside
          className={`w-64 bg-white shadow-lg border-r border-gray-200 fixed left-0 top-0 h-screen pt-20 z-40 transform transition-transform duration-300 ease-in-out lg:transform-none ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="p-4 pt-8 h-full overflow-y-auto">
            <nav className="space-y-1">
              <Link
                to="/company/certificates"
                className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePath("certificates")
                    ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:shadow-sm"
                }`}
              >
                <div
                  className={`p-1 rounded-md ${
                    isActivePath("certificates")
                      ? "bg-blue-100"
                      : "group-hover:bg-blue-50"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span>Policy</span>
              </Link>

              <Link
                to="/company/agents-brokers"
                className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePath("agents-brokers")
                    ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:shadow-sm"
                }`}
              >
                <div
                  className={`p-1 rounded-md ${
                    isActivePath("agents-brokers")
                      ? "bg-blue-100"
                      : "group-hover:bg-blue-50"
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <span>Agents/Brokers</span>
              </Link>

              <Link
                to="/company/download-certificates"
                className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePath("download-certificates")
                    ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:shadow-sm"
                }`}
              >
                <div
                  className={`p-1 rounded-md ${
                    isActivePath("download-certificates")
                      ? "bg-blue-100"
                      : "group-hover:bg-blue-50"
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span>Download Certificates</span>
              </Link>

              <Link
                to="/company/change-password"
                className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePath("change-password")
                    ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:shadow-sm"
                }`}
              >
                <div
                  className={`p-1 rounded-md ${
                    isActivePath("change-password")
                      ? "bg-blue-100"
                      : "group-hover:bg-blue-50"
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
                      d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 012 2M9 7a2 2 0 012 2v0a2 2 0 01-2 2m0 0a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2z"
                    />
                  </svg>
                </div>
                <span>Change Password</span>
              </Link>

              <div className="pt-6 mt-6 border-t border-gray-200">
                <Link
                  to="/home"
                  className="group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                >
                  <div className="p-1 rounded-md group-hover:bg-red-100">
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                  <span>Logout</span>
                </Link>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 overflow-x-auto lg:ml-64">
          <div className="p-4">
            <div className="max-w-7xl mx-auto">
              {isRootPath ? (
                <WelcomeMessage />
              ) : (
                <div style={{ minWidth: "max-content" }}>
                  <Outlet
                    context={{
                      certificates,
                      selectedCerts,
                      toggleCertificateSelection,
                      handleApprove,
                      handleReject,
                      handleDelete,
                      isProcessing,
                      error,
                      setError,
                      fetchCertificates,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyDashboard;
