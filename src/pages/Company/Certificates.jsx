// src/pages/Certificates.jsx
import { useOutletContext, Link, useLocation } from "react-router-dom";
import { useState } from "react";

const Certificates = () => {
  const location = useLocation();
  const basePrefix = location.pathname.startsWith("/admin")
    ? "/admin/company"
    : "/company";

  // Read context from parent dashboard (Company or Admin)
  const outletContext = useOutletContext();
  const {
    certificates = [],
    selectedCerts = [],
    toggleCertificateSelection = () => {},
    handleApprove = () => {},
    handleReject = () => {},
    handleDelete = () => {},
  } = outletContext;

  // Add state for activeTab
  const [activeTab, setActiveTab] = useState("motor");
  const [searchTerm, setSearchTerm] = useState("");

  // Define handleTabChange
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      cert.certNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const renderContent = () => {
    if (activeTab !== "motor") {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Not Activated
          </h3>
          <p className="text-gray-500">
            Coming soon. This feature is currently under development.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Your Certificates
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Manage and track all insurance certificates
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={
                      selectedCerts.length === filteredCertificates.length &&
                      filteredCertificates.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        filteredCertificates.forEach((cert) => {
                          if (!selectedCerts.includes(cert.id))
                            toggleCertificateSelection(cert.id);
                        });
                      } else {
                        selectedCerts.forEach((id) =>
                          toggleCertificateSelection(id)
                        );
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cert No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policy Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCertificates.map((cert) => (
                <tr
                  key={cert.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={selectedCerts.includes(cert.id)}
                      onChange={() => toggleCertificateSelection(cert.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`${basePrefix}/certificates/${cert.certNo}`}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-sm hover:underline"
                    >
                      {cert.certNo}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cert.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cert.policyType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cert.issueDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        cert.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`${basePrefix}/certificates/${cert.certNo}`}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-full transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-200">
          {filteredCertificates.map((cert) => (
            <div key={cert.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={selectedCerts.includes(cert.id)}
                    onChange={() => toggleCertificateSelection(cert.id)}
                  />
                  <Link
                    to={`${basePrefix}/certificates/${cert.certNo}`}
                    className="text-blue-600 font-semibold text-sm"
                  >
                    {cert.certNo}
                  </Link>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    cert.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {cert.status}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                <p>
                  <span className="font-medium">Client:</span> {cert.clientName}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {cert.issueDate}
                </p>
              </div>
              <div className="flex justify-end">
                <Link
                  to={`${basePrefix}/certificates/${cert.certNo}`}
                  className="text-blue-600 text-sm font-medium"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Portal</h1>
            <p className="text-gray-600">
              Manage your certificates and operations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search certificates..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
          {["motor"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Policies
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Selection Actions Bar */}
      {selectedCerts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-blue-100 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {selectedCerts.length} selected
            </span>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
            >
              APPROVE
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              REJECT
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-bold rounded-lg hover:bg-gray-700 transition-colors"
            >
              DELETE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
