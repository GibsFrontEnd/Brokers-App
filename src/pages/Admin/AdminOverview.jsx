import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const AdminOverview = () => {
  const [totalPolicies, setTotalPolicies] = useState(0);
  const [activeBrokers, setActiveBrokers] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  // const [companies, setCompanies] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = "https://gibsbrokersapi.newgibsonline.com/api";

  // Fetch data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get authentication token
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("token");

        if (!token) {
          throw new Error("No authentication token found");
        }

        console.log("Token found, fetching dashboard data...");

        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Let's test each endpoint individually to see which ones work
        const endpoints = [
          {
            name: "certificates",
            url: `${API_BASE_URL}/Certificates`,
            setter: setTotalPolicies,
          },
          {
            name: "brokers",
            url: `${API_BASE_URL}/Brokers`,
            setter: setActiveBrokers,
          },
          {
            name: "clients",
            url: `${API_BASE_URL}/InsuredClients`,
            setter: setTotalClients,
          },
          // {
          //   name: "companies",
          //   url: `${API_BASE_URL}/InsCompanies`,
          //   setter: setCompanies,
          // },
        ];

        // Fetch data sequentially to better debug which endpoint fails
        for (const endpoint of endpoints) {
          try {
            console.log(`Fetching ${endpoint.name} from:`, endpoint.url);

            const response = await fetch(endpoint.url, {
              method: "GET",
              headers,
            });

            console.log(`${endpoint.name} response status:`, response.status);

            if (!response.ok) {
              if (response.status === 401) {
                throw new Error(`Authentication failed for ${endpoint.name}`);
              }
              console.warn(
                `${endpoint.name} API returned ${response.status}, using default value`
              );
              // Continue with other endpoints even if one fails
              continue;
            }

            const data = await response.json();
            console.log(`${endpoint.name} data:`, data);

            // Handle different response formats
            if (Array.isArray(data)) {
              endpoint.setter(data.length);
            } else if (data && typeof data === "object") {
              // If it's an object with a data property
              if (Array.isArray(data.data)) {
                endpoint.setter(data.data.length);
              } else if (data.count !== undefined) {
                endpoint.setter(data.count);
              } else {
                console.warn(
                  `Unexpected data format for ${endpoint.name}:`,
                  data
                );
                // Set default value if format is unexpected
                endpoint.setter(0);
              }
            } else {
              console.warn(`Unexpected response for ${endpoint.name}:`, data);
              endpoint.setter(0);
            }
          } catch (endpointError) {
            console.error(`Error fetching ${endpoint.name}:`, endpointError);
            // Don't throw, just log and continue with other endpoints
          }
        }
      } catch (err) {
        console.error("Error in fetchDashboardData:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center text-red-600">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-medium">Error loading dashboard</p>
              <p className="text-sm mt-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 ">
      {/* Welcome Message Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center mb-8 ">
          <h1 className="text-3xl font-bold text-blue-800 mb-4">
            Welcome to the New GIBS!
          </h1>
        </div>

        <div className="prose max-w-none text-gray-700">
          <p className="mb-4 text-lg leading-relaxed font-semibold">
            In today's dynamic insurance landscape, brokers and clients alike
            demand faster response times, greater flexibility, and seamless
            accessibility to manage their insurance portfolios.
          </p>

          <p className="mb-4 leading-relaxed">
            The digital transformation of the insurance sector has created new
            expectations for efficiency and convenience. Your clients and
            business partners now expect real-time policy management, instant
            certificate generation, and transparent communication channels. To
            maintain competitive advantage, your brokerage must deliver these
            digital capabilities while ensuring robust security and compliance.
          </p>

          <p className="mb-4 leading-relaxed">
            Our Broker Management Platform is specifically engineered to address
            these evolving needs, empowering your brokerage to deliver
            exceptional service while optimizing operational efficiency. Through
            our comprehensive portal ecosystem, you can provide clients,
            brokers, and underwriters with secure, real-time access to policy
            information, pin allocations, certificate generation, and
            transaction tracking—all within a unified, branded environment.
          </p>

          <p className="leading-relaxed">
            The platform's scalable architecture ensures your brokerage can
            adapt to fluctuating demands while maintaining peak performance.
            Whether you're managing pin allocations for multiple brokers,
            generating insurance certificates for clients, or tracking policy
            transactions, our system provides the flexibility and reliability
            needed to excel in today's competitive insurance marketplace. With
            robust analytics and reporting capabilities, you gain valuable
            insights to drive business growth and enhance client satisfaction.
          </p>
        </div>
      </div>

      {/* Dashboard Stats Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Dashboard Overview
        </h2>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">
          {/* Active Brokers Card - NOW DYNAMIC */}
          <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:scale-110 hover:shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 transition-all duration-300 hover:scale-110 hover:shadow-md">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Brokers
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activeBrokers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Total Clients Card - NOW DYNAMIC */}
          <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:scale-110 hover:shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 transition-all duration-300 hover:scale-110 hover:shadow-md">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Sub Agents
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalClients.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Companies Card - HIDDEN */}
          {/* <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:scale-110 hover:shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 transition-all duration-300 hover:scale-110 hover:shadow-md">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Companies
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {companies.toLocaleString()}
                </p>
              </div>
            </div>
          </div> */}
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Users Management
            </h3>
            <div className="space-y-3">
              <Link
                to="/admin/users/agents-brokers"
                className="block p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="text-blue-800 font-medium">
                    Manage Super Agents
                  </span>
                </div>
              </Link>
              <Link
                to="/admin/users/clients"
                className="block p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  <span className="text-blue-800 font-medium">
                    Manage Sub Agents
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Pin Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pin Management
            </h3>
            <div className="space-y-3">
              <Link
                to="/admin/pin-allocation"
                className="block p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-600 mr-3"
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
                  <span className="text-green-800 font-medium">
                    Pin Allocation System
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Security & Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Security & Settings
            </h3>
            <div className="space-y-3">
              <Link
                to="/admin/security"
                className="block p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-purple-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span className="text-purple-800 font-medium">
                    Security Management
                  </span>
                </div>
              </Link>
              <Link
                to="/admin/change-password"
                className="block p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-purple-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  <span className="text-purple-800 font-medium">
                    Change Password
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
