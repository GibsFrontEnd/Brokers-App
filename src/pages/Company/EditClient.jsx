import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function EditClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const basePrefix = location.pathname.startsWith("/admin")
    ? "/admin/company"
    : "/company";

  const [formData, setFormData] = useState({
    insuredId: "",
    brokerId: "",
    insuredName: "",
    address: "",
    email: "",
    mobilePhone: "",
    contactPerson: "",
    password: "",
    submitDate: "",
    type: "",
    a1: 0,
    a2: 0,
    rate: "",
    value: "",
    tag: "",
    remarks: "",
    field1: "",
    field2: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch client data when component loads
  useEffect(() => {
    const fetchClient = async () => {
      try {
        setFetchLoading(true);
        setError(null);

        const response = await fetch(
          `https://gibsbrokersapi.newgibsonline.com/api/InsuredClients/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(user?.token && { Authorization: `Bearer ${user.token}` }),
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch client: ${response.status}`);
        }

        const clientData = await response.json();

        // Format date for datetime-local input
        const submitDate = clientData.submitDate
          ? new Date(clientData.submitDate).toISOString().slice(0, 16)
          : "";

        setFormData({
          insuredId: clientData.insuredId || "",
          brokerId: clientData.brokerId || "",
          insuredName: clientData.insuredName || "",
          address: clientData.address || "",
          email: clientData.email || "",
          mobilePhone: clientData.mobilePhone || "",
          contactPerson: clientData.contactPerson || "",
          password: clientData.password || "",
          submitDate: submitDate,
          type: clientData.type || "",
          a1: clientData.a1 || 0,
          a2: clientData.a2 || 0,
          rate: clientData.rate || "",
          value: clientData.value || "",
          tag: clientData.tag || "",
          remarks: clientData.remarks || "",
          field1: clientData.field1 || "",
          field2: clientData.field2 || "",
        });
      } catch (err) {
        console.error("Error fetching client:", err);
        setError(err.message || "Failed to fetch client data");
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchClient();
    }
  }, [id, user]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Format the submitDate for API
      const submitData = {
        ...formData,
        submitDate: formData.submitDate
          ? new Date(formData.submitDate).toISOString()
          : new Date().toISOString(),
      };

      const response = await fetch(
        `https://gibsbrokersapi.newgibsonline.com/api/InsuredClients/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(user?.token && { Authorization: `Bearer ${user.token}` }),
          },
          body: JSON.stringify(submitData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update client: ${response.status} - ${errorText}`
        );
      }

      setSuccess(true);

      // Redirect back to client list after 2 seconds
      setTimeout(() => {
        navigate(`${basePrefix}/client-management`);
      }, 2000);
    } catch (err) {
      console.error("Error updating client:", err);
      setError(err.message || "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`${basePrefix}/client-management`);
  };

  if (fetchLoading) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <div className="animate-pulse text-gray-600">
          Loading client data...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="text-center lg:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Edit Client
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Update client information and details
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 sm:px-6 py-4 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Client updated successfully! Redirecting...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 sm:px-6 py-4 rounded-lg">
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
      )}

      {/* Edit Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Sub Agent Information
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Update the sub agent details below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Basic Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="insuredName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Sub Agent Name *
              </label>
              <input
                type="text"
                id="insuredName"
                name="insuredName"
                value={formData.insuredName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="mobilePhone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number *
              </label>
              <input
                type="tel"
                id="mobilePhone"
                name="mobilePhone"
                value={formData.mobilePhone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="contactPerson"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contact Person
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Address Section */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Additional Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type
              </label>
              <input
                type="text"
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="rate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Rate
              </label>
              <input
                type="text"
                id="rate"
                name="rate"
                value={formData.rate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="value"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Value
              </label>
              <input
                type="text"
                id="value"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Numeric Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="a1"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                A1
              </label>
              <input
                type="number"
                id="a1"
                name="a1"
                value={formData.a1}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="a2"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                A2
              </label>
              <input
                type="number"
                id="a2"
                name="a2"
                value={formData.a2}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="tag"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tag
              </label>
              <input
                type="text"
                id="tag"
                name="tag"
                value={formData.tag}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="submitDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Submit Date
              </label>
              <input
                type="datetime-local"
                id="submitDate"
                name="submitDate"
                value={formData.submitDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Remarks and Additional Fields */}
          <div>
            <label
              htmlFor="remarks"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="field1"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Field 1
              </label>
              <input
                type="text"
                id="field1"
                name="field1"
                value={formData.field1}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="field2"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Field 2
              </label>
              <input
                type="text"
                id="field2"
                name="field2"
                value={formData.field2}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Hidden ID Fields */}
          <input type="hidden" name="insuredId" value={formData.insuredId} />
          <input type="hidden" name="brokerId" value={formData.brokerId} />

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
                  Updating...
                </>
              ) : (
                "Update Client"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
