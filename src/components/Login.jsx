<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
=======
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
>>>>>>> 186ce3222b1d4faffd0e6ebddfd572f17030f32b
import { useAuth } from "../context/AuthContext";
import Button from "./UI/Button";
import { Input, Password } from "./UI/Input";
import { Card } from "./UI/Card";
// Import a placeholder image - replace with your actual image
// import dashImage from "../assets/dash_image.png";

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [brokers, setBrokers] = useState([]);
  const [loadingBrokers, setLoadingBrokers] = useState(false);
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
      // Try to get all brokers - you might need to adjust this endpoint
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
        // If getting all brokers fails, create a static list or show input field
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
          // Normalize role name for case-insensitive matching
          const userRole = result.user.role?.toLowerCase().trim();

          const dashboardPaths = {
            broker: "/brokers/dashboard",
            customer: "/customer/dashboard",
            company: "/company/dashboard",
          };

          // Get the appropriate dashboard path
          const dashboardPath =
            dashboardPaths[userRole] || dashboardPaths.default;

          console.log(`Redirecting ${userRole} to:`, dashboardPath);
          navigate(dashboardPath);
        }
      } else {
        // Handle login failure
        setError(
          result.error || "Login failed. Please check your credentials."
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
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
    <div className="w-full flex flex-col md:flex-row justify-center items-center min-h-screen gap-12 px-10 md:px-20 py-5 bg-gradient-to-b from-blue-50 to-white overflow-auto">
      {/* Left Side - Login Form */}
      <div className="md:flex-1 flex flex-col justify-center items-center">
        <h1 className="font-sans text-left text-3xl lg:text-5xl text-gray-800 leading-tight lg:leading-[1.2] mb-4 max-w-5xl mx-auto">
          Welcome back to{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-800 bg-clip-text text-transparent">
            GIBS Broker's App
          </span>
        </h1>
        <p className="mt-2 text-left text-gray-700">
          Log in to your account to manage policies, streamline HR, and handle
          insurance operations seamlessly
        </p>

        <form
          className="space-y-6 w-full mt-6"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <Input
              type="text"
              name="insuredName"
              id="insuredName"
              value={formData.insuredName}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="your.username"
              autoComplete="username"
              error={error && !formData.username}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <Button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>

      {/* Right Side - What's New Card */}
      <div className="md:flex-1">
        <div className="bg-white shadow-lg hidden md:block p-6 rounded-lg border border-gray-200">
          <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            WHAT'S NEW
          </span>
          <div className="border relative overflow-hidden rounded-md mt-6">
            {/* Placeholder for dashboard image - replace with your actual image */}
            {/* <img
              src={dashImage}
              className="rounded-lg relative z-10 w-full h-auto"
              alt="Dashboard Preview"
            /> */}
            <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
              <div className="text-center p-8">
                <svg
                  className="w-32 h-32 mx-auto text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-gray-600 mt-4 text-sm">
                  Add dash_image.png here
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-gray-700">
            GIBS Brokers App is now live! Experience seamless operations with
            enterprise-grade HR, intelligent insurance management, and smart
            proposals
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-blue-600 font-semibold hover:underline"
          >
            Check Us Out →
          </Link>
        </div>
      </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mobilePhone" className="block text-xs font-medium text-gray-700">
                Mobile
              </label>
              <input
                type="tel"
                name="mobilePhone"
                id="mobilePhone"
                value={formData.mobilePhone}
                onChange={handleInputChange}
                placeholder="Mobile"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="contactPerson" className="block text-xs font-medium text-gray-700">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                id="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                placeholder="Contact"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-xs font-medium text-gray-700">
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
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-xs font-medium text-gray-700">
          Password *
        </label>
        <div className="relative mt-1">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            value={formData.password}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="••••••••"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
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

      {error && (
        <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="text-green-600 text-xs bg-green-50 p-2 rounded">
          {success}
        </div>
      )}

      {!isRegistering && (
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center">
            <input type="checkbox" className="mr-1" />
            Remember me
          </label>
          <a href="#" className="text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={isRegistering ? handleCreateInsuredClient : handleLogin}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 text-sm rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isRegistering ? "Creating..." : "Signing in..."}
          </span>
        ) : (
          isRegistering ? "Create Account" : "Sign In"
        )}
      </button>
    </form>

    <div className="mt-4 text-center">
      <p className="text-xs text-gray-600">
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
</div>
  );
}
