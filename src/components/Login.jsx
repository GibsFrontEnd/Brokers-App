import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./UI/Button";
import { Input, Password } from "./UI/Input";
import { Card } from "./UI/Card";
// Import a placeholder image - replace with your actual image
// import dashImage from "../assets/dash_image.png";

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    </div>
  );
}
