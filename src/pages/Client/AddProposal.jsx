import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function AddProposal() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith("/admin")
    ? "/admin"
    : "/customer";
  const [insuredType, setInsuredType] = useState("Individual");
  const [formData, setFormData] = useState({
    // Common fields
    address: "",
    email: "",
    phoneMobile: "",
    phoneNumber: "",
    transactionDate: "",
    classOfBusiness: "",
    startDate: "",
    endDate: "",
    locationId: "",
    premiumDue: "24000.00",
    notePayment: "",

    // Individual fields
    lastname: "",
    firstname: "",
    occupation: "",

    // Corporate fields
    companyName: "",
    registrationNumber: "",
    industry: "",
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scannedDocs, setScannedDocs] = useState({
    doc1: null,
    doc2: null,
    doc3: null,
    doc4: null,
  });
  const [showPaymentSection] = useState(true);
  const [paymentAmount] = useState("24,000.00");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, docName) => {
    setScannedDocs((prev) => ({ ...prev, [docName]: e.target.files[0] }));
  };

  const handleMakePayment = () => {
    navigate(`${basePrefix}/make-payment`, {
      state: { amount: paymentAmount },
    });
  };

  /* 
  BACKEND IMPLEMENTATION: Save as Draft
  const handleSaveProposal = async () => {
    try {
      setSaveLoading(true);
      const formDataToSend = new FormData();
      
      // Append all form data
      for (const key in formData) {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      }
      
      // Append scanned documents
      for (const key in scannedDocs) {
        if (scannedDocs[key]) {
          formDataToSend.append('documents', scannedDocs[key]);
        }
      }
      
      formDataToSend.append('status', 'draft');
      formDataToSend.append('insuredType', insuredType);

      const response = await axios.post('/api/proposals/save-draft', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        console.log('Draft saved successfully');
        navigate('/client-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save draft proposal');
      console.error('Error saving draft:', err);
    } finally {
      setSaveLoading(false);
    }
  };
  */

  // Mock save handler for frontend testing
  const handleSaveProposal = () => {
    setSaveLoading(true);
    setTimeout(() => {
      console.log("Proposal saved as draft (mock)", formData);
      setSaveLoading(false);
      navigate(basePrefix);
    }, 1000);
  };

  /* 
  BACKEND IMPLEMENTATION: Submit Proposal
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      
      // Append all form data
      for (const key in formData) {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      }
      
      // Append scanned documents
      for (const key in scannedDocs) {
        if (scannedDocs[key]) {
          formDataToSend.append('documents', scannedDocs[key]);
        }
      }
      
      formDataToSend.append('status', 'submitted');
      formDataToSend.append('insuredType', insuredType);

      const response = await axios.post('/api/proposals', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        navigate('/client-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Proposal submission failed');
      console.error('Error submitting proposal:', err);
    } finally {
      setLoading(false);
    }
  };
  */

  // Mock submit handler for frontend testing
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      console.log("Proposal submitted (mock)", { ...formData, scannedDocs });
      setLoading(false);
      navigate(basePrefix);
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-w-0 w-full max-w-none lg:min-w-[1200px]">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Add/Edit A Proposal
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Submit a new business proposal or edit existing one
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3 text-sm text-gray-600">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Welcome back, Sub Agent</span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              CN
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-4 sm:px-6 py-3 sm:py-4 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-sm sm:text-base">{error}</span>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Proposal Information
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Complete all required fields to submit your proposal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {/* Insured Details Section */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm sm:text-base">Insured Details</span>
            </h3>

            {/* Insured Type Radio Buttons */}
            <div className="mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                Insured Type
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    name="insuredType"
                    value="Corporate"
                    checked={insuredType === "Corporate"}
                    onChange={() => setInsuredType("Corporate")}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Corporate
                  </span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    name="insuredType"
                    value="Individual"
                    checked={insuredType === "Individual"}
                    onChange={() => setInsuredType("Individual")}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Individual
                  </span>
                </label>
              </div>
            </div>

            {/* Dynamic Form Fields Based on Insured Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {insuredType === "Individual" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Occupation
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                      placeholder="Enter occupation"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                      placeholder="Enter registration number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                      placeholder="Enter industry"
                      required
                    />
                  </div>
                </>
              )}

              {/* Common Fields */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  placeholder="Enter full address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  name="phoneMobile"
                  value={formData.phoneMobile}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  placeholder="Enter mobile phone"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Proposal Details Section */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2"
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
              <span className="text-sm sm:text-base">Proposal Details</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Date
                </label>
                <input
                  type="date"
                  name="transactionDate"
                  value={formData.transactionDate}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class of Business
                </label>
                <select
                  name="classOfBusiness"
                  value={formData.classOfBusiness}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  required
                >
                  <option value="">--Select Class of business--</option>
                  <option value="General Insurance">General Insurance</option>
                  <option value="Life Insurance">Life Insurance</option>
                  <option value="Health Insurance">Health Insurance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  required
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location ID
                </label>
                <input
                  type="text"
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  placeholder="Enter location ID"
                  required
                />
              </div>
            </div>
          </div>

          {/* Scanned Documents Section */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm sm:text-base">Scanned Documents</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {["doc1", "doc2", "doc3", "doc4"].map((doc, index) => (
                <div key={doc}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scanned Document {index + 1}
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, doc)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-sm sm:text-base"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  {scannedDocs[doc] && (
                    <p className="mt-1 text-xs sm:text-sm text-green-600 flex items-center">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="truncate">{scannedDocs[doc].name}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Premium Due Section */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2"
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
              <span className="text-sm sm:text-base">Premium Due</span>
            </h3>
            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm font-medium text-green-800">
                  Total Premium Amount:
                </span>
                <span className="text-lg sm:text-xl font-bold text-green-600">
                  ₦{formData.premiumDue}
                </span>
              </div>
            </div>
          </div>

          {/* Note Payment Section */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="text-sm sm:text-base">Payment Notes</span>
            </h3>
            <textarea
              name="notePayment"
              value={formData.notePayment}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
              placeholder="Enter any additional notes regarding payment..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 sm:pt-6 border-t border-gray-200 gap-4">
            <Link
              to={basePrefix}
              className="inline-flex items-center justify-center sm:justify-start px-4 sm:px-6 py-2 sm:py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm sm:text-base"
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
              Go back
            </Link>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={handleSaveProposal}
                disabled={saveLoading}
                className={`inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm sm:text-base ${
                  saveLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
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
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                {saveLoading ? "Saving..." : "Save Draft"}
              </button>
              {showPaymentSection && (
                <button
                  type="button"
                  onClick={handleMakePayment}
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm sm:text-base"
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
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Make Payment
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm sm:text-base ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                {loading ? "Submitting..." : "Submit Proposal"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
