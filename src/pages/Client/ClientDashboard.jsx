import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import WelcomeMessage from "../../components/WelcomeMessage"; // Import the WelcomeMessage component

const ClientDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're at the root client dashboard path
  const isRootPath =
    location.pathname === "/customer" || location.pathname === "/customer/";

  // State for proposals data
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  // Mobile responsive state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock data for frontend display
  useEffect(() => {
    setProposals([
      {
        id: 1,
        entryDate: "22 Aug 15",
        lastName: "Other Names",
        firstName: "intteck",
        address: "233 ikorodu road",
        mobile: "08023140962",
        regNumber: "LAG 987 67",
        amount: "5000.0000",
      },
      {
        id: 2,
        entryDate: "22 Aug 15",
        lastName: "Other Names",
        firstName: "intteck",
        address: "233 ikorodu road",
        mobile: "08023140962",
        regNumber: "LAG 987 GH",
        amount: "5000.0000",
      },
    ]);
    setLoading(false);
  }, []);

  const handleRowClick = (proposal) => {
    setSelectedProposal(proposal.id === selectedProposal ? null : proposal.id);
    setShowDelete(proposal.id === selectedProposal ? false : true);
  };

  const handleAddProposal = () => {
    navigate("add-proposal");
  };

  // Check if current path is active
  const isActivePath = (path) => {
    if (path === "business-proposals") {
      return (
        location.pathname === "/client" ||
        location.pathname === "/client/business-proposals"
      );
    }
    return location.pathname.includes(path);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-600">Loading proposals...</div>
    );

  if (error)
    return (
      <div className="p-4 sm:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 sm:px-6 py-4 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Error:</strong> {error}
            </span>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="text-white px-4 sm:px-6 py-4 shadow-sm sticky top-0 z-50 w-full"
        style={{ backgroundColor: "#3f33ef" }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-white hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Globe Icon */}
            <div className="w-8 h-8 bg-white bg-opacity-15 rounded-lg flex items-center justify-center shadow-md backdrop-blur-sm border border-white border-opacity-20">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM11 19.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zM17.9 17.39c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight">
                Gibs Insurance
              </h1>
              <p className="text-white text-opacity-80 text-md font-normal">
                Client Portal
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">C</span>
              </div>
              <span className="text-sm hidden sm:block">Client</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside
          className={`w-64 bg-blue-900 text-white shadow-lg border-r border-blue-800 fixed left-0 top-0 h-screen pt-20 z-40 transform transition-transform duration-300 ease-in-out lg:transform-none ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="p-4 pt-8 h-full overflow-y-auto">
            <nav className="space-y-1">
              <Link
                to="/client/business-proposals"
                className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePath("business-proposals")
                    ? "bg-white/15 text-white border-l-4 border-orange-500"
                    : "text-white hover:bg-white/10 border-l-4 border-transparent"
                }`}
              >
                <div
                  className={`p-1 rounded-md ${
                    isActivePath("business-proposals")
                      ? "bg-white/20"
                      : "group-hover:bg-white/10"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
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
                <span>Business Proposals</span>
              </Link>

              <Link
                to="/client/certificates"
                className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePath("client-certificate")
                    ? "bg-white/15 text-white border-l-4 border-orange-500"
                    : "text-white hover:bg-white/10 border-l-4 border-transparent"
                }`}
              >
                <div
                  className={`p-1 rounded-md ${
                    isActivePath("client-certificate")
                      ? "bg-white/20"
                      : "group-hover:bg-white/10"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span>Policy Admin</span>
              </Link>

              <Link
                to="/client/change-password"
                className={`group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePath("change-password")
                    ? "bg-white/15 text-white border-l-4 border-orange-500"
                    : "text-white hover:bg-white/10 border-l-4 border-transparent"
                }`}
              >
                <div
                  className={`p-1 rounded-md ${
                    isActivePath("change-password")
                      ? "bg-white/20"
                      : "group-hover:bg-white/10"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 012 2M9 7a2 2 0 012 2v0a2 2 0 01-2 2m0 0a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2z"
                    />
                  </svg>
                </div>
                <span>Change Password</span>
              </Link>

              <div className="pt-6 mt-6 border-t border-gray-200">
                <Link
                  to="/"
                  className="group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                >
                  <div className="p-1 rounded-md group-hover:bg-red-100">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                  <span>Logout</span>
                </Link>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 overflow-x-auto lg:ml-64">
          <div className="p-4">
            <div className="max-w-7xl mx-auto">
           {isRootPath ? (
  <WelcomeMessage />
) : (
  <Outlet />
)}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;
