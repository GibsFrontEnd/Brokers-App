import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const ClientCertificate = () => {
  const location = useLocation();
  const basePrefix = location.pathname.startsWith("/admin") ? "/admin/customer" : "/customer";
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [activeTab, setActiveTab] = useState("marine");
  const [hasSearched, setHasSearched] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Handle certificate search
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Please enter a certificate number");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;

      if (!user?.token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(
        `https://gibsbrokersapi.newgibsonline.com/api/Certificates/${searchTerm.trim()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setCertificates([]);
          throw new Error(`Certificate "${searchTerm}" not found`);
        }
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        }
        throw new Error(`Failed to fetch certificate: ${response.status}`);
      }

      const data = await response.json();

      // Process API response
      let certificatesData = [];
      if (Array.isArray(data)) {
        certificatesData = data;
      } else if (data.certificates && Array.isArray(data.certificates)) {
        certificatesData = data.certificates;
      } else if (data.data && Array.isArray(data.data)) {
        certificatesData = data.data;
      } else if (typeof data === "object" && data !== null) {
        certificatesData = [data];
      } else {
        throw new Error("Unexpected response format from API");
      }

      // Map certificates to consistent format
      const processedCertificates = certificatesData.map((cert, index) => ({
        id: cert.id || cert.certificateId || cert.certNo || `cert-${index}`,
        certNo: cert.certNo || cert.certificateNumber || cert.certificateNo || searchTerm,
        brokerId: cert.brokerId || cert.brokerCode || "N/A",
        insuredName: cert.insuredName || cert.insured || cert.clientName || "N/A",
        policyNo: cert.policyNo || cert.policyNumber || "N/A",
        transDate: cert.transDate || cert.transactionDate || cert.date || "N/A",
        insuredValue: cert.insuredValue || cert.sumInsured || cert.amount || 0,
        premium: cert.premium || cert.grossPremium || cert.premiumAmount || 0,
        status: cert.status || "Active",
        viewUrl: `/customer/certificates/view/${cert.id || cert.certificateId || searchTerm}`,
      }));

      setCertificates(processedCertificates);
      
    } catch (err) {
      setError(err.message || "Failed to search certificate");
      setCertificates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle NID upload
  const handleUploadNID = async (file) => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    try {
      setIsLoading(true);
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;

      if (!user?.token) {
        throw new Error("User not authenticated");
      }

      const formData = new FormData();
      formData.append("nidFile", file);

      const response = await fetch(
        `https://gibsbrokersapi.newgibsonline.com/api/clients/upload-nid`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${user.token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      alert("NID uploaded successfully!");
    } catch (err) {
      setError("Failed to upload NID: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle certificate selection
  const toggleCertificateSelection = (certId) => {
    setSelectedCerts(prev =>
      prev.includes(certId) ? prev.filter(id => id !== certId) : [...prev, certId]
    );
  };

  // Handle select all certificates
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCerts(certificates.map(cert => cert.id));
    } else {
      setSelectedCerts([]);
    }
  };

  // Get create certificate link based on active tab
  const getCreateCertificateLink = () => {
    switch (activeTab) {
      case "motor":
        return `${basePrefix}/certificates/create/motor`;
      case "marine":
        return `${basePrefix}/certificates/create/marine`;
      case "compulsory":
        return `${basePrefix}/certificates/create/compulsory`;
      default:
        return `${basePrefix}/certificates/create`;
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedCerts([]);
    setSearchTerm("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">Searching...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Client Policy</h1>
            <p className="text-gray-600 text-sm sm:text-base">View and manage your certificates</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:inline">Welcome back, Client</span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              CN
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {["motor", "marine", "compulsory"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`py-3 px-4 border-b-2 text-sm sm:text-lg font-bold transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab === "compulsory" ? "Compulsory Insurance" : `${tab.charAt(0).toUpperCase() + tab.slice(1)} Policies`}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-800 hover:text-red-900">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter certificate number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? "Searching..." : "Search Certificate"}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Enter your certificate number to search for existing policies
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Link
          to={getCreateCertificateLink()}
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create new Certificate
        </Link>
        <label className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          UPLOAD NID
          <input
            type="file"
            className="hidden"
            onChange={(e) => handleUploadNID(e.target.files[0])}
            accept=".jpg,.jpeg,.png,.pdf"
          />
        </label>
      </div>

      {/* Certificates Section */}
      {hasSearched && (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Search Results</h2>
            <p className="text-sm text-gray-600 mt-1">
              Found {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}
            </p>
          </div>

          {certificates.length > 0 ? (
            <>
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
                          checked={selectedCerts.length === certificates.length && certificates.length > 0}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cert No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insured Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insured Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {certificates.map((certificate) => (
                      <tr key={certificate.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedCerts.includes(certificate.id)}
                            onChange={() => toggleCertificateSelection(certificate.id)}
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Link to={certificate.viewUrl} className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                            {certificate.certNo}
                          </Link>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{certificate.insuredName}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{certificate.policyNo}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(certificate.transDate)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(certificate.insuredValue)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(certificate.premium)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            certificate.status === "Active" ? "bg-green-100 text-green-800" :
                            certificate.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                            certificate.status === "Expired" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {certificate.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Link to={certificate.viewUrl} className="text-blue-600 hover:text-blue-800">
                              View
                            </Link>
                            <button className="text-red-600 hover:text-red-800">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden">
                {certificates.map((certificate) => (
                  <div key={certificate.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedCerts.includes(certificate.id)}
                          onChange={() => toggleCertificateSelection(certificate.id)}
                        />
                        <div>
                          <Link to={certificate.viewUrl} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                            {certificate.certNo}
                          </Link>
                          <p className="text-sm text-gray-900 font-medium">{certificate.insuredName}</p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        certificate.status === "Active" ? "bg-green-100 text-green-800" :
                        certificate.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                        certificate.status === "Expired" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {certificate.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Policy No:</span>
                        <p className="font-medium">{certificate.policyNo}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <p>{formatDate(certificate.transDate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Insured Value:</span>
                        <p className="font-semibold text-green-600">{formatCurrency(certificate.insuredValue)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Premium:</span>
                        <p className="font-semibold text-green-600">{formatCurrency(certificate.premium)}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-100">
                      <Link to={certificate.viewUrl} className="text-blue-600 hover:text-blue-800 text-sm">
                        View Details
                      </Link>
                      <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates found</h3>
              <p className="mt-1 text-sm text-gray-500">Try searching with a different certificate number.</p>
            </div>
          )}

          {/* Selection Actions */}
          {selectedCerts.length > 0 && (
            <div className="px-4 sm:px-6 py-4 bg-blue-50 border-t border-blue-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">
                    {selectedCerts.length} certificate{selectedCerts.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                    Download Selected
                  </button>
                  <button className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                    Print Selected
                  </button>
                  <button className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors">
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientCertificate;