// src/pages/Broker/ViewProfile.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ViewProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Debug: Log the user object to see its structure
  useEffect(() => {
    console.log("User object from auth context:", user);
  }, [user]);

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token) {
          throw new Error("No authentication token found. Please log in.");
        }

        // Get user ID from localStorage
        let userId = null;
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            userId = userData.userid || userData.id || userData.brokerId;
          } catch (e) {
            console.warn("Could not parse user data");
          }
        }

        // Fallback: Try to extract from token
        if (!userId) {
          try {
            const tokenPayload = JSON.parse(atob(token.split(".")[1]));
            userId =
              tokenPayload.nameid ||
              tokenPayload.sub ||
              tokenPayload.unique_name;
          } catch (e) {
            console.warn("Could not parse token");
          }
        }

        if (!userId) {
          throw new Error("User ID not found. Please log in again.");
        }

        console.log("Fetching profile for user ID:", userId);

        // Call the API
        const response = await fetch(
          `https://gibsbrokersapi.newgibsonline.com/api/Auth/user/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication failed. Please log in again.");
          } else if (response.status === 404) {
            throw new Error("User profile not found.");
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        }

        const result = await response.json();
        console.log("API Response:", result);

        // Extract data from response
        const userData = result.data || result;

        // Map API response to profile state (only important fields)
        const mappedProfile = {
          userid: userId,
          brokerId: userData.brokerId || userId,
          brokerName: userData.brokerName || "",
          address: userData.address || "",
          mobilePhone: userData.mobilePhone || "",
          contactName: userData.contactPerson || "",
          email: userData.email || "",
          password: "••••••••", // Don't show real password
          insCompanyId: userData.insCompanyId || "",
          submitDate: userData.submitDate || "",
        };

        setProfile(mappedProfile);
        setFormData(mappedProfile);
        setError("");
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.message || "Failed to load profile data");
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      // For demo purposes - simulate API call
      console.log("📤 Would submit profile data:", formData);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state with new data
      setProfile(formData);
      setIsEditing(false);
      setIsLoading(false);

      // Show success message
      setError(
        "Profile updated successfully! (Demo mode - changes not saved to server)"
      );
      setTimeout(() => setError(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData(profile);
    setError("");
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="animate-pulse text-gray-600">
            Loading profile data...
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
          <Link
            to="/brokers"
            className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Go Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Profile Settings
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage your profile information
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex items-start sm:items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
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
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  My Profile Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {isEditing
                    ? "Edit your personal and contact information"
                    : "View your profile information"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Broker ID
                    </label>
                    <input
                      type="text"
                      name="brokerId"
                      value={formData.brokerId || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Broker ID cannot be changed
                    </p>
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Broker Name
                    </label>
                    <input
                      type="text"
                      name="brokerName"
                      value={formData.brokerName || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      value={formData.address || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    />
                  </div>

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
                        value={formData.mobilePhone || ""}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
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
                        value={formData.email || ""}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                              clipRule="evenodd"
                            />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-6 border-t border-gray-200 space-y-3 sm:space-y-0">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
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
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>UPDATE PROFILE</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-500">
                      Broker ID
                    </label>
                    <p className="text-sm sm:text-base text-gray-900 font-medium break-words">
                      {profile.brokerId}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-500">
                      Broker Name
                    </label>
                    <p className="text-sm sm:text-base text-gray-900 break-words">
                      {profile.brokerName}
                    </p>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-500">
                      Address
                    </label>
                    <p className="text-sm sm:text-base text-gray-900 break-words">
                      {profile.address || "No address provided"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-500">
                      Mobile Phone
                    </label>
                    <div className="flex items-center">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-2 flex-shrink-0"
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
                      <p className="text-sm sm:text-base text-gray-900 break-all">
                        {profile.mobilePhone || "No phone number provided"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-500">
                      Contact Name
                    </label>
                    <p className="text-sm sm:text-base text-gray-900 break-words">
                      {profile.contactName || "No contact name provided"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-500">
                      Email Address
                    </label>
                    <div className="flex items-center">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-2 flex-shrink-0"
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
                      <p className="text-sm sm:text-base text-gray-900 break-all">
                        {profile.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-500">
                      Password
                    </label>
                    <p className="text-sm sm:text-base text-gray-900">
                      ••••••••
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;
