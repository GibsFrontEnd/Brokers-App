import React, { useState, useEffect } from 'react';
import { FaCoins, FaUserCheck, FaHistory, FaUsers, FaShare, FaUserTie, FaClock } from 'react-icons/fa';
import PinService from '../../services/PinServices'; // Fixed import
// import UserService from '../../services/userService'; // Comment out for now since we don't have it
import AllocatePinsModal from './AllocatePinsModal';
import PendingApprovals from './PendingApprovals';
import AllocationHistory from './AllocationHistory';
// import UsersList from './UsersList'; // Comment out for now
// import BrokerSharing from './BrokerSharing'; // Comment out for now

const PinAllocationSystem = () => {
  const [activeTab, setActiveTab] = useState('allocate');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [brokers, setBrokers] = useState([]);
  const [clients, setClients] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [balanceData, pendingData] = await Promise.all([
        PinService.getBalance(),
        PinService.getPendingAllocations().catch(() => [])
      ]);
      
      setBalance(balanceData.balance || balanceData.availablePins || 0);
      
      // For now, use mock data since we don't have UserService
      setBrokers([
        { userId: 'broker1', fullName: 'John Broker', email: 'john@broker.com' },
        { userId: 'broker2', fullName: 'Jane Broker', email: 'jane@broker.com' },
      ]);
      
      setClients([
        { userId: 'client1', fullName: 'Client One', email: 'client1@example.com' },
        { userId: 'client2', fullName: 'Client Two', email: 'client2@example.com' },
      ]);
      
      setPendingCount(Array.isArray(pendingData) ? pendingData.length : 0);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update tabs to only show working components
  const tabs = [
    { id: 'allocate', name: 'Allocate to Brokers', icon: FaCoins, description: 'Allocate pins to brokers (requires approval)' },
    { id: 'approvals', name: 'Pending Approvals', icon: FaUserCheck, description: 'Approve/reject allocation requests', badge: pendingCount },
    { id: 'history', name: 'Allocation History', icon: FaHistory, description: 'View allocation records' },
    // { id: 'broker-sharing', name: 'Broker Sharing', icon: FaShare, description: 'Brokers share pins with clients' },
    // { id: 'users', name: 'Users Management', icon: FaUsers, description: 'Manage brokers and clients' },
  ];

  const userRole = localStorage.getItem('userRole') || 'admin';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pin Management </h1>
              <p className="text-gray-600 mt-1">Complete pin allocation and approval workflow</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <FaUserTie className="w-3 h-3 mr-1" />
                  {userRole === 'admin' ? 'Administrator' : 'Approver'}
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
                    <span className="font-semibold">{pendingCount} pending approval(s)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Diagram */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pin Allocation Workflow</h3>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <FaCoins className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium">Admin Allocates</p>
              <p className="text-xs text-gray-500">Pins to Broker</p>
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
              <p className="text-sm font-medium">Broker Shares</p>
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
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                {activeTab === 'allocate' && (
                  <AllocatePinsModal 
                    brokers={brokers} 
                    onAllocationSuccess={loadInitialData}
                  />
                )}
                {activeTab === 'approvals' && (
                  <PendingApprovals 
                    onApprovalSuccess={loadInitialData}
                  />
                )}
                {activeTab === 'history' && (
                  <AllocationHistory />
                )}
                {/* Comment out non-working components for now */}
                {/* {activeTab === 'broker-sharing' && (
                  <BrokerSharing 
                    clients={clients}
                    onShareSuccess={loadInitialData}
                  />
                )}
                {activeTab === 'users' && (
                  <UsersList brokers={brokers} clients={clients} />
                )} */}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinAllocationSystem;