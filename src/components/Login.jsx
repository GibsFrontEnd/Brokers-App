import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
      console.log("Attempting login with:", formData.username);

      const result = await login({
        username: formData.username,
        password: formData.password,
      });

      console.log("Login result:", result);

      if (result.success) {
        console.log("User role detected:", result.user.role);
        console.log("Is admin:", result.user.isAdmin);

        if (result.user.isAdmin) {
          console.log("Redirecting to admin dashboard");
          navigate("/admin/dashboard");
        } else {
          const userRole = result.user.role?.toLowerCase().trim();

          const dashboardPaths = {
            broker: "/brokers/dashboard",
            customer: "/customer/dashboard",
            company: "/company/dashboard",
          };

          const dashboardPath = dashboardPaths[userRole] || "/customer/dashboard";

          console.log(`Redirecting ${userRole} to:`, dashboardPath);
          navigate(dashboardPath);
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
    // Add your registration logic here
    console.log("Registration data:", formData);
    setLoading(true);
    setError("");
    
    try {
      // Simulate API call
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
              <a href="#" className="text-blue-600 hover:underline">
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

      {/* CSS Animations */}
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
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideDown {
          animation: slideDown 1.2s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 1.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}