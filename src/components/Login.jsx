import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./UI/Button";
import { Input, Password } from "./UI/Input";
import { Card } from "./UI/Card";
import dash_image from "../assets/dash_image.png";

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [brokers, setBrokers] = useState([]);
  const [loadingBrokers, setLoadingBrokers] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [forgotData, setForgotData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Refs for OTP input
  const otpInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    mobilePhone: "",
    address: "",
    contactPerson: "",
    insuredName: "",
    brokerID: "",
    submitDate: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { login } = useAuth();

  // OTP Timer Effect - Changed to 7 minutes (420 seconds)
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && currentStep === 2) {
      setCanResendOTP(true);
    }
    return () => clearInterval(interval);
  }, [otpTimer, currentStep]);

  // Focus OTP input when step changes
  useEffect(() => {
    if (currentStep === 2 && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [currentStep]);

  // Fetch brokers when in registration mode
  useEffect(() => {
    if (isRegistering) {
      fetchBrokers();
    }
  }, [isRegistering]);

  const fetchBrokers = async () => {
    setLoadingBrokers(true);
    try {
      const response = await fetch('https://gibsbrokersapi.newgibsonline.com/api/Brokers', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });

      if (response.ok) {
        const brokersData = await response.json();
        setBrokers(brokersData);
      } else {
        console.log("Could not fetch brokers list, using empty array");
        setBrokers([]);
      }
    } catch (err) {
      console.error("Error fetching brokers:", err);
      setBrokers([]);
    } finally {
      setLoadingBrokers(false);
    }
  };

  // Handle Forgot Password Input Changes
  const handleForgotInputChange = (e) => {
    const { name, value } = e.target;
    
    // For OTP input, only allow numbers
    if (name === "otp") {
      // Remove any non-numeric characters
      const numericValue = value.replace(/\D/g, '');
      // Limit to 6 digits
      const limitedValue = numericValue.slice(0, 6);
      setForgotData(prev => ({
        ...prev,
        [name]: limitedValue
      }));
    } else {
      setForgotData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Step 1: Send OTP to Email
  const handleSendOTP = async () => {
    if (!forgotData.email.trim()) {
      setForgotError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotData.email)) {
      setForgotError("Please enter a valid email address");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch('https://gibsbrokersapi.newgibsonline.com/api/Auth/forgot-password', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          email: forgotData.email
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setForgotSuccess("OTP has been sent to your email. Please check your inbox (and spam folder).");
        setCurrentStep(2);
        setOtpTimer(420); // Changed to 7 minutes (420 seconds)
        setCanResendOTP(false);
      } else {
        throw new Error(result.message || "Failed to send OTP");
      }
    } catch (err) {
      setForgotError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (!forgotData.otp.trim() || forgotData.otp.length !== 6) {
      setForgotError("Please enter a valid 6-digit OTP");
      return;
    }

    setForgotLoading(true);
    setForgotError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch('https://gibsbrokersapi.newgibsonline.com/api/Auth/verify-otp', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          email: forgotData.email,
          otp: forgotData.otp
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setForgotSuccess("OTP verified successfully!");
        setTimeout(() => {
          setCurrentStep(3);
          setForgotSuccess("");
        }, 1500);
      } else {
        throw new Error(result.message || "Invalid OTP");
      }
    } catch (err) {
      setForgotError(err.message || "Failed to verify OTP. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    // Validation
    if (!forgotData.newPassword || !forgotData.confirmPassword) {
      setForgotError("Please enter both password fields");
      return;
    }

    if (forgotData.newPassword.length < 8) {
      setForgotError("Password must be at least 8 characters long");
      return;
    }

    if (forgotData.newPassword !== forgotData.confirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    setForgotLoading(true);
    setForgotError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch('https://gibsbrokersapi.newgibsonline.com/api/Auth/reset-password', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          email: forgotData.email,
          otp: forgotData.otp,
          newPassword: forgotData.newPassword,
          confirmPassword: forgotData.confirmPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setForgotSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          closeForgotPasswordModal();
          // Clear the form
          setFormData(prev => ({ ...prev, password: "" }));
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to reset password");
      }
    } catch (err) {
      setForgotError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!canResendOTP) return;

    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch('https://gibsbrokersapi.newgibsonline.com/api/Auth/resend-otp', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          email: forgotData.email
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setForgotSuccess("New OTP sent to your email!");
        setOtpTimer(420); // Changed to 7 minutes (420 seconds)
        setCanResendOTP(false);
      } else {
        throw new Error(result.message || "Failed to resend OTP");
      }
    } catch (err) {
      setForgotError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Close Forgot Password Modal
  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setCurrentStep(1);
    setForgotData({
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: ""
    });
    setForgotError("");
    setForgotSuccess("");
    setOtpTimer(0);
    setCanResendOTP(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

 const handleLogin = async () => {
  if (!formData.username || !formData.password) {
    setError("Please enter both username and password");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const result = await login({
      username: formData.username,
      password: formData.password,
    });

    console.log("Login result:", result); // Debug log

    if (result.success) {
      console.log("User authenticated:", result.user);
      console.log("User role:", result.user.role);
      console.log("User entityType:", result.user.entityType);
      console.log("Is admin:", result.user.isAdmin);

      // Determine where to navigate based on user type
      const lowerRole = result.user.role?.toLowerCase();
      const lowerEntityType = result.user.entityType?.toLowerCase();
      const username = result.user.username?.toLowerCase();

      console.log("Routing info:", {
        lowerRole,
        lowerEntityType,
        username
      });

      if (result.user.isAdmin || 
          lowerRole === "admin" || 
          lowerEntityType === "admin" ||
          username?.includes("admin")) {
        console.log("Routing to admin dashboard");
        navigate("/admin/dashboard");
      } else if (lowerEntityType === "broker" || 
                 lowerRole === "broker" || 
                 lowerRole === "superagent" ||
                 username?.includes("broker")) {
        console.log("Routing to broker dashboard");
        navigate("/brokers/dashboard");
      } else if (lowerEntityType === "customer" || 
                 lowerRole === "customer" || 
                 lowerRole === "subagent" ||
                 lowerRole === "client" ||
                 username?.includes("client") ||
                 username?.includes("customer")) {
        console.log("Routing to client dashboard");
        navigate("/client/dashboard");
      } else if (lowerEntityType === "company" || 
                 lowerRole === "company") {
        console.log("Routing to company dashboard");
        navigate("/company/dashboard");
      } else {
        console.log("Default routing to client dashboard");
        navigate("/client/dashboard");
      }
    } else {
      setError(result.error || "Login failed. Please check your credentials.");
    }
  } catch (err) {
    console.error("Login error:", err);
    setError("An error occurred during login. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const handleCreateInsuredClient = async () => {
   
    setLoading(true);
    setError("");
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess("Account created successfully! Please sign in.");
      setIsRegistering(false);
    } catch (err) {
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (isRegistering) {
        handleCreateInsuredClient();
      } else {
        handleLogin();
      }
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setSuccess("");
    setFormData({
      username: "",
      password: "",
      email: "",
      mobilePhone: "",
      address: "",
      contactPerson: "",
      insuredName: "",
      brokerID: "",
      submitDate: new Date().toISOString()
    });
  };

  // Format timer display - Updated for 7 minutes
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col md:flex-row justify-center items-center min-h-screen gap-12 px-10 md:px-20 py-5 bg-gradient-to-b from-blue-50 to-white overflow-auto animate-slideDown">
      {/* Left Side - Login Form */}
      <div className="md:flex-1 flex flex-col justify-center items-center w-full max-w-md">
        <h1 className="font-sans text-left text-3xl lg:text-5xl text-gray-800 leading-tight lg:leading-[1.2] mb-4 w-full animate-fadeInUp">
          Welcome back to{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-800 bg-clip-text text-transparent">
            GIBS Broker's App
          </span>
        </h1>
        <p className="mt-2 text-left text-gray-700 w-full animate-fadeInUp" style={{ animationDelay: "200ms" }}>
          Log in to your account to access certificates, view policies, and manage insurance 
          documentation across broker, company, and client portals in one unified platform.
        </p>

        <form
          className="space-y-6 w-full mt-6"
          onSubmit={(e) => e.preventDefault()}
        >
          {isRegistering && (
            <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: "400ms" }}>
              <div>
                <label htmlFor="insuredName" className="block text-sm font-medium text-gray-700 mb-1">
                  Insured Name *
                </label>
                <Input
                  type="text"
                  name="insuredName"
                  id="insuredName"
                  value={formData.insuredName}
                  onChange={handleInputChange}
                  placeholder="Company or individual name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile
                  </label>
                  <Input
                    type="tel"
                    name="mobilePhone"
                    id="mobilePhone"
                    value={formData.mobilePhone}
                    onChange={handleInputChange}
                    placeholder="Mobile"
                  />
                </div>

                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <Input
                    type="text"
                    name="contactPerson"
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Contact"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                  rows="2"
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {brokers.length > 0 && (
                <div>
                  <label htmlFor="brokerID" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Broker
                  </label>
                  <select
                    name="brokerID"
                    id="brokerID"
                    value={formData.brokerID}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a broker</option>
                    {brokers.map((broker) => (
                      <option key={broker.id} value={broker.id}>
                        {broker.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {!isRegistering && (
            <div className="animate-fadeInUp" style={{ animationDelay: "400ms" }}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <Input
                  type="text"
                  name="username"
                  id="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="your.username"
                  autoComplete="username"
                  error={error && !formData.username}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Password
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  error={error && !formData.password}
                />
              </div>
            </div>
          )}

          {isRegistering && (
            <div className="animate-fadeInUp" style={{ animationDelay: "600ms" }}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="regPassword"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200 animate-fadeInUp" style={{ animationDelay: "800ms" }}>
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md border border-green-200 animate-fadeInUp" style={{ animationDelay: "800ms" }}>
              {success}
            </div>
          )}

          {!isRegistering && (
            <div className="flex items-center justify-between text-sm animate-fadeInUp" style={{ animationDelay: "600ms" }}>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Remember me
              </label>
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  setShowForgotPassword(true);
                }}
                className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200"
              >
                Forgot password?
              </a>
            </div>
          )}

          <Button
            type="button"
            onClick={isRegistering ? handleCreateInsuredClient : handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white animate-fadeInUp"
            style={{ animationDelay: "800ms" }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
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
                {isRegistering ? "Creating Account..." : "Signing in..."}
              </span>
            ) : (
              isRegistering ? "Create Account" : "Sign in"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center w-full animate-fadeInUp" style={{ animationDelay: "1000ms" }}>
          <p className="text-sm text-gray-600">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 hover:underline font-medium"
            >
              {isRegistering ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - What's New Card */}
      <div className="md:flex-1">
        <div className="bg-gray-50 shadow-lg p-6 hidden md:block rounded-lg border border-gray-200 animate-fadeInUp" style={{ animationDelay: "400ms" }}>
          <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            WHAT'S NEW
          </span>
          <div className="border relative overflow-hidden rounded-md mt-6">
            <img 
              src={dash_image} 
              alt="Dashboard Preview" 
              className="rounded-lg relative z-10 w-full h-auto"
            />
          </div>
          <p className="mt-4 text-gray-700">
            GIBS Brokers Platform is now live! Experience unified insurance management with 
            dedicated portals for brokers, companies, and clients - all in one secure ecosystem.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-blue-600 font-semibold hover:underline"
          >
            Check Us Out →
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slideDown" style={{ animationDelay: "100ms" }}>
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {currentStep === 1 && "Reset Password"}
                    {currentStep === 2 && "Verify OTP"}
                    {currentStep === 3 && "Set New Password"}
                  </h2>
                  <p className="text-gray-600 mt-1 text-sm">
                    {currentStep === 1 && "Enter your email to receive OTP"}
                    {currentStep === 2 && `Enter the 6-digit OTP sent to ${forgotData.email}`}
                                        {currentStep === 3 && "Create a new password for your account"}
                  </p>
                </div>
                <button
                  onClick={closeForgotPasswordModal}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step === currentStep 
                          ? 'bg-blue-600 text-white' 
                          : step < currentStep 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step < currentStep ? '✓' : step}
                      </div>
                      <span className="text-xs mt-1 text-gray-600">
                        {step === 1 ? 'Email' : step === 2 ? 'OTP' : 'Password'}
                      </span>
                    </div>
                  ))}
                  <div className="flex-1 h-1 mx-2 bg-gray-200 -mt-5">
                    <div className="h-full bg-blue-600 transition-all duration-300" 
                      style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Step 1: Email Input */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        name="email"
                        id="forgotEmail"
                        value={forgotData.email}
                        onChange={handleForgotInputChange}
                        placeholder="Enter your registered email"
                        className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        disabled={forgotLoading}
                        onKeyPress={(e) => e.key === "Enter" && handleSendOTP()}
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {forgotError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-700 text-sm">{forgotError}</p>
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {forgotSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-green-700 text-sm">{forgotSuccess}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSendOTP}
                    disabled={forgotLoading || !forgotData.email}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {forgotLoading ? (
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
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send OTP
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 2: OTP Verification */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                      6-Digit OTP *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        ref={otpInputRef}
                        type="text"
                        name="otp"
                        id="otp"
                        value={forgotData.otp}
                        onChange={handleForgotInputChange}
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full pl-10 pr-4 py-3 text-center text-lg tracking-widest font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        disabled={forgotLoading}
                        onKeyPress={(e) => {
                          // Only allow numbers
                          if (!/^\d$/.test(e.key) && e.key !== "Enter" && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "Tab") {
                            e.preventDefault();
                          }
                          if (e.key === "Enter" && forgotData.otp.length === 6) {
                            handleVerifyOTP();
                          }
                        }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {otpTimer > 0 ? (
                          <span>OTP expires in: <span className="font-mono font-bold text-red-600">{formatTimer(otpTimer)}</span></span>
                        ) : (
                          <span className="text-red-600">OTP expired</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={!canResendOTP || forgotLoading}
                        className={`text-sm ${canResendOTP ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`}
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {forgotError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-700 text-sm">{forgotError}</p>
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {forgotSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-green-700 text-sm">{forgotSuccess}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleVerifyOTP}
                    disabled={forgotLoading || forgotData.otp.length !== 6}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {forgotLoading ? (
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
                        Verifying OTP...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verify OTP
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 3: Reset Password */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        id="newPassword"
                        value={forgotData.newPassword}
                        onChange={handleForgotInputChange}
                        placeholder="Enter new password (min. 8 characters)"
                        className="w-full pl-10 pr-10 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        disabled={forgotLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        value={forgotData.confirmPassword}
                        onChange={handleForgotInputChange}
                        placeholder="Confirm new password"
                        className="w-full pl-10 pr-10 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        disabled={forgotLoading}
                        onKeyPress={(e) => e.key === "Enter" && handleResetPassword()}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {forgotError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-700 text-sm">{forgotError}</p>
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {forgotSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-green-700 text-sm">{forgotSuccess}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleResetPassword}
                    disabled={forgotLoading || !forgotData.newPassword || !forgotData.confirmPassword}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {forgotLoading ? (
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
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reset Password
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Back Button for Steps 2 & 3 */}
              {(currentStep === 2 || currentStep === 3) && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="w-full mt-4 py-2 px-4 text-gray-600 hover:text-gray-800 font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Go Back
                </button>
              )}
            </div>

            {/* Decorative Bottom */}
            <div className={`h-2 rounded-b-2xl ${
              currentStep === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
              currentStep === 2 ? 'bg-gradient-to-r from-blue-600 to-purple-600' :
              'bg-gradient-to-r from-green-500 to-green-600'
            }`}></div>
          </div>
        </div>
      )}

      {/* Remove console logs from handleLogin function */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideDown {
          animation: slideDown 1.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}