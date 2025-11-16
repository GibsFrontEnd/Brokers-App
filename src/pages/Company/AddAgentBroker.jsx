import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import CryptoJS from "crypto-js";
import { useAuth } from "../../context/AuthContext";

const SECRET_KEY = "your-secret-key";

const decryptStoredUser = (encrypted) => {
  if (!encrypted) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted ? JSON.parse(decrypted) : null;
  } catch (error) {
    console.error("Failed to decrypt stored user payload", error);
    return null;
  }
};

const extractCompanyId = (payload) => {
  if (!payload) return "";
  return (
    payload.insCompanyId ||
    payload.insCompanyID ||
    payload.companyId ||
    payload.companyID ||
    payload.userid ||
    payload.userId ||
    payload.id ||
    payload.nameid ||
    payload.sub ||
    ""
  );
};

const parseTokenUser = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch (error) {
    console.warn("Failed to parse token payload", error);
    return null;
  }
};

const AddAgentBroker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    brokerName: "",
    password: "",
    email: "",
    mobilePhone: "",
    address: "",
    contactPerson: "",
    tag: "",
    remarks: "",
    rate: "",
    value: "",
    field1: "",
    field2: "",
    a1: "",
    a2: "",
    a3: "",
    a4: "",
    a5: "",
    lStartDate: "",
    lEndDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resolvedCompanyId = useMemo(() => {
    const directId = extractCompanyId(user);
    if (directId) return String(directId);

    if (typeof window === "undefined") return "";

    const encryptedUser = window.localStorage.getItem("user");
    const decryptedUser = decryptStoredUser(encryptedUser);
    if (decryptedUser) {
      const decryptedId = extractCompanyId(decryptedUser);
      if (decryptedId) return String(decryptedId);
    }

    const token = window.localStorage.getItem("token");
    const tokenPayload = parseTokenUser(token);
    const tokenId = extractCompanyId(tokenPayload);
    return tokenId ? String(tokenId) : "";
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toNumber = (value) => {
    if (value === "" || value === null || value === undefined) {
      return 0;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const isoOrNull = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (!resolvedCompanyId) {
        throw new Error("Unable to resolve company ID. Please log in again.");
      }

      if (typeof window === "undefined") {
        throw new Error("Window context unavailable.");
      }

      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      setLoading(true);
      setError("");

      const payload = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        mobilePhone: formData.mobilePhone,
        address: formData.address,
        contactPerson: formData.contactPerson,
        submitDate: new Date().toISOString(),
        tag: formData.tag,
        remarks: formData.remarks,
        a1: toNumber(formData.a1),
        a2: toNumber(formData.a2),
        brokerName: formData.brokerName,
        insCompanyID: resolvedCompanyId,
        rate: formData.rate,
        value: formData.value,
        lStartDate: isoOrNull(formData.lStartDate),
        lEndDate: isoOrNull(formData.lEndDate),
        a3: toNumber(formData.a3),
        a4: toNumber(formData.a4),
        a5: toNumber(formData.a5),
        field1: formData.field1,
        field2: formData.field2,
      };

      await axios.post(
        "https://gibsbrokersapi.newgibsonline.com/api/Auth/create-broker",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Agent/Broker created successfully!");
      navigate("/company/agents-brokers");
    } catch (err) {
      console.error("Error creating broker", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create agent/broker"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              to="/company/agents-brokers"
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
              Back to Agents/Brokers
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Add Agent/Broker
          </h1>
          <p className="text-gray-600">
            Provide the details below to onboard a new agent or broker into your
            network.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Agent/Broker Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Required fields are marked with an asterisk (*).
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
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter unique username"
                    required
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent/Broker Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="brokerName"
                    value={formData.brokerName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter full name"
                    required
                  />
                </div>

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
                    placeholder="Enter address"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    name="mobilePhone"
                    value={formData.mobilePhone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>

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
                    placeholder="Enter contact person"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="agent@example.com"
                    required
                  />
                </div>

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
                    placeholder="Enter secure password"
                    required
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate
                  </label>
                  <input
                    type="text"
                    name="rate"
                    value={formData.rate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 10%"
                  />
                </div>

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
                    placeholder="Status tag"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    rows={3}
                    value={formData.remarks}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    placeholder="Add any notes"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract Start Date
                  </label>
                  <input
                    type="date"
                    name="lStartDate"
                    value={formData.lStartDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract End Date
                  </label>
                  <input
                    type="date"
                    name="lEndDate"
                    value={formData.lEndDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company ID
                  </label>
                  <input
                    type="text"
                    value={resolvedCompanyId || "Not available"}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                {["a1", "a2", "a3", "a4", "a5"].map((field) => (
                  <div className="lg:col-span-1" key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                      {field}
                    </label>
                    <input
                      type="number"
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder={`Enter ${field.toUpperCase()}`}
                    />
                  </div>
                ))}

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

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-6 border-t border-gray-200 gap-3">
                <Link
                  to="/company/agents-brokers"
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors border border-gray-300 rounded-lg text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
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
                          d="M12 6v12m6-6H6"
                        />
                      </svg>
                      Create Agent/Broker
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Helpful Tips</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Ensure the username is unique before submitting.</li>
                <li>
                  • The listed email becomes the broker's login credential.
                </li>
                <li>• Contract dates are optional but useful for reporting.</li>
                <li>• Numeric fields (A1-A5) accept whole numbers only.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAgentBroker;
