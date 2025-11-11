import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const ViewCertificate = () => {
  const { certNo } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
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

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const response = await axios.get(
          `https://gibsbrokersapi.newgibsonline.com/api/Certificate/motor/${certNo}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setCertificate(response.data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err.response?.data?.message || "Failed to fetch certificate details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (certNo) {
      fetchCertificate();
    }
  }, [certNo]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading certificate details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
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
            <button
              onClick={handleGoBack}
              className="mt-4 inline-flex items-center px-4 py-2 bg-white border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Go Back
          </button>

          <div className="flex gap-3">
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
              Print Certificate
            </button>
          </div>
        </div>

        {/* Certificate Details Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">
              Motor Insurance Certificate
            </h1>
            <p className="text-blue-100">
              Certificate Number: {certificate.certNo}
            </p>
          </div>

          {/* Status Badge */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Status:</span>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    certificate.status === "ACTIVE" ||
                    certificate.status === "APPROVED"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : certificate.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                      : "bg-gray-100 text-gray-800 border border-gray-200"
                  }`}
                >
                  {certificate.status || "N/A"}
                </span>
              </div>
              {certificate.niidStatus && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">NIID Status:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {certificate.niidStatus}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Certificate Details */}
          <div className="p-6 sm:p-8">
            {/* Policy Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Policy Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailItem
                  label="Certificate Number"
                  value={certificate.certNo}
                />
                <DetailItem
                  label="Policy Number"
                  value={certificate.policyNo}
                />
                <DetailItem label="Broker ID" value={certificate.brokerID} />
                <DetailItem
                  label="Insurance Company ID"
                  value={certificate.insCompanyID}
                />
                <DetailItem
                  label="Reference DN/CN Number"
                  value={certificate.refDNCNNo}
                />
                <DetailItem
                  label="Transaction Date"
                  value={formatDate(certificate.transDate)}
                />
                <DetailItem
                  label="Start Date"
                  value={formatDate(certificate.startDate)}
                />
                <DetailItem
                  label="Expiry Date"
                  value={formatDate(certificate.expiryDate)}
                />
                <DetailItem
                  label="Submit Date"
                  value={formatDate(certificate.submitDate)}
                />
              </div>
            </div>

            {/* Insured Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Insured Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem
                  label="Insured Name"
                  value={certificate.insuredName}
                />
                <DetailItem label="Email Address" value={certificate.email} />
                <DetailItem
                  label="Mobile Number"
                  value={certificate.mobileNo}
                />
                <DetailItem
                  label="Address"
                  value={certificate.address}
                  className="md:col-span-2"
                />
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Vehicle Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailItem
                  label="Registration Number"
                  value={certificate.vehicleRegNum}
                />
                <DetailItem
                  label="Vehicle Type"
                  value={certificate.vehicleType}
                />
                <DetailItem
                  label="Vehicle Make"
                  value={certificate.vehicleMake}
                />
                <DetailItem
                  label="Vehicle Brand"
                  value={certificate.vehicleBrand}
                />
                <DetailItem
                  label="Vehicle Color"
                  value={certificate.vehicleColor}
                />
                <DetailItem
                  label="Vehicle Year"
                  value={certificate.vehicleYear}
                />
                <DetailItem
                  label="Chassis Number"
                  value={certificate.chassisNum}
                />
                <DetailItem
                  label="Engine Number"
                  value={certificate.engineNum}
                />
                <DetailItem
                  label="Engine Capacity"
                  value={certificate.engineCapacity}
                />
              </div>
            </div>

            {/* Financial Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Financial Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailItem
                  label="Insured Value"
                  value={formatCurrency(certificate.insuredValue)}
                  highlight
                />
                <DetailItem
                  label="Gross Premium"
                  value={formatCurrency(certificate.grossPremium)}
                  highlight
                />
                <DetailItem
                  label="Rate (%)"
                  value={certificate.rate || "N/A"}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 print:hidden">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
              <p>
                Certificate generated on{" "}
                {formatDate(certificate.submitDate || certificate.transDate)}
              </p>
              <button
                onClick={handlePrint}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Print this certificate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Detail Item Component
const DetailItem = ({ label, value, highlight, className = "" }) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-sm font-semibold ${
          highlight ? "text-green-600 text-lg" : "text-gray-900"
        }`}
      >
        {value || "N/A"}
      </p>
    </div>
  );
};

export default ViewCertificate;
