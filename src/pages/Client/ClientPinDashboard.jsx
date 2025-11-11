import React, { useState, useEffect } from 'react';
import { FaCoins, FaHistory, FaSearch, FaExclamationTriangle, FaUser, FaArrowDown } from 'react-icons/fa';
import PinService from '../../services/PinServices';
import CryptoJS from 'crypto-js';

const ClientPinDashboard = () => {
  const [balance, setBalance] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientId, setClientId] = useState('');

  // Add the same decrypt function from your AuthContext
  const decryptData = (encryptedData) => {
    if (!encryptedData) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, "your-secret-key");
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedString ? JSON.parse(decryptedString) : null;
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  };

  useEffect(() => {
    const getUserClientId = () => {
      // Get the ENCRYPTED user data from localStorage
      const encryptedUserData = localStorage.getItem('user');
      console.log('Encrypted user data from storage:', encryptedUserData);
      
      if (!encryptedUserData) {
        console.log('No user data found in localStorage');
        return '';
      }

      try {
        // DECRYPT the user data first
        const user = decryptData(encryptedUserData);
        console.log('Decrypted user object:', user);
        
        if (!user) {
          console.error('Failed to decrypt user data');
          return '';
        }

        // Common field names for client ID in different systems
        const clientIdFields = [
          'userId', 'userID', 'UserId', 'id', 'Id', 'ID',
          'insuredId', 'insuredID', 'clientId', 'clientID',
          'username', 'userName', 'name', 'Name', 'code', 'Code'
        ];
        
        // Find the first field that exists and has a value
        for (const field of clientIdFields) {
          if (user[field] && typeof user[field] === 'string' && user[field].trim()) {
            console.log(`Found client ID in field "${field}":`, user[field]);
            return user[field];
          }
        }
        
        console.warn('No client ID found in decrypted user data. Available fields:', Object.keys(user));
        return '';
        
      } catch (e) {
        console.error('Failed to decrypt or parse user data:', e);
        return '';
      }
    };

    const foundClientId = getUserClientId();
    console.log('Final clientId to be used:', foundClientId);
    setClientId(foundClientId);
  }, []);

  // Load dashboard data when clientId changes
  useEffect(() => {
    if (clientId) {
      loadDashboardData();
    }
  }, [clientId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load balance
      try {
        const balanceData = await PinService.getBalance(clientId);
        console.log('Balance API response:', balanceData);
        
        // Use currentBalance for client view
        setBalance(balanceData.currentBalance || balanceData.balance || 0);
      } catch (balanceError) {
        console.warn('Failed to load balance:', balanceError);
        setBalance(0); // Fallback
      }
      
      // Load recent activity - filter to show only allocations where client received pins
      try {
        const activityData = await PinService.getMyAllocations();
        console.log('All allocations data:', activityData);
        
        // Filter to show only allocations where this client received pins
        const clientActivities = Array.isArray(activityData) 
          ? activityData.filter(activity => 
              activity.toUserId === clientId && 
              activity.status === 'APPROVED'
            )
          : [];
        
        console.log('Filtered client activities:', clientActivities);
        setRecentActivity(clientActivities);
      } catch (activityError) {
        console.warn('Failed to load activity:', activityError);
        setRecentActivity([]); // Fallback
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  // Filter activities based on search term
  const filteredActivities = recentActivity.filter(activity =>
    activity.fromUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.fromUserId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      title: 'Available Pins',
      value: balance,
      icon: FaCoins,
      color: 'blue',
      description: 'Pins available for use'
    },
    {
      title: 'Total Received',
      value: recentActivity.reduce((sum, activity) => sum + (parseInt(activity.pinAmount) || 0), 0),
      icon: FaHistory,
      color: 'green',
      description: 'All time received pins'
    },
    {
      title: 'Transaction History',
      value: recentActivity.length,
      icon: FaHistory,
      color: 'purple',
      description: 'Total transactions'
    },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Completed': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Failed': 'bg-red-100 text-red-800',
      'APPROVED': 'bg-blue-100 text-blue-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        statusConfig[status] || 'bg-gray-100 text-gray-800'
      }`}>
        {status}
      </span>
    );
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Pin Balance</h1>
          <p className="text-gray-600 mt-1">View your available pins and transaction history</p>
          {clientId && (
            <div className="flex items-center space-x-2 mt-2">
              <FaUser className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Client ID: {clientId}</span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <FaExclamationTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
            <button 
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700 ml-auto"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-500',
              green: 'bg-green-500',
              purple: 'bg-purple-500',
              orange: 'bg-orange-500'
            };

            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`${colorClasses[stat.color]} rounded-lg p-3 transition-all duration-300 hover:scale-110 hover:shadow-md`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaCoins className="w-4 h-4" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaHistory className="w-4 h-4" />
                <span>Transaction History</span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Pin Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 rounded-full p-4">
                        <FaCoins className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Available Pins</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          You currently have {balance} pins available for your transactions
                        </p>
                        <div className="mt-3 text-2xl font-bold text-blue-600">
                          {balance} Pins
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 rounded-full p-4">
                        <FaHistory className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Transaction History</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          View your pin allocation history and transactions
                        </p>
                        <button 
                          onClick={() => setActiveTab('activity')}
                          className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                        >
                          View History
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Information */}
                <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">How to Use Your Pins</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Pins are used for creating insurance certificates and policies</li>
                    <li>• Each certificate creation requires 1 pin</li>
                    <li>• Your pins are automatically deducted when you create certificates</li>
                    <li>• Contact your broker if you need more pins</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Pin Transaction History</h3>
                  <div className="relative">
                    <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by broker name or remarks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {filteredActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <FaHistory className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'No matching transactions found' : 'No Transactions Yet'}
                    </h4>
                    <p className="text-gray-500">
                      {searchTerm 
                        ? 'Try adjusting your search terms' 
                        : 'You haven\'t received any pins from brokers yet.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredActivities.map((activity, index) => (
                      <div key={activity.allocationId || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="bg-green-100 rounded-full p-3">
                            <FaArrowDown className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900">
                                Received from {activity.fromUserName || activity.fromUserId || 'Broker'}
                              </h4>
                              {activity.status && getStatusBadge(activity.status)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {activity.remarks || 'No remarks'} • {formatDate(activity.allocatedDate)}
                            </p>
                            {activity.allocationId && (
                              <p className="text-xs text-gray-400 mt-1">
                                Transaction ID: {activity.allocationId}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">+{activity.pinAmount} pins</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(activity.allocatedDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPinDashboard;