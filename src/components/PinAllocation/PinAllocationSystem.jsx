import React, { useState, useEffect } from "react";
import {
  FaCoins,
  FaUserCheck,
  FaHistory,
  FaUsers,
  FaShare,
  FaUserTie,
  FaClock,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import PinService from "../../services/PinServices";
import AllocatePinsModal from "./AllocatePinsModal";
import PendingApprovals from "./PendingApprovals";
import AllocationHistory from "./AllocationHistory";

// Toast Notification Component
const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const icon =
    type === "success" ? (
      <FaCheck className="w-5 h-5" />
    ) : (
      <FaTimes className="w-5 h-5" />
    );
  const title = type === "success" ? "Success!" : "Error!";

  return (
    <div
      className={`fixed top-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-xl flex items-start space-x-3 animate-slideInRight z-50 min-w-80 max-w-md`}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-sm mt-1 opacity-90">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-white hover:text-gray-200 transition-colors duration-200"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    </div>
  );
};

const PinAllocationSystem = () => {
  const [activeTab, setActiveTab] = useState("allocate");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [brokers, setBrokers] = useState([]);
  const [clients, setClients] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [balanceData, pendingData] = await Promise.all([
        PinService.getBalance(),
        PinService.getPendingAllocations().catch(() => []),
      ]);

      setBalance(balanceData.balance || balanceData.availablePins || 0);

      setPendingCount(Array.isArray(pendingData) ? pendingData.length : 0);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocationSuccess = () => {
    loadInitialData();
    showToast(
      "Pin allocation request submitted successfully! Awaiting approval."
    );
  };

  const handleApprovalSuccess = (isApproved = true) => {
    loadInitialData();
    if (isApproved) {
      showToast("Pin allocation approved successfully!");
    } else {
      showToast("Pin allocation rejected successfully!");
    }
  };

  // Update tabs to only show working components
  const tabs = [
    {
      id: "allocate",
      name: "Allocate to Super Agents",
      icon: FaCoins,
      description: "Allocate pins to super agents (requires approval)",
    },
    {
      id: "approvals",
      name: "Pending Approvals",
      icon: FaUserCheck,
      description: "Approve/reject allocation requests",
      badge: pendingCount,
    },
    {
      id: "history",
      name: "Allocation History",
      icon: FaHistory,
      description: "View allocation records",
    },
  ];

  const userRole = localStorage.getItem("userRole") || "admin";

  // Add CSS animations for the toast
  const toastStyles = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .animate-slideInRight {
      animation: slideInRight 0.3s ease-out forwards;
    }
    
    .animate-slideOutRight {
      animation: slideOutRight 0.3s ease-out forwards;
    }
  `;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast Styles */}
      <style>{toastStyles}</style>

      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Pin Management{" "}
              </h1>
              <p className="text-gray-600 mt-1">
                Complete pin allocation and approval workflow
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <FaUserTie className="w-3 h-3 mr-1" />
                  {userRole === "admin" ? "Administrator" : "Approver"}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <FaCoins className="w-3 h-3 mr-1" />
                  Balance: {balance} pins
                </span>
              </div>
            </div>
            <div className="text-right">
              {pendingCount > 0 && (
                <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg mb-2">
                  <div className="flex items-center space-x-2">
                    <FaClock className="w-4 h-4" />
                    <span className="font-semibold">
                      {pendingCount} pending approval(s)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Diagram */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pin Allocation Workflow
          </h3>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <FaCoins className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium">Admin Allocates</p>
              <p className="text-xs text-gray-500">Pins to Super Agent</p>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <FaUserCheck className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium">Approver Reviews</p>
              <p className="text-xs text-gray-500">Pending Request</p>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <FaShare className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium">Super Agent Shares</p>
              <p className="text-xs text-gray-500">With Clients</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap relative ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.name}</span>
                    {tab.badge > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {activeTab === "allocate" && (
                  <AllocatePinsModal
                    brokers={brokers}
                    onAllocationSuccess={handleAllocationSuccess}
                  />
                )}
                {activeTab === "approvals" && (
                  <PendingApprovals
                    onApprovalSuccess={() => handleApprovalSuccess(true)}
                  />
                )}
                {activeTab === "history" && <AllocationHistory />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinAllocationSystem;
