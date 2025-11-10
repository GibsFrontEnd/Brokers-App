import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const AdminOverview = () => {
  const [totalPolicies, setTotalPolicies] = useState(0);
  const [activeBrokers, setActiveBrokers] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [companies, setCompanies] = useState(0);
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
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Let's test each endpoint individually to see which ones work
        const endpoints = [
          { 
            name: 'certificates', 
            url: `${API_BASE_URL}/Certificates`,
            setter: setTotalPolicies
          },
          { 
            name: 'brokers', 
            url: `${API_BASE_URL}/Brokers`,
            setter: setActiveBrokers
          },
          { 
            name: 'clients', 
            url: `${API_BASE_URL}/InsuredClients`,
            setter: setTotalClients
          },
          { 
            name: 'companies', 
            url: `${API_BASE_URL}/InsCompanies`,
            setter: setCompanies
          }
        ];

        // Fetch data sequentially to better debug which endpoint fails
        for (const endpoint of endpoints) {
          try {
            console.log(`Fetching ${endpoint.name} from:`, endpoint.url);
            
            const response = await fetch(endpoint.url, { 
              method: "GET", 
              headers 
            });

            console.log(`${endpoint.name} response status:`, response.status);

            if (!response.ok) {
              if (response.status === 401) {
                throw new Error(`Authentication failed for ${endpoint.name}`);
              }
              console.warn(`${endpoint.name} API returned ${response.status}, using default value`);
              // Continue with other endpoints even if one fails
              continue;
            }

            const data = await response.json();
            console.log(`${endpoint.name} data:`, data);

            // Handle different response formats
            if (Array.isArray(data)) {
              endpoint.setter(data.length);
            } else if (data && typeof data === 'object') {
              // If it's an object with a data property
              if (Array.isArray(data.data)) {
                endpoint.setter(data.data.length);
              } else if (data.count !== undefined) {
                endpoint.setter(data.count);
              } else {
                console.warn(`Unexpected data format for ${endpoint.name}:`, data);
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
    In today's dynamic insurance landscape, brokers and clients alike demand 
    faster response times, greater flexibility, and seamless accessibility 
    to manage their insurance portfolios.
  </p>

  <p className="mb-4 leading-relaxed">
    The digital transformation of the insurance sector has created new expectations 
    for efficiency and convenience. Your clients and business partners now expect 
    real-time policy management, instant certificate generation, and transparent 
    communication channels. To maintain competitive advantage, your brokerage must 
    deliver these digital capabilities while ensuring robust security and compliance.
  </p>

  <p className="mb-4 leading-relaxed">
    Our Broker Management Platform is specifically engineered to address these 
    evolving needs, empowering your brokerage to deliver exceptional service 
    while optimizing operational efficiency. Through our comprehensive portal 
    ecosystem, you can provide clients, brokers, and underwriters with secure, 
    real-time access to policy information, pin allocations, certificate generation, 
    and transaction tracking—all within a unified, branded environment.
  </p>

  <p className="leading-relaxed">
    The platform's scalable architecture ensures your brokerage can adapt to 
    fluctuating demands while maintaining peak performance. Whether you're 
    managing pin allocations for multiple brokers, generating insurance certificates 
    for clients, or tracking policy transactions, our system provides the flexibility 
    and reliability needed to excel in today's competitive insurance marketplace. 
    With robust analytics and reporting capabilities, you gain valuable insights 
    to drive business growth and enhance client satisfaction.
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
          {/* Total Policies Card - NOW DYNAMIC */}
          <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:scale-110 hover:shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 transition-all duration-300 hover:scale-110 hover:shadow-md">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Policies
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalPolicies.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

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
                  Total Clients
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalClients.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Companies Card - NOW DYNAMIC */}
          <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:scale-110 hover:shadow-md">
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
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Company Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Company Management
            </h3>
            <div className="space-y-3">
              <Link
                to="/admin/company/certificates"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-blue-800 font-medium">
                    Company Policies
                  </span>
                </div>
              </Link>
              <Link
                to="/admin/company/agents-brokers"
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
                    Agents & Brokers
                  </span>
                </div>
              </Link>
              <Link
                to="/admin/company/download-certificates"
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span className="text-blue-800 font-medium">
                    Download Certificates
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Broker Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Broker Management
            </h3>
            <div className="space-y-3">
              <Link
                to="/admin/broker/certificates"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-green-800 font-medium">
                    Broker Policies
                  </span>
                </div>
              </Link>
              <Link
                to="/admin/broker/client-management"
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  <span className="text-green-800 font-medium">
                    Client Management
                  </span>
                </div>
              </Link>
              <Link
                to="/admin/broker/view-documents"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-green-800 font-medium">
                    View Documents
                  </span>
                </div>
              </Link>
              <Link
                to="/admin/broker/credit-notes"
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
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-green-800 font-medium">
                    Credit Notes
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Client Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Client Management
            </h3>
            <div className="space-y-3">
              <Link
                to="/admin/client/business-proposals"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-purple-800 font-medium">
                    Business Proposals
                  </span>
                </div>
              </Link>
              <Link
                to="/admin/client/client-certificate"
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-purple-800 font-medium">
                    Client Certificates
                  </span>
                </div>
              </Link>
              <Link
                to="/admin/client/add-proposal"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-purple-800 font-medium">
                    Add Proposal
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
