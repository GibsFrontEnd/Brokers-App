import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiEye, FiEyeOff, FiLock, FiShield, FiCheck, FiX, FiArrowLeft, FiRefreshCw, FiUser } from "react-icons/fi";

const ChangePassword = () => {
  const navigate = useNavigate();
  
  // State for user data
  const [userData, setUserData] = useState({
    userId: "",
    userType: "",
    fullName: "",
    email: "",
    username: ""
  });

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordScore, setPasswordScore] = useState(0);

  // Fetch current user data on component mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setLoadingUser(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      // Fetch current user from your API
      // Adjust the endpoint based on your actual API structure
      const response = await fetch(
        "https://gibsbrokersapi.newgibsonline.com/api/Auth/users",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const data = await response.json();

      // Extract user data based on your API response structure
      if (data.success && data.data) {
        const user = data.data;
        setUserData({
          userId: user.userId || user.id || "",
          userType: user.userType || user.role || "",
          fullName: user.fullName || user.name || "",
          email: user.email || "",
          username: user.username || ""
        });
      } else if (data.userId || data.id) {
        // If API returns user object directly
        setUserData({
          userId: data.userId || data.id,
          userType: data.userType || data.role || "",
          fullName: data.fullName || data.name || "",
          email: data.email || "",
          username: data.username || ""
        });
      } else {
        throw new Error("Invalid user data format received");
      }

    } catch (err) {
      console.error("Error fetching user:", err);
      setError("Unable to load user information. Please refresh the page.");
    } finally {
      setLoadingUser(false);
    }
  };

  // Password strength checker
  useEffect(() => {
    if (formData.newPassword) {
      const checks = {
        length: formData.newPassword.length >= 8,
        uppercase: /[A-Z]/.test(formData.newPassword),
        lowercase: /[a-z]/.test(formData.newPassword),
        number: /[0-9]/.test(formData.newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword),
      };

      setPasswordStrength(checks);
      
      // Calculate password score
      const score = Object.values(checks).filter(Boolean).length;
      setPasswordScore(score);
    } else {
      setPasswordStrength({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      });
      setPasswordScore(0);
    }
  }, [formData.newPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user types
    if (error || success) {
      setError("");
      setSuccess("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password don't match");
      return;
    }

    if (passwordScore < 3) {
      setError("Password must meet at least 3 requirements");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      // Prepare request body
      const requestBody = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      };

      // Make API call
      const response = await fetch(
        "https://gibsbrokersapi.newgibsonline.com/api/Auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.Message ||
            data.error ||
            `Failed to change password (Status: ${response.status})`
        );
      }

      // Success
      setSuccess("Password changed successfully! Redirecting...");
      
      // Clear form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Redirect after delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);

    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const getUserLabel = () => {
    switch (userData.userType?.toLowerCase()) {
      case "broker":
        return "Broker";
      case "client":
        return "Client";
      case "admin":
        return "Admin";
      case "company":
        return "Company";
      default:
        return "User";
    }
  };

  const getDisplayName = () => {
    return userData.fullName || userData.username || userData.email || "User";
  };

  const getDisplayId = () => {
    return userData.userId || "";
  };

  // Password strength indicator
  const getStrengthColor = () => {
    if (passwordScore <= 2) return "bg-red-500";
    if (passwordScore === 3) return "bg-yellow-500";
    if (passwordScore === 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordScore <= 2) return "Weak";
    if (passwordScore === 3) return "Fair";
    if (passwordScore === 4) return "Good";
    return "Strong";
  };

  // Loading state for user data
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Change Password
              </h1>
              <p className="text-gray-600 mt-2">
                Update your account password for enhanced security
              </p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full">
              <FiShield className="text-lg" />
              <span className="text-sm font-medium">Security</span>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {userData.fullName || userData.username ? (
                    <div className="text-blue-600 text-lg font-bold">
                      {(userData.fullName?.[0] || userData.username?.[0] || "U").toUpperCase()}
                    </div>
                  ) : (
                    <FiUser className="text-2xl text-blue-600" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {getDisplayName()}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-gray-600 text-sm">
                    ID: <span className="font-mono font-bold">{getDisplayId()}</span>
                  </p>
                  {userData.userType && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {getUserLabel()}
                    </span>
                  )}
                  {userData.email && (
                    <p className="text-gray-500 text-xs truncate">
                      {userData.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Form Header */}
          <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FiLock className="text-white text-xl" />
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Password Settings
                </h2>
                <p className="text-gray-600 text-sm">
                  Enter your current password and set a new one
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="px-6 sm:px-8 pt-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start">
                  <FiX className="text-red-500 text-xl mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-red-800 font-medium">Error</h4>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-start">
                  <FiCheck className="text-green-500 text-xl mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-green-800 font-medium">Success</h4>
                    <p className="text-green-700 text-sm mt-1">{success}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-8">
            <div className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-11 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    placeholder="Enter current password"
                    required
                  />
                  <FiLock className="absolute left-4 top-3.5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? (
                      <FiEyeOff className="text-lg" />
                    ) : (
                      <FiEye className="text-lg" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-11 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    placeholder="Enter new password"
                    required
                  />
                  <FiLock className="absolute left-4 top-3.5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? (
                      <FiEyeOff className="text-lg" />
                    ) : (
                      <FiEye className="text-lg" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Password Strength
                      </span>
                      <span className={`text-sm font-bold ${getStrengthColor().replace('bg-', 'text-')}`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStrengthColor()} transition-all duration-300`}
                        style={{ width: `${(passwordScore / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-11 pr-12 border rounded-lg focus:ring-2 transition-colors text-sm ${
                      formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="Confirm new password"
                    required
                  />
                  <FiLock className="absolute left-4 top-3.5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? (
                      <FiEyeOff className="text-lg" />
                    ) : (
                      <FiEye className="text-lg" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    <FiX className="mr-1" /> Passwords don't match
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <FiShield className="mr-2" />
                  Password Requirements
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: "length", text: "At least 8 characters" },
                    { key: "uppercase", text: "One uppercase letter" },
                    { key: "lowercase", text: "One lowercase letter" },
                    { key: "number", text: "One number" },
                    { key: "special", text: "One special character" },
                  ].map((req) => (
                    <div key={req.key} className="flex items-center">
                      {passwordStrength[req.key] ? (
                        <FiCheck className="text-green-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded mr-2"></div>
                      )}
                      <span
                        className={`text-sm ${
                          passwordStrength[req.key]
                            ? "text-green-700"
                            : "text-gray-600"
                        }`}
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center pt-6 border-t border-gray-200 gap-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-6 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                >
                  <FiArrowLeft className="mr-2" />
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading || passwordScore < 3 || formData.newPassword !== formData.confirmPassword}
                  className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                >
                  {isLoading ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <FiLock className="mr-2" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;