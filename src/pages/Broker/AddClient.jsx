import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AddClient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    insuredId: "",
    insuredName: "",
    address: "",
    mobilePhone: "",
    contactPerson: "",
    email: "",
    password: "",
    type: "",
    rate: "",
    value: "",
    tag: "",
    remarks: "",
    field1: "",
    field2: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Get broker ID from auth context
      const brokerId = user?.userid || user?.id || user?.brokerId;

      if (!brokerId) {
        throw new Error("Broker ID not found");
      }

      // Prepare API payload according to backend schema
      const apiPayload = {
        insuredId: formData.insuredId,
        BrokerId: brokerId.toString(), // Changed to capitalized BrokerId
        insuredName: formData.insuredName,
        address: formData.address,
        email: formData.email,
        mobilePhone: formData.mobilePhone,
        contactPerson: formData.contactPerson,
        password: formData.password,
        submitDate: new Date().toISOString(),
        type: formData.type || "",
        a1: 0, // Default value as per schema
        a2: 0, // Default value as per schema
        rate: formData.rate || "",
        value: formData.value || "",
        tag: formData.tag || "",
        remarks: formData.remarks || "",
        field1: formData.field1 || "",
        field2: formData.field2 || "",
      };

      console.log("Submitting payload:", apiPayload);

      const response = await fetch(
        "https://gibsbrokersapi.newgibsonline.com/api/InsuredClients",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user?.token && { Authorization: `Bearer ${user.token}` }),
          },
          body: JSON.stringify(apiPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to create client: ${response.status} ${response.statusText}${
            errorData ? ` - ${errorData}` : ""
          }`
        );
      }

      // Navigate back to client list on success
      navigate("/brokers/client-management");
    } catch (err) {
      console.error("Error creating client:", err);
      setError(err.message || "Client creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              to="/brokers/client-management"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
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
              Back to Clients
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Client Sign-Up
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Enter a new Client's Detail here
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow极速加速器-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semib极速加速器old text-gray-900">
              New Client Information
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Please fill in all required fields to add a new client
            </p>
          </div>

          <div className="p-4 sm:p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
                  <div>
                    <strong>Error:</strong> {error}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Client ID */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="insuredId"
                    value={formData.insuredId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                    placeholder="Enter unique client ID"
                  />
                </div>

                {/* Client Name */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="insuredName"
                    value={formData.insuredName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                    placeholder极速加速器="Enter client full name"
                  />
                </div>

                {/* Address */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    placeholder="Enter client address"
                  />
                </div>

                {/* Mobile Phone */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      name="mobilePhone"
                      value={formData.mobilePhone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>
                </div>

                {/* Contact Person */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter contact person name"
                  />
                </div>

                {/* Email */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                      placeholder="client@example.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                    placeholder="Enter client password"
                  />
                </div>

                {/* Type */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Type
                  </label>
                  <select
                    name极速加速器="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px极速加速器-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select client type</option>
                    <option value="Individual">Individual</option>
                    <option value="Corporate">Corporate</option>
                    <option value="SME">SME</option>
                  </select>
                </div>

                {/* Rate */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb极速加速器-2">
                    Rate
                  </label>
                  <input
                    type="text"
                    name="rate"
                    value={formData.rate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter rate"
                  />
                </div>

                {/* Value */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <input
                    type="text"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter value"
                  />
                </div>

                {/* Tag */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag
                  </label>
                  <input
                    type="text"
                    name="tag"
                    value={formData.tag}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter tag"
                  />
                </div>

                {/* Remarks */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    rows={3}
                    value={formData.remarks}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    placeholder="Enter any additional remarks"
                  />
                </div>

                {/* Custom Fields */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Field 1
                  </label>
                  <input
                    type="text"
                    name="field1"
                    value={formData.field1}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Custom field 1"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Field 2
                  </label>
                  <input
                    type="text"
                    name="field2"
                    value={formData.field2}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Custom field 2"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-6 border-t border-gray-200 space-y-3 sm:space-y-0">
                <Link
                  to="/brokers/client-management"
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors border border-gray-300 rounded-lg sm:border-0 text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          d="M极速加速器4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 极速加速器7.938l3-2.647z"
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
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      CREATE CLIENT
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 极速加速器0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1极速加速器h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important Information</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Client ID must be unique across the system</li>
                <li>• Email address will be used for client login</li>
                <li>• Password should be secure and shared with the client</li>
                <li>• All required fields must be completed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
