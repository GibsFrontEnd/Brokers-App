import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ViewBrokerDetails = () => {
  const { brokerId } = useParams();
  const navigate = useNavigate();
  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch {
      return "Invalid Date";
    }
  };

  // Fetch broker details
  useEffect(() => {
    const fetchBrokerDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const response = await axios.get(
          `https://gibsbrokersapi.newgibsonline.com/api/Auth/brokers/${brokerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Extract broker data from response
        const brokerData = response.data.data;
        setBroker(brokerData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err.response?.data?.message || "Failed to fetch broker details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (brokerId) {
      fetchBrokerDetails();
    }
  }, [brokerId]);

  const handleGoBack = () => {
    navigate("/company/agents-brokers");
  };

  const handlePrint = () => {
    window.print();
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading broker details...</p>
        </div>
      </div>
    );
  }

  // Error state
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
            <div className="flex-1">
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No broker found
  if (!broker) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Broker not found</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Detail item component for consistent display
  const DetailItem = ({ label, value, highlight = false }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-600 sm:w-1/3 mb-1 sm:mb-0">
        {label}
      </dt>
      <dd
        className={`text-sm sm:w-2/3 ${
          highlight
            ? "font-semibold text-blue-600"
            : "text-gray-900 font-medium"
        }`}
      >
        {value || "N/A"}
      </dd>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 print:mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Broker Details
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Viewing details for broker:{" "}
              <span className="font-semibold text-blue-600">
                {broker.brokerId}
              </span>
            </p>
          </div>

          <div className="flex gap-2 print:hidden">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go Back
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Broker Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 print:bg-blue-600">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Broker Information
            </h2>
            {broker.tag && (
              <span
                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(
                  broker.tag
                )}`}
              >
                {broker.tag || "Active"}
              </span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-600">
                Basic Information
              </h3>
              <dl className="space-y-1">
                <DetailItem
                  label="Broker ID"
                  value={broker.brokerId}
                  highlight
                />
                <DetailItem label="Broker Name" value={broker.brokerName} />
                <DetailItem label="User Type" value={broker.userType} />
                <DetailItem label="Company ID" value={broker.insCompanyId} />
                <DetailItem
                  label="Contact Person"
                  value={broker.contactPerson}
                />
              </dl>
            </div>

            {/* Contact Information */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-600">
                Contact Information
              </h3>
              <dl className="space-y-1">
                <DetailItem label="Email" value={broker.email} />
                <DetailItem label="Mobile Phone" value={broker.mobilePhone} />
                <DetailItem label="Address" value={broker.address} />
              </dl>
            </div>

            {/* Registration & Status */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-600">
                Registration & Status
              </h3>
              <dl className="space-y-1">
                <DetailItem
                  label="Submit Date"
                  value={formatDate(broker.submitDate)}
                />
                <DetailItem
                  label="Rate"
                  value={
                    broker.rate
                      ? `${(parseFloat(broker.rate) * 100).toFixed(2)}%`
                      : "0%"
                  }
                />
                <DetailItem label="Value" value={broker.value} />
                <DetailItem label="Status" value={broker.tag || "Active"} />
              </dl>
            </div>

            {/* Additional Information */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-600">
                Additional Information
              </h3>
              <dl className="space-y-1">
                <DetailItem label="A1" value={broker.a1} />
                <DetailItem label="A2" value={broker.a2} />
                <DetailItem label="A3" value={broker.a3} />
                <DetailItem label="A4" value={broker.a4} />
                <DetailItem label="A5" value={broker.a5} />
              </dl>
            </div>
          </div>

          {/* Date Range (if available) */}
          {(broker.lStartDate || broker.lEndDate) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-600">
                License Period
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem
                  label="Start Date"
                  value={formatDate(broker.lStartDate)}
                />
                <DetailItem
                  label="End Date"
                  value={formatDate(broker.lEndDate)}
                />
              </dl>
            </div>
          )}

          {/* Custom Fields */}
          {(broker.field1 || broker.field2) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-600">
                Custom Fields
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {broker.field1 && (
                  <DetailItem label="Field 1" value={broker.field1} />
                )}
                {broker.field2 && (
                  <DetailItem label="Field 2" value={broker.field2} />
                )}
              </dl>
            </div>
          )}

          {/* Remarks */}
          {broker.remarks && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-600">
                Remarks
              </h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                {broker.remarks}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:block, .print\\:block * {
              visibility: visible;
            }
            .print\\:hidden {
              display: none !important;
            }
            @page {
              margin: 1cm;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ViewBrokerDetails;
