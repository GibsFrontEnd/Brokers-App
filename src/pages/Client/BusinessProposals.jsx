import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

const BusinessProposals = () => {
  const navigate = useNavigate();

  // Handle missing context gracefully
  const outletContext = useOutletContext();

  // Provide default values if context is not available
  const {
    proposals = [],
    selectedProposal = null,
    showDelete = false,
    handleRowClick = () => {},
    handleAddProposal = () => navigate("/client/add-proposal"),
    setProposals = () => {},
    setSelectedProposal = () => {},
    setShowDelete = () => {},
  } = outletContext || {};

  // If context is completely missing, manage state locally
  const [localProposals, setLocalProposals] = React.useState([
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

  const [localSelectedProposal, setLocalSelectedProposal] =
    React.useState(null);
  const [localShowDelete, setLocalShowDelete] = React.useState(false);

  // Use context if available, otherwise use local state
  const effectiveProposals = outletContext ? proposals : localProposals;
  const effectiveSelectedProposal = outletContext
    ? selectedProposal
    : localSelectedProposal;
  const effectiveShowDelete = outletContext ? showDelete : localShowDelete;
  const effectiveSetProposals = outletContext
    ? setProposals
    : setLocalProposals;
  const effectiveSetSelectedProposal = outletContext
    ? setSelectedProposal
    : setLocalSelectedProposal;
  const effectiveSetShowDelete = outletContext
    ? setShowDelete
    : setLocalShowDelete;

  const effectiveHandleRowClick = (proposal) => {
    if (outletContext) {
      handleRowClick(proposal);
    } else {
      const newSelected =
        proposal.id === localSelectedProposal ? null : proposal.id;
      setLocalSelectedProposal(newSelected);
      setLocalShowDelete(proposal.id === localSelectedProposal ? false : true);
    }
  };

  const effectiveHandleAddProposal = () => {
    navigate("/client/add-proposal"); // Fixed the route
  };

  const handleDelete = () => {
    // For now using mock implementation
    // Replace with actual API call when backend is ready
    effectiveSetProposals(
      effectiveProposals.filter((p) => p.id !== effectiveSelectedProposal)
    );
    effectiveSetSelectedProposal(null);
    effectiveSetShowDelete(false);

    /* 
    BACKEND IMPLEMENTATION:
    try {
      const response = await fetch(`/api/proposals/${selectedProposal}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete proposal');
      setProposals(proposals.filter(p => p.id !== selectedProposal));
      setSelectedProposal(null);
      setShowDelete(false);
    } catch (err) {
      console.error('Error deleting proposal:', err);
    }
    */
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8" style={{ minWidth: "320px" }}>
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
              Business Proposals
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage and track all business proposals
            </p>
          </div>
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-3 text-sm text-gray-600 order-2 sm:order-1">
              <svg
                className="w-4 h-4 flex-shrink-0"
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
              <span>Welcome back, Sub Agent</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold order-1 sm:order-2 self-end sm:self-auto">
              CN
            </div>
          </div>
        </div>
      </div>

      {/* Proposals Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Proposal Management
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                View and manage all submitted business proposals
              </p>
            </div>
            <button
              onClick={effectiveHandleAddProposal}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add New Proposal
            </button>
          </div>
        </div>

        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden lg:block w-full overflow-x-auto">
          <table
            className="w-full divide-y divide-gray-200"
            style={{ minWidth: "1000px" }}
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Select
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Entry Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Last Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  First Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Mobile Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Registration No.
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Paid Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {effectiveProposals.length > 0 ? (
                effectiveProposals.map((proposal) => (
                  <tr
                    key={proposal.id}
                    className={`cursor-pointer transition-colors ${
                      effectiveSelectedProposal === proposal.id
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => effectiveHandleRowClick(proposal)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={effectiveSelectedProposal === proposal.id}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 text-gray-400 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {proposal.entryDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {proposal.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {proposal.firstName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">
                      {proposal.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 text-gray-400 mr-2"
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
                        {proposal.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                        {proposal.regNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {proposal.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                          View
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-gray-300 mb-4"
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
                      <p className="text-sm text-gray-500">
                        No proposals found
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Add your first proposal to get started
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Visible on mobile and tablet */}
        <div className="lg:hidden">
          {effectiveProposals.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {effectiveProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className={`p-4 sm:p-6 cursor-pointer transition-colors ${
                    effectiveSelectedProposal === proposal.id
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => effectiveHandleRowClick(proposal)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={effectiveSelectedProposal === proposal.id}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {proposal.firstName} {proposal.lastName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Reg: {proposal.regNumber}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {proposal.amount}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="truncate">{proposal.entryDate}</span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
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
                      <span className="truncate">{proposal.mobile}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-600">
                    <div className="flex items-start">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="flex-1">{proposal.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <button
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-12 text-center">
              <svg
                className="w-12 h-12 text-gray-300 mb-4 mx-auto"
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
              <p className="text-sm text-gray-500">No proposals found</p>
              <p className="text-xs text-gray-400 mt-1">
                Add your first proposal to get started
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons Section */}
        {effectiveShowDelete && effectiveSelectedProposal && (
          <div className="px-4 sm:px-6 py-4 bg-red-50 border-t border-red-200">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span className="text-sm font-medium text-red-800">
                  1 proposal selected
                </span>
              </div>
              <button
                onClick={handleDelete}
                className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-full sm:w-auto"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Footer with Add Proposal Button */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <p className="text-sm text-gray-600">
              {effectiveProposals.length} proposal
              {effectiveProposals.length !== 1 ? "s" : ""} total
            </p>
            <button
              onClick={effectiveHandleAddProposal}
              className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full sm:w-auto"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add a new proposal
            </button>
          </div>
        </div>
      </div>

      {/* Selection Info */}
      {effectiveSelectedProposal && !effectiveShowDelete && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-blue-800">
              Click on a proposal row to select it, then use the available
              actions
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessProposals;
