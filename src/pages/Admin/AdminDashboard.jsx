import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState, useCallback } from "react";
import WelcomeMessage from "../../components/WelcomeMessage";
import PinAllocationSystem from "../../components/PinAllocation/PinAllocationSystem";

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Company certificates state for admin context
  const [certificates, setCertificates] = useState([]);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const API_BASE_URL = "https://gibsbrokersapi.newgibsonline.com/api";

  // Client proposals state for admin context
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return false;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    };

    checkAuth();
  }, [navigate]);

  const handleRowClick = (proposal) => {
    setSelectedProposal(proposal.id);
  };

  const handleAddProposal = () => {
    navigate("/admin/client/add-proposal");
  };

  // Auto-expand dropdowns based on current path
  useEffect(() => {
    if (location.pathname.includes("/admin/users")) {
      setActiveDropdown("users");
    } else if (location.pathname.includes("/admin/security")) {
      setActiveDropdown("security");
    } else if (location.pathname.includes("/admin/pin-allocation")) {
      setActiveDropdown("pin-allocation");
    } else {
      setActiveDropdown(null);
    }
  }, [location.pathname]);

  // Seed client proposals for admin context using the exact mock from client page
  useEffect(() => {
    if (location.pathname.startsWith("/admin/client")) {
      setProposals([
        {
          id: 1,
          entryDate: "22 Aug 15",
          lastName: "Other Names",
          firstName: "intteck",
          address: "233 ikorodu road",
          mobile: "08023140962",
          regNumber: "LAG 987 67",
          amount: "5000.0000",
        },
        {
          id: 2,
          entryDate: "22 Aug 15",
          lastName: "Other Names",
          firstName: "intteck",
          address: "233 ikorodu road",
          mobile: "08023140962",
          regNumber: "LAG 987 GH",
          amount: "5000.0000",
        },
      ]);
    }
  }, [location.pathname]);

  // Helper function to check if current path is active
  const isActivePath = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  // Toggle dropdown
  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  // Toggle selection (used by Company Certificates page)
  const toggleCertificateSelection = (certId) => {
    setSelectedCerts((prev) =>
      prev.includes(certId)
        ? prev.filter((id) => id !== certId)
        : [...prev, certId]
    );
  };

  // Fetch company certificates for admin context
  const fetchCompanyCertificates = useCallback(async () => {
    setError(null);
    setIsProcessing(true);

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_BASE_URL}/Certificates`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
          sessionStorage.removeItem("token");
          navigate("/login");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const transformedData = (Array.isArray(data) ? data : []).map((cert) => ({
        id: cert.certNo || cert.id || Math.random().toString(36).substr(2, 9),
        certNo: cert.certNo || "N/A",
        brokerId: cert.brokerId || "N/A",
        clientId: cert.clientId || "N/A",
        insCompanyId: cert.insCompanyId || "N/A",
        insuredName: cert.insuredName || "Unknown",
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
          : "N/A",
        rate:
          typeof cert.rate === "number"
            ? `${(cert.rate * 100).toFixed(2)}%`
            : cert.rate || "0%",
        insuredValue:
          typeof cert.insuredValue === "number"
            ? `₦${cert.insuredValue.toLocaleString()}`
            : cert.insuredValue || "₦0",
        grossPremium:
          typeof cert.grossPremium === "number"
            ? `₦${cert.grossPremium.toLocaleString()}`
            : cert.grossPremium || "₦0",
        status: cert.tag || cert.status || "PENDING",
        perDesc: cert.perDesc || "",
        fromDesc: cert.fromDesc || "",
        toDesc: cert.toDesc || "",
        interestDesc: cert.interestDesc || "",
        formMno: cert.formMno || "",
        remarks: cert.remarks || "",
        ...cert,
      }));

      setCertificates(transformedData);
    } catch (err) {
      setError(err.message || "Failed to fetch certificates");
      setCertificates([]);
    } finally {
      setIsProcessing(false);
    }
  }, [navigate]);

  // Auto-load certificates when navigating to company section under admin
  useEffect(() => {
    if (location.pathname.startsWith("/admin/company")) {
      fetchCompanyCertificates();
    }
  }, [location.pathname, fetchCompanyCertificates]);

  // Check if we're at the root admin dashboard path (removed unused variable)

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null; // Navigation will happen via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="text-white px-4 sm:px-6 py-4 shadow-sm sticky top-0 z-50 w-full"
        style={{ backgroundColor: "#3f33ef" }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Button */}
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

            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">A</span>
              </div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-700 bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">A</span>
              </div>
              <span className="text-sm font-medium">Admin</span>
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
          className={`w-64 bg-blue-900 text-white shadow-lg border-r border-blue-800 fixed left-0 top-0 h-screen pt-20 z-40 transform transition-transform duration-300 ease-in-out lg:transform-none ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="p-4 pt-8 h-full overflow-y-auto">
            <nav className="space-y-1">
              {/* Users Management Section */}
              <div className="mb-6">
                <button
                  onClick={() => toggleDropdown("users")}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-white/90 uppercase tracking-wider hover:text-white hover:bg-white/10 transition-colors duration-200 border-l-4 border-transparent"
                >
                  <span>Users Management</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeDropdown === "users" ? "rotate-180" : ""
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
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    activeDropdown === "users"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pl-4 space-y-1">
                    <Link
                      to="/admin/users/agents-brokers"
                      className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActivePath("/admin/users/agents-brokers")
                          ? "bg-white/15 text-white border-l-4 border-orange-500"
                          : "text-white hover:bg-white/10 border-l-4 border-transparent"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={`p-1 rounded-md ${
                          isActivePath("/admin/users/agents-brokers")
                            ? "bg-white/20"
                            : "group-hover:bg-white/10"
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
                      <span>Manage Agents/Brokers</span>
                    </Link>

                    <Link
                      to="/admin/users/clients"
                      className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActivePath("/admin/users/clients")
                          ? "bg-white/15 text-white border-l-4 border-orange-500"
                          : "text-white hover:bg-white/10 border-l-4 border-transparent"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={`p-1 rounded-md ${
                          isActivePath("/admin/users/clients")
                            ? "bg-white/20"
                            : "group-hover:bg-white/10"
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
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                          />
                        </svg>
                      </div>
                      <span>Manage Sub Agents</span>
                    </Link>

                    <Link
                      to="/admin/users/companies"
                      className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActivePath("/admin/users/companies")
                          ? "bg-white/15 text-white border-l-4 border-orange-500"
                          : "text-white hover:bg-white/10 border-l-4 border-transparent"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={`p-1 rounded-md ${
                          isActivePath("/admin/users/companies")
                            ? "bg-white/20"
                            : "group-hover:bg-white/10"
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
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <span>Manage Companies</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Pin Allocation Section */}
              <div className="mb-6">
                <button
                  onClick={() => toggleDropdown("pin-allocation")}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-white/90 uppercase tracking-wider hover:text-white hover:bg-white/10 transition-colors duration-200 border-l-4 border-transparent"
                >
                  <span>Pin Management</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeDropdown === "pin-allocation" ? "rotate-180" : ""
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
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    activeDropdown === "pin-allocation"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pl-4 space-y-1">
                    <Link
                      to="/admin/pin-allocation"
                      className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActivePath("/admin/pin-allocation")
                          ? "bg-white/15 text-white border-l-4 border-orange-500"
                          : "text-white hover:bg-white/10 border-l-4 border-transparent"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={`p-1 rounded-md ${
                          isActivePath("/admin/pin-allocation")
                            ? "bg-white/20"
                            : "group-hover:bg-white/10"
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
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                      </div>
                      <span>Pin Allocation System</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Security Management Section */}
              <div className="mb-6">
                <Link
                  to="/admin/security"
                  className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActivePath("/admin/security")
                      ? "bg-white/15 text-white border-l-4 border-orange-500"
                      : "text-white hover:bg-white/10 border-l-4 border-transparent"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div
                    className={`p-1 rounded-md ${
                      isActivePath("/admin/security")
                        ? "bg-white/20"
                        : "group-hover:bg-white/10"
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <span>Security Management</span>
                </Link>
              </div>

              {/* Change Password Section */}
              <div className="mb-6">
                <Link
                  to="/admin/change-password"
                  className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActivePath("/admin/change-password")
                      ? "bg-white/15 text-white border-l-4 border-orange-500"
                      : "text-white hover:bg-white/10 border-l-4 border-transparent"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div
                    className={`p-1 rounded-md ${
                      isActivePath("/admin/change-password")
                        ? "bg-white/20"
                        : "group-hover:bg-white/10"
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
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </div>
                  <span>Change Password</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("authToken");
                    sessionStorage.removeItem("token");
                    navigate("/");
                  }}
                  className="group w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
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
                </button>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 overflow-x-auto lg:ml-64">
          <div className="p-4">
            <div className="max-w-7xl mx-auto">
              <Outlet
                context={{
                  certificates,
                  selectedCerts,
                  toggleCertificateSelection,
                  // Wire company actions to no-ops for now (admin view-only). If needed, we can call company endpoints.
                  handleApprove: () => {},
                  handleReject: () => {},
                  handleDelete: () => {},
                  isProcessing,
                  error,
                  setError,
                  fetchCertificates: fetchCompanyCertificates,
                  // Client context for admin client routes
                  proposals,
                  selectedProposal,
                  showDelete,
                  handleRowClick,
                  handleAddProposal,
                  setProposals,
                  setSelectedProposal,
                  setShowDelete,
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
