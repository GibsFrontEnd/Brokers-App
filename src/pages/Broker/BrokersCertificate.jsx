import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";

const BrokerCertificates = () => {
  const [activeTab, setActiveTab] = useState("motor");
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminContext = location.pathname.startsWith("/admin-dashboard");

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { day: "2-digit", month: "short", year: "numeric" };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch (error) {
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
    } catch (error) {
      return "Invalid Amount";
    }
  };

  // Fetch certificates from API
  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const response = await axios.get(`https://gibsbrokersapi.newgibsonline.com/api/Certificates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
  };

  useEffect(() => {
    const needsRefresh = location.state?.refresh;
    if (needsRefresh) {
      fetchCertificates();
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      fetchCertificates();
    }
  }, [location, navigate]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedCerts([]);
    setSearchTerm("");
    setFilteredCertificates(certificates);
  };

  // Handle search functionality
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredCertificates(certificates);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = certificates.filter(
      (cert) =>
        cert.certNo?.toLowerCase().includes(searchLower) ||
        cert.policyNo?.toLowerCase().includes(searchLower) ||
        cert.insuredName?.toLowerCase().includes(searchLower) ||
        cert.name?.toLowerCase().includes(searchLower) ||
        cert.brokerId?.toLowerCase().includes(searchLower)
    );

    setFilteredCertificates(filtered);
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
    const basePrefix = location.pathname.startsWith("/admin")
      ? "/admin/brokers"
      : "/brokers";
    switch (activeTab) {
      case "motor policies":
        return `${basePrefix}/certificates/create/motor`;
      case "marine policies":
        return `${basePrefix}/certificates/create/marine`;
      case "compulsory insurance policies":
        return `${basePrefix}/certificates/create/marine`;
      default:
        return `${basePrefix}/certificates/create`;
    }
  };

  // Get certificate view link
  const getCertificateViewLink = (certificate) => {
    const basePath = isAdminContext 
      ? "/admin-dashboard/brokers" 
      : "/brokers-dashboard";
    return `${basePath}/certificates/view/${certificate.id}`;
  };

  // Get unique certificate identifier
  const getCertId = (certificate) => {
    return certificate.id || certificate.certNo || Math.random().toString();
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
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={fetchCertificates} className="mt-3 text-sm bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded">
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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Broker Portal</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage your certificates and client operations</p>
      </div>

      {/* Tabs Section - Mobile Responsive */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            {["motor policies", "marine policies", "compulsory insurance policies"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`py-2 sm:py-3 px-3 sm:px-4 border-b-2 text-sm sm:text-lg font-bold transition-colors capitalize whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab === "compulsory" ? "Compulsory" : `${tab.charAt(0).toUpperCase() + tab.slice(1)}`}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Search Filter Section - Mobile Responsive */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search certificates..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      {/* Action Buttons Section - Mobile Responsive */}
      <div className="mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <Link
            to={getCreateCertificateLink()}
            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium w-full sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create {activeTab} Policy
          </Link>
        </div>
      </div>

      {/* Certificates Section - Mobile Responsive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Your Certificates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredCertificates.length} certificate{filteredCertificates.length !== 1 ? 's' : ''}
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
                    checked={selectedCerts.length === filteredCertificates.length && filteredCertificates.length > 0}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cert No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Broker ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insured Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trans.Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insured Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCertificates.map((certificate) => (
                <tr key={getCertId(certificate)} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedCerts.includes(getCertId(certificate))}
                      onChange={() => toggleCertificateSelection(getCertId(certificate))}
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
                    {certificate.brokerId || "N/A"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {certificate.insuredName || certificate.name || "N/A"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {certificate.policyNo || "N/A"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(certificate.transDate || certificate.transactionDate)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(certificate.insuredValue || certificate.sumInsured)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(certificate.grossPremium || certificate.premium)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                      {certificate.status || "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                        Print
                      </button>
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
          {filteredCertificates.map((certificate) => (
            <div key={getCertId(certificate)} className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                    checked={selectedCerts.includes(getCertId(certificate))}
                    onChange={() => toggleCertificateSelection(getCertId(certificate))}
                  />
                  <div>
                    <Link
                      to={getCertificateViewLink(certificate)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline block"
                    >
                      {certificate.certNo}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">Broker: {certificate.brokerId || "N/A"}</p>
                  </div>
                </div>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                  {certificate.status || "Active"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <p className="text-gray-500 text-xs">Insured Name</p>
                  <p className="font-medium truncate">{certificate.insuredName || certificate.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Policy No</p>
                  <p className="font-medium">{certificate.policyNo || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Date</p>
                  <p className="text-gray-600">{formatDate(certificate.transDate || certificate.transactionDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Premium</p>
                  <p className="font-semibold text-green-600">{formatCurrency(certificate.grossPremium || certificate.premium)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-gray-500 text-xs">Insured Value</p>
                  <p className="font-semibold text-green-600 text-sm">{formatCurrency(certificate.insuredValue || certificate.sumInsured)}</p>
                </div>
                <div className="flex space-x-3">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Print
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCertificates.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? "Try a different search term" : "Get started by creating a new certificate"}
            </p>
            <div className="mt-6">
              <Link
                to={getCreateCertificateLink()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-800">
                  {selectedCerts.length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex-1 sm:flex-none">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>

                <button className="inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex-1 sm:flex-none">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>

                <button className="inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex-1 sm:flex-none">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerCertificates;