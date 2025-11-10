import React, { useState, useEffect } from 'react';
import { FaCoins, FaShare, FaHistory, FaUsers, FaArrowUp, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import PinService from '../../services/PinServices';
import UserService from '../../services/UserServices';

const BrokerPinDashboard = () => {
  const [balance, setBalance] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [clients, setClients] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [pinAmount, setPinAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Added missing state

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load data individually instead of using Promise.all
      // This way if one fails, others can still succeed
      
      // Load balance
      try {
        const balanceData = await PinService.getBalance();
        setBalance(balanceData.balance || balanceData.availablePins || 0);
      } catch (balanceError) {
        console.warn('Failed to load balance:', balanceError);
        setBalance(150); // Fallback
      }
      
      // Load recent activity
      try {
        const activityData = await PinService.getMyAllocations();
        setRecentActivity(Array.isArray(activityData) ? activityData : []);
      } catch (activityError) {
        console.warn('Failed to load activity:', activityError);
        setRecentActivity([]); // Fallback
      }
      
      // Load clients
      try {
        const clientsData = await UserService.getClients();
        const formattedClients = Array.isArray(clientsData) ? clientsData.map(client => ({
          userId: client.insuredId || client.userId,
          fullName: client.insuredName || client.fullName,
          email: client.email,
          mobilePhone: client.mobilePhone,
          address: client.address
        })) : [];
        
        setClients(formattedClients);
      } catch (clientsError) {
        console.warn('Failed to load clients:', clientsError);
        setClients([]); // Fallback
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSharePins = async (e) => {
    e.preventDefault();
    if (!selectedClient || !pinAmount) {
      alert('Please select a client and enter pin amount');
      return;
    }

    if (parseInt(pinAmount) > balance) {
      alert('Insufficient pin balance!');
      return;
    }

    setSharing(true);
    setError('');
    try {
      await PinService.sharePins(selectedClient, pinAmount, remarks);
      
      alert('Pins shared successfully with client!');
      setSelectedClient('');
      setPinAmount('');
      setRemarks('');
      setShowShareModal(false);
      
      // Reload data to get updated balance and activity
      await loadDashboardData();
      
    } catch (error) {
      const errorMessage = error.message || 'Failed to share pins. Please try again.';
      setError(errorMessage);
      alert(`Failed to share pins: ${errorMessage}`);
    } finally {
      setSharing(false);
    }
  };

  // Filter activities based on search term
  const filteredActivities = recentActivity.filter(activity =>
    activity.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.clientId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      title: 'Available Pins',
      value: balance,
      icon: FaCoins,
      color: 'blue',
      description: 'Pins ready to share'
    },
    {
      title: 'Total Shared',
      value: recentActivity.reduce((sum, activity) => sum + (parseInt(activity.pinAmount) || 0), 0),
      icon: FaShare,
      color: 'green',
      description: 'All time shared pins'
    },
    {
      title: 'Clients Served',
      value: new Set(recentActivity.map(activity => activity.clientId)).size,
      icon: FaUsers,
      color: 'purple',
      description: 'Unique clients'
    },
 
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Completed': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Failed': 'bg-red-100 text-red-800',
      'Approved': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        statusConfig[status] || 'bg-gray-100 text-gray-800'
      }`}>
        {status}
      </span>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Pin Management</h1>
          <p className="text-gray-600 mt-1">Manage your pins and track sharing activities</p>
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
                <span>Recent Activity</span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <button
                    onClick={() => setShowShareModal(true)}
                    disabled={balance === 0}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center space-x-2"
                  >
                    <FaShare className="w-4 h-4" />
                    <span>Share Pins</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 rounded-full p-4">
                        <FaShare className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Share Pins</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Transfer pins to your clients for their transactions
                        </p>
                        <button 
                          onClick={() => setShowShareModal(true)}
                          disabled={balance === 0}
                          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                        >
                          {balance === 0 ? 'No Pins Available' : 'Share Now'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 rounded-full p-4">
                        <FaHistory className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">View History</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Check your pin sharing history and transactions
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
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Sharing Activity</h3>
                  <div className="relative">
                    <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search activity..."
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
                      {searchTerm ? 'No matching activities found' : 'No Activity Yet'}
                    </h4>
                    <p className="text-gray-500">
                      {searchTerm 
                        ? 'Try adjusting your search terms' 
                        : 'You haven\'t shared any pins with clients yet.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredActivities.map((activity, index) => (
                      <div key={activity.allocationId || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="bg-green-100 rounded-full p-3">
                            <FaArrowUp className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900">
                                Shared with {activity.clientName || activity.clientId || 'Client'}
                              </h4>
                              {activity.status && getStatusBadge(activity.status)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {activity.remarks || 'No remarks'} • {new Date(activity.shareDate || activity.createdDate || Date.now()).toLocaleDateString()}
                            </p>
                            {activity.allocationId && (
                              <p className="text-xs text-gray-400 mt-1">
                                ID: {activity.allocationId}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">+{activity.pinAmount} pins</div>
                          <div className="text-sm text-gray-500">
                            {activity.status === 'Pending' ? 'Pending' : 'Completed'}
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Share Pins with Client
            </h3>
            
            <form onSubmit={handleSharePins}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Client
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a client</option>
                    {clients.map(client => (
                      <option key={client.userId} value={client.userId}>
                        {client.fullName} - {client.email}
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No clients available. Please contact administrator.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Pins to Share
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={balance}
                    value={pinAmount}
                    onChange={(e) => setPinAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Max: ${balance} pins`}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your available balance: {balance} pins
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter sharing remarks..."
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    setError('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sharing || !pinAmount || !selectedClient || parseInt(pinAmount) > balance || clients.length === 0}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  {sharing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FaShare className="w-4 h-4" />
                  )}
                  <span>Share Pins</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerPinDashboard;