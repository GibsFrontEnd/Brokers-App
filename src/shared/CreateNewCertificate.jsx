import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Adjust path as needed
import PaymentModal from "../components/Payment/PaymentModal";
import { getApiBaseUrl } from "../utils/config";

const API_BASE_URL = getApiBaseUrl();

const CreateNewCertificate = ({ viewMode = false, userRole = "broker" }) => {
  const { user, token } = useAuth();
  const {  certId } = useParams();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0]; // "2024-01-15"
  const insCompanyId = "00000000-0000-0000-0000-000000000001";
  // // Add the isValidGuid function definition FIRST
  const isValidGuid = (guid) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      guid
    );
  };
  const [formData, setFormData] = useState({
    certificateNo: viewMode ? "" : "AUTO",
    insuredName: "",
    address: "",
    transactionDate: today,
    vesselName: "AMY APPROVED STEAMER(S) AS PER",
    subject: "",
    typeOfCover: "ICC 'A'",
    voyageFrom: "",
    origin: "",
    email: "",
    mobilePhone: "",
    policyNo: "",
    conveyance: "",
    tinNo: "",
    destination: "",
    packagingType: "",
    proformaInvNo: "",
    containerized: false,
    interestInsured: "",
    natureOfGoods: "",
    paymentType: "Credit Note",
    terms: "",
    loading: "100%",
    currencyType: "",
    sumInsured: "0.0",
    clausesType: "",
    rate: "0.0",
    conditionsClauses: "",
    lendingTitle: "",
    legendTitle: "",
    date: "",
    lendingAddress: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payCertNo, setPayCertNo] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const fetchCertificateData = async (id) => {
  setLoading(true);
  try {
    const token = getToken();
    if (!token) {
      setError("Authentication required. Please login again.");
      return;
    }
    
    // First, let's log the API response to see what we're getting
    console.log("Fetching certificate data for ID:", id);
    
    const response = await axios.get(
      `${API_BASE_URL}/Certificates/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("API Response:", response.data);
    
    // Map API response to form fields based on actual API structure
    const apiData = response.data;
    
    // Update the form data mapping based on actual API response
    setFormData({
      certificateNo: apiData.certNo || apiData.certificateNo || "",
      insuredName: apiData.insuredName || apiData.insured || "",
      address: apiData.address || apiData.field6 || "",
      transactionDate: apiData.transDate || apiData.transactionDate || today,
      vesselName: apiData.vesselName || apiData.field1 || "AMY APPROVED STEAMER(S) AS PER",
      subject: apiData.subject || apiData.field9 || "",
      typeOfCover: apiData.typeOfCover || apiData.perDesc || "ICC 'A'",
      voyageFrom: apiData.voyageFrom || "",
      origin: apiData.origin || apiData.fromDesc || "",
      email: apiData.email || apiData.field4 || "",
      mobilePhone: apiData.mobilePhone || apiData.field5 || "",
      policyNo: apiData.policyNo || "",
      conveyance: apiData.conveyance || apiData.field2 || "",
      tinNo: apiData.tinNo || apiData.field7 || "",
      destination: apiData.destination || apiData.toDesc || "",
      packagingType: apiData.packagingType || "",
      proformaInvNo: apiData.proformaInvNo || apiData.formMno || "",
      containerized: apiData.containerized || apiData.field8 === "Yes",
      interestInsured: apiData.interestInsured || apiData.interestDesc || "",
      natureOfGoods: apiData.natureOfGoods || apiData.field3 || "",
      paymentType: apiData.paymentType || apiData.field10 || "Credit Note",
      terms: apiData.terms || apiData.field9 || "",
      loading: apiData.loading || "100%",
      currencyType: apiData.currencyType || apiData.field10 || "",
      sumInsured: apiData.sumInsured || apiData.insuredValue?.toString() || "0.0",
      clausesType: apiData.clausesType || apiData.field9 || "",
      rate: apiData.rate?.toString() || "0.0",
      conditionsClauses: apiData.conditionsClauses || apiData.remarks || "",
      lendingTitle: apiData.lendingTitle || apiData.field101 || "",
      legendTitle: apiData.legendTitle || apiData.field102 || "",
      date: apiData.date || apiData.transDate || "",
      lendingAddress: apiData.lendingAddress || apiData.field103 || "",
    });
    
    setIsEditMode(true);
  } catch (err) {
    if (err.response?.status === 401) {
      setError("Session expired. Please login again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    } else if (err.response?.status === 404) {
      setError("Certificate not found.");
    } else {
      setError(err.response?.data?.message || "Failed to fetch certificate data");
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  console.log("certId from useParams:", certId);
  console.log("certId type:", typeof certId);
  
  // If certId exists in URL params and is valid, fetch certificate data
  if (certId && certId !== "undefined" && isValidGuid(certId)) {
    console.log("Fetching certificate data for ID:", certId);
    fetchCertificateData(certId); // Pass certId as parameter
  } else if (certId && certId !== "undefined") {
    console.log("Invalid certificate ID format:", certId);
    setError("Invalid certificate ID format");
  } else {
    console.log("No certificate ID provided, creating new certificate");
  }
}, [certId]);

  const handleChange = (e) => {
    if (viewMode) return;
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewMode) return;

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        setError("Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      // Check if user object exists and has the required properties
      if (!user) {
        setError("User not authenticated. Please login again.");
        setLoading(false);
        return;
      }

      // Use actual user IDs instead of test IDs
      const brokerId = user.brokerId;
      const clientId = user.clientId;

      // Check if IDs exist and are valid GUIDs
      if (!brokerId || !clientId) {
        setError(
          "User account missing required information. Please contact administrator."
        );
        setLoading(false);
        return;
      }

      if (!isValidGuid(brokerId) || !isValidGuid(clientId)) {
        setError("Invalid user IDs. Please contact administrator.");
        setLoading(false);
        return;
      }

      const apiPayload = {
        certNo: formData.certificateNo === "AUTO" ? "" : formData.certificateNo,
        brokerId: brokerId,
        clientId: clientId,
        insCompanyId: user.insCompanyId || insCompanyId, // Valid GUID
        insuredName: formData.insuredName,
        transDate: today,
        policyNo: formData.policyNo,
        perDesc: formData.typeOfCover,
        fromDesc: formData.origin,
        toDesc: formData.destination,
        interestDesc: formData.interestInsured,
        rate: parseFloat(formData.rate) || 0,
        insuredValue: parseFloat(formData.sumInsured) || 0,
        grossPrenium:
          parseFloat(formData.sumInsured) * (parseFloat(formData.rate) / 100) ||
          0,
        formMno: formData.proformaInvNo,
        submitDate: today,
        remarks: formData.conditionsClauses,
        field1: formData.vesselName,
        field2: formData.conveyance,
        field3: formData.natureOfGoods,
        field4: formData.email,
        field5: formData.mobilePhone,
        field6: formData.address,
        field7: formData.tinNo,
        field8: formData.containerized ? "Yes" : "No",
        field9: formData.terms,
        field10: formData.currencyType,
        field101: formData.lendingTitle,
        field102: formData.legendTitle,
        field103: formData.lendingAddress,
        a1: 0,
        a2: 0,
        a3: 0,
        a4: 0,
        a5: 0,
        tag: "certificate",
        field104: "",
        field105: "",
        field106: "",
        field107: "",
        field108: "",
        field109: "",
      };
      
       if (isEditMode && certId) {
        await axios.put(`${API_BASE_URL}/Certificates/${certId}`, apiPayload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } else {
      const response = await axios.post(`${API_BASE_URL}/Certificates`, apiPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Certificate created successfully:", response.data);

      // Certificate is saved; offer payment (card or wallet) before leaving.
      const createdCertNo =
        response.data?.certificateNo || response.data?.CertificateNo;
      if (createdCertNo) {
        setPayCertNo(createdCertNo);
      } else {
        navigate(getCertificatesPath(), {
          state: { success: "Certificate created successfully!" },
        });
      }
    }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        // Clear invalid token and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        // navigate('/login');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Invalid request data");
      } // Show detailed error message from server
      const errorMessage =
        err.response?.data ||
        err.response?.data?.message ||
        err.message ||
        "Failed to create certificate";
      console.error("Full error details:", err.response?.data);
      setError(`Server error: ${JSON.stringify(errorMessage)}`);
    } finally {
      setLoading(false);
    }
  };

  // Where the certificate list lives for this role (matches the routes in App.jsx)
  const certificatesListPath =
    userRole === "customer" ? "/client/certificates" : "/brokers/certificates";

  const getCertificatesPath = () => {
    switch (userRole) {
      case "broker":
        return "/brokers-dashboard/certificates";
      case "client":
        return "/client-dashboard/client-certificate";
      default:
        return "/";
    }
  };

  const renderField = (label, name, type = "text", options = null) => {
  if (viewMode) {
    const value = formData[name];
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
          {value !== undefined && value !== null && value !== "" ? value : "N/A"}
        </div>
      </div>
    );
  }


    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>

        {type === "select" ? (
          <select
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === "checkbox" ? (
          <div className="flex items-center">
            <input
              type="checkbox"
              name={name}
              checked={formData[name]}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Yes</span>
          </div>
        ) : type === "radio" ? (
          <div className="flex flex-wrap gap-4">
            {options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={formData[name] === option.value}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />

                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        ) : type === "textarea" ? (
          <textarea
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            rows={4}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            required={!viewMode && name === "insuredName"}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        )}
      </div>
    );
  };

  if (loading)
    return (
      <div className="p-8" style={{ minWidth: "1200px" }}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading certificate...</p>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="p-8" style={{ minWidth: "1200px" }}>
      {payCertNo && (
        <PaymentModal
          certNo={payCertNo}
          email={user?.email}
          returnPath={certificatesListPath}
          onClose={() =>
            navigate(certificatesListPath, {
              state: { success: "Certificate created successfully!" },
            })
          }
        />
      )}
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Marine Certificate {viewMode ? "Details" : "Setup"}
            </h1>
            <p className="text-gray-600">
              {viewMode
                ? "View certificate information and details"
                : "Create a new marine insurance certificate"}
            </p>
          </div>
          {viewMode && (
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
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
              <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                <strong>Error:</strong> {error}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {viewMode ? (
          <div className="p-6">
            {/* Certificate Details Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Certificate Details
                </h2>
                <span className="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Certificate No
                  </label>
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm font-semibold text-blue-900">
                    {formData.certificateNo}
                  </div>
                </div>

                {renderField("Insured Name", "insuredName")}
                {renderField("Address", "address")}
                {renderField("Transaction Date", "transactionDate")}
                {renderField("Vessel Name", "vesselName")}
                {renderField("Type of Cover", "typeOfCover")}
                {renderField("Voyage From", "voyageFrom")}
                {renderField("Origin", "origin")}
                {renderField("Subject", "subject")}
              </div>
            </div>

            <div className="border-t border-gray-200 my-8"></div>

            {/* Contact Information Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderField("Email Address", "email")}
                {renderField("Mobile Phone No", "mobilePhone")}
                {renderField("Policy No", "policyNo")}
              </div>
            </div>

            <div className="border-t border-gray-200 my-8"></div>

            {/* Shipping Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderField("Conveyance", "conveyance")}
                {renderField("TIN NO", "tinNo")}
                {renderField("Destination", "destination")}
                {renderField("Packaging Type", "packagingType")}
                {renderField("PROFORMA INV.NO", "proformaInvNo")}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Containerized
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        formData.containerized
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {formData.containerized ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-8"></div>

            {/* Insurance Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Insurance Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderField("Interest Insured", "interestInsured")}
                {renderField("Nature of Goods", "natureOfGoods")}
                {renderField("Terms", "terms")}
                {renderField("Currency Type", "currencyType")}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Sum Insured
                  </label>
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm font-semibold text-green-900">
                    {formData.currencyType} {formData.sumInsured}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Rate
                  </label>
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm font-semibold text-blue-900">
                    {formData.rate}%
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-end">
                <Link
                  to={getCertificatesPath()}
                  className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Go Back
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Certificate Details Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Certificate Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Certificate No
                  </label>
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm font-semibold text-blue-900">
                    {formData.certificateNo}
                  </div>
                </div>

                {renderField("Insured Name", "insuredName")}
                {renderField("Address", "address")}
                {renderField("Transaction Date", "transactionDate", "date")}
                {renderField("Vessel Name", "vesselName")}
                {renderField("Type of Cover", "typeOfCover")}
                {renderField("Voyage From", "voyageFrom")}
                {renderField("Origin", "origin")}
                {renderField("Subject", "subject")}
              </div>
            </div>

            <div className="border-t border-gray-200 my-8"></div>

            {/* Contact Information Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderField("Email Address", "email", "email")}
                {renderField("Mobile Phone No", "mobilePhone", "tel")}
                {renderField("Policy No", "policyNo")}
              </div>
            </div>

            <div className="border-t border-gray-200 my-8"></div>

            {/* Shipping Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderField("Conveyance", "conveyance")}
                {renderField("TIN NO", "tinNo")}
                {renderField("Destination", "destination")}
                {renderField("Packaging Type", "packagingType")}
                {renderField("PROFORMA INV.NO", "proformaInvNo")}
                {renderField("Containerized", "containerized", "checkbox")}
              </div>
            </div>

            <div className="border-t border-gray-200 my-8"></div>

            {/* Insurance Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Insurance Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderField("Interest Insured", "interestInsured")}
                {renderField("Nature of Cargo", "natureOfGoods", "select", [
                  { value: "", label: "Select Nature of Cargo" },
                  { value: "General", label: "General Cargo" },
                  { value: "Perishable", label: "Perishable Goods" },
                  { value: "Hazardous", label: "Hazardous Materials" },
                  { value: "Electronics", label: "Electronics" },
                  { value: "Textiles", label: "Textiles" },
                ])}
                {renderField("Terms", "terms")}
                {renderField("Clauses Type", "clausesType", "select", [
                  { value: "", label: "Select Clauses Type" },
                  { value: "Standard", label: "Standard Clauses" },
                  { value: "Extended", label: "Extended Coverage" },
                  { value: "Special", label: "Special Conditions" },
                  { value: "ICC A", label: "Institute Cargo Clauses A" },
                  { value: "ICC B", label: "Institute Cargo Clauses B" },
                  { value: "ICC C", label: "Institute Cargo Clauses C" },
                ])}
              </div>
            </div>

            <div className="border-t border-gray-200 my-8"></div>

            {/* Payment Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Payment Information
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Payment Type
                  </h3>
                  {renderField("", "paymentType", "radio", [
                    { value: "Credit Note", label: "Credit Note" },
                    { value: "CAF", label: "CAF" },
                    { value: "Cash", label: "Cash" },
                  ])}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Loading
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-900">
                        {formData.loading}
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Calc
                      </button>
                    </div>
                  </div>

                  {renderField("Currency Type", "currencyType", "select", [
                    { value: "", label: "Select Currency" },
                    { value: "NGN", label: "Nigerian Naira (NGN)" },
                    { value: "USD", label: "US Dollar (USD)" },
                    { value: "EUR", label: "Euro (EUR)" },
                    { value: "GBP", label: "British Pound (GBP)" },
                  ])}

                  {renderField("Sum Insured", "sumInsured", "number")}

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Rate
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-900">
                        {formData.rate}%
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Compute
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-8"></div>

            {/* Lending Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Lending Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderField("Lending Title", "lendingTitle")}
                {renderField("Legend Title", "legendTitle")}
                {renderField("Date", "date", "date")}
                {renderField("Lending Address", "lendingAddress")}
              </div>
            </div>

            <div className="border-t border-gray-200 my-8"></div>

            {/* Conditions/Clauses */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Conditions/Clauses
              </h2>
              {renderField(
                "Additional Terms and Conditions",
                "conditionsClauses",
                "textarea"
              )}
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-end space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateNewCertificate;
