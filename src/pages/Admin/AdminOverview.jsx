import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import eagle from "../../assets/eagle.jpg";

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

        // Get authentication token
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("token");

        if (!token) {
          throw new Error("No authentication token found");
        }

        const headers = {
          accept: "text/plain",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Fetch all data in parallel using your actual endpoints
        const [
          certificatesResponse,
          brokersResponse,
          clientsResponse,
          companiesResponse,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/Certificates`, { method: "GET", headers }),
          fetch(`${API_BASE_URL}/Brokers`, { method: "GET", headers }),
          fetch(`${API_BASE_URL}/InsuredClients`, { method: "GET", headers }),
          fetch(`${API_BASE_URL}/InsCompanies`, { method: "GET", headers }),
        ]);

        // Check if all responses are OK
        if (!certificatesResponse.ok)
          throw new Error(
            `Certificates API error: ${certificatesResponse.status}`
          );
        if (!brokersResponse.ok)
          throw new Error(`Brokers API error: ${brokersResponse.status}`);
        if (!clientsResponse.ok)
          throw new Error(`Clients API error: ${clientsResponse.status}`);
        if (!companiesResponse.ok)
          throw new Error(`Companies API error: ${companiesResponse.status}`);

        // Process responses
        const certificatesData = await certificatesResponse.json();
        const brokersData = await brokersResponse.json();
        const clientsData = await clientsResponse.json();
        const companiesData = await companiesResponse.json();

        // Set data counts
        setTotalPolicies(
          Array.isArray(certificatesData) ? certificatesData.length : 0
        );
        setActiveBrokers(Array.isArray(brokersData) ? brokersData.length : 0);
        setTotalClients(Array.isArray(clientsData) ? clientsData.length : 0);
        setCompanies(Array.isArray(companiesData) ? companiesData.length : 0);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching dashboard data:", err);
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

        <div className="prose max-w-none text-gray-700 font-bold">
          <p className="mb-4">
            In today's fast paced, changing world customers ask more of your
            company every day, demanding that you be more responsive, flexible
            and always there for them.
          </p>

          <p className="mb-4">
            With the adoption of Internet technology in every field those same
            clients are asking for a better and more efficient way to manage
            their insurance. To help meet these challenges your company must do
            more than simply integrate its processes—it must literally be able
            to provide products and services to customers on demand, whenever
            they need them. Achieving success in this environment requires an
            entirely new approach. In short, it's never been so important for
            your business—and your IT infrastructure—to be flexible.
          </p>

          <p className="mb-4">
            GIBS™ Enterprise was specifically designed to help you meet these
            challenges, and to allow your company to offer a level of service
            and efficiency that will differentiate you from the rest of the
            industry. Through your own branded portals, you will be able to
            offer your clients and business partners a high level of flexibility
            and service along with cutting-edge technology that is personalized
            to suite their needs.
          </p>

          <p>
            GIBS™ Enterprise's ASP hosted model allows you to meet and surpass
            your clients' demands and maintain the ability to grow along with
            your business at your own pace, increasing and decreasing capacity
            as needed and paying for only what you use. With GIBS™ your company
            can truly achieve this flexibility, it can compete—and win—in
            today's marketplace.
          </p>
        </div>
      </div>

      {/* Dashboard Stats Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Dashboard Overview
        </h2>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Policies Card - NOW DYNAMIC */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
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
