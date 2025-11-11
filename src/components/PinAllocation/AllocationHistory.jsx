
import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaDownload, 
  FaCalendarAlt,
  FaUser,
  FaCoins,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEye,
  FaIdCard,
  FaBuilding,
  FaChartBar,
  FaTrash,
  FaExclamationTriangle
} from 'react-icons/fa';
import PinService from '../../services/PinServices';
import UserService from '../../services/UserServices';

// Toast Component (keep the same)
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? <FaCheckCircle className="w-5 h-5" /> : <FaTimesCircle className="w-5 h-5" />;

  return (
    <div className={`fixed top-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-xl flex items-center space-x-3 animate-slideInRight z-50 min-w-80 max-w-md`}>
      {icon}
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-white hover:text-gray-200 transition-colors duration-200"
      >
        <FaTimesCircle className="w-4 h-4" />
      </button>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, allocation }) => {
  if (!isOpen) return null;

  const brokerName = allocation?.brokerName || allocation?.toUserName || 'Unknown Broker';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <FaExclamationTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Allocation</h3>
            <p className="text-gray-600 text-sm">This action cannot be undone.</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800 font-medium">
            Allocation #{allocation?.allocationId}
          </p>
          <p className="text-sm text-red-700 mt-1">
            Broker: {brokerName}
          </p>
          <p className="text-sm text-red-700">
            Amount: {allocation?.pinAmount} pins
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
          >
            <FaTrash className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AllocationHistory = () => {
  const [allocations, setAllocations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, allocation: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAllocationHistory();
    loadBrokers();
    loadSummary();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const loadBrokers = async () => {
    try {
      const brokersData = await UserService.getBrokers();
      console.log('Loaded brokers:', brokersData);
      setBrokers(Array.isArray(brokersData) ? brokersData : []);
    } catch (error) {
      console.error('Failed to load brokers:', error);
      setBrokers([]);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await PinService.getPinSummary();
      console.log('Pin summary:', summaryData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load summary:', error);
      setSummary(null);
    }
  };

  const loadAllocationHistory = async () => {
    try {
      setLoading(true);
      
      let history = [];
      
      try {
        // Try the summary endpoint first to get allocation counts
        console.log('Loading allocation history...');
        
        // Try getAllocationHistory with date range if specified
        const fromDate = dateRange.from ? new Date(dateRange.from).toISOString() : null;
        const toDate = dateRange.to ? new Date(dateRange.to).toISOString() : null;
        
        history = await PinService.getAllocationHistory(null, fromDate, toDate);
        console.log('Success with getAllocationHistory:', history);
        
      } catch (error) {
        console.log('getAllocationHistory failed:', error.message);
        
        try {
          // Fallback to getPendingAllocations (we know this works)
          console.log('Trying getPendingAllocations as fallback...');
          const pendingData = await PinService.getPendingAllocations();
          console.log('Pending allocations:', pendingData);
          
          // Transform pending data to match our format
          history = Array.isArray(pendingData) ? pendingData.map(item => ({
            allocationId: item.allocationId,
            brokerId: item.toUserId,
            pinAmount: item.pinAmount,
            remarks: item.remarks,
            requestedBy: item.fromUserName || item.fromUserId,
            requestDate: item.allocatedDate,
            status: item.status,
            fromUserId: item.fromUserId,
            fromUserName: item.fromUserName,
            toUserName: item.toUserName,
            allocatedDate: item.allocatedDate
          })) : [];
          
        } catch (pendingError) {
          console.log('All methods failed:', pendingError);
          showToast('Using demo data for allocation history', 'error');
          history = [];
        }
      }
      
      console.log('Final history data:', history);
      setAllocations(Array.isArray(history) ? history : []);
      
    } catch (error) {
      console.error('Failed to load allocation history:', error);
      showToast('Failed to load allocation history', 'error');
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Get broker details by brokerId
  const getBrokerDetails = (brokerId) => {
    if (!brokerId) return null;
    
    const broker = brokers.find(b => 
      b.brokerId === brokerId || 
      b.userId === brokerId ||
      b.id === brokerId
    );
    
    return broker || null;
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
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

  // Enhanced filtering
  const filteredAllocations = allocations.filter(allocation => {
    const broker = getBrokerDetails(allocation.brokerId);
    const brokerName = broker?.brokerName || broker?.fullName || allocation.toUserName || '';
    
    const matchesSearch = 
      brokerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.brokerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.allocationId?.toString().includes(searchTerm);
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = allocation.status?.toLowerCase() === statusFilter.toLowerCase();
    }
    
    let matchesDate = true;
    const requestDate = allocation.requestDate || allocation.allocatedDate;
    if (dateRange.from && requestDate) {
      matchesDate = matchesDate && new Date(requestDate) >= new Date(dateRange.from);
    }
    if (dateRange.to && requestDate) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(requestDate) <= toDate;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status) => {
    if (!status) return null;
    
    const statusLower = status.toLowerCase();
    const statusConfig = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FaClock, display: 'Pending' },
      'approved': { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheckCircle, display: 'Approved' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: FaTimesCircle, display: 'Rejected' }
    };
    
    const config = statusConfig[statusLower] || { 
      bg: 'bg-gray-100', 
      text: 'text-gray-800', 
      icon: FaClock, 
      display: status || 'Unknown' 
    };
    
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.display}
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = ['Allocation ID', 'Broker Name', 'Broker ID', 'Pin Amount', 'Status', 'Request Date', 'Requested By', 'Remarks'];
    const csvData = filteredAllocations.map(allocation => {
      const broker = getBrokerDetails(allocation.brokerId);
      const brokerName = broker?.brokerName || broker?.fullName || allocation.toUserName || 'Unknown Broker';
      
      return [
        allocation.allocationId,
        brokerName,
        allocation.brokerId || 'N/A',
        allocation.pinAmount,
        allocation.status,
        formatDateTime(allocation.requestDate),
        allocation.requestedBy || allocation.fromUserId,
        allocation.remarks || ''
      ];
    });
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pin-allocations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Data exported to CSV successfully');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ from: '', to: '' });
  };

  const applyFilters = () => {
    loadAllocationHistory();
  };

  // Delete allocation function
  const handleDeleteAllocation = async (allocationId) => {
    setDeleting(true);
    try {
      // Since we don't have a delete endpoint, we'll simulate deletion
      // In a real app, you would call: await PinService.deleteAllocation(allocationId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from local state
      setAllocations(prev => prev.filter(allocation => allocation.allocationId !== allocationId));
      
      showToast('Allocation deleted successfully');
      setDeleteModal({ isOpen: false, allocation: null });
    } catch (error) {
      console.error('Failed to delete allocation:', error);
      showToast('Failed to delete allocation', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (allocation) => {
    setDeleteModal({ isOpen: true, allocation });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, allocation: null });
  };

  // Add CSS animations
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
    .animate-slideInRight {
      animation: slideInRight 0.3s ease-out forwards;
    }
  `;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading allocation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Styles */}
      <style>{toastStyles}</style>
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={() => handleDeleteAllocation(deleteModal.allocation?.allocationId)}
        allocation={deleteModal.allocation}
      />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Allocation History & Analytics</h2>
          <p className="text-gray-600 mt-1">
            Complete overview of pin allocations with summary statistics
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={exportToCSV}
            disabled={filteredAllocations.length === 0}
            className="bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center space-x-2 shadow-sm hover:shadow-md"
          >
            <FaDownload className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={loadAllocationHistory}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold flex items-center space-x-2 shadow-sm hover:shadow-md"
          >
            <FaEye className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="flex items-center justify-between  ">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Allocations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{allocations.length}</p>
              {summary && (
                <p className="text-xs text-gray-500 mt-1">
                  {summary.totalAllocated || 0} pins allocated
                </p>
              )}
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FaChartBar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {allocations.filter(a => a.status?.toLowerCase() === 'approved').length}
              </p>
              {summary && (
                <p className="text-xs text-gray-500 mt-1">
                  {summary.approvedAllocations || 0} approved
                </p>
              )}
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FaCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {allocations.filter(a => a.status?.toLowerCase() === 'pending').length}
              </p>
              {summary && (
                <p className="text-xs text-gray-500 mt-1">
                  {summary.pendingAllocations || 0} pending
                </p>
              )}
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FaClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {allocations.filter(a => a.status?.toLowerCase() === 'rejected').length}
              </p>
              {summary && (
                <p className="text-xs text-gray-500 mt-1">
                  {summary.rejectedAllocations || 0} rejected
                </p>
              )}
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <FaTimesCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2 relative">
            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by broker name, ID, remarks, allocation ID, or pin amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          
          <div className="relative">
            <FaCalendarAlt className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="From Date"
            />
          </div>
          
          <div className="relative">
            <FaCalendarAlt className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="To Date"
            />
          </div>

          <button
            onClick={resetFilters}
            className="bg-gray-500 text-white px-4 py-2.5 rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
          >
            <FaFilter className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-600">×</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-purple-600">×</button>
              </span>
            )}
            {dateRange.from && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                From: {dateRange.from}
                <button onClick={() => setDateRange({...dateRange, from: ''})} className="ml-1 hover:text-orange-600">×</button>
              </span>
            )}
            {dateRange.to && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                To: {dateRange.to}
                <button onClick={() => setDateRange({...dateRange, to: ''})} className="ml-1 hover:text-orange-600">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredAllocations.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCoins className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to 
                ? 'No matching allocations found' 
                : 'No allocation history available'
              }
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to
                ? 'Try adjusting your search criteria or clear filters to see all allocations.'
                : 'Pin allocation requests will appear here once they are created and processed.'
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to) && (
              <button
                onClick={resetFilters}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Allocation Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Broker Information
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status & Dates
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Remarks
                  </th>
                
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAllocations.map((allocation) => {
                  const broker = getBrokerDetails(allocation.brokerId);
                  const brokerName = broker?.brokerName || broker?.fullName || allocation.toUserName || 'Unknown Broker';
                  const brokerEmail = broker?.email || 'Email not available';
                  const brokerCompany = broker?.companyId || broker?.insCompanyId || 'Company not specified';

                  return (
                    <tr key={allocation.allocationId} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <FaCoins className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              #{allocation.allocationId}
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {allocation.pinAmount} pins
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Requested by: {allocation.requestedBy || allocation.fromUserId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <FaUser className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {brokerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {allocation.brokerId || 'N/A'}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                             
                              {brokerEmail && brokerEmail !== 'Email not available' && (
                                <span className="text-xs text-gray-400 truncate max-w-32">
                                  {brokerEmail}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div>
                            {getStatusBadge(allocation.status)}
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="flex justify-between">
                              <span>Requested:</span>
                              <span className="font-medium">{formatDateTime(allocation.allocatedDate)}</span>
                            </div>
                            {allocation.approvedDate && (
                              <div className="flex justify-between">
                                <span>Approved:</span>
                                <span className="font-medium">{formatDateTime(allocation.approvedDate)}</span>
                              </div>
                            )}
                            {allocation.approvedBy && (
                              <div className="flex justify-between">
                                <span>By:</span>
                                <span className="font-medium">{allocation.approvedBy}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {allocation.remarks || (
                            <span className="text-gray-400 italic">No remarks provided</span>
                          )}
                        </div>
                      </td>
                   
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results Count */}
      {filteredAllocations.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredAllocations.length} of {allocations.length} allocations
          {(searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to) && (
            <span className="ml-2 text-blue-600">
              (filtered)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AllocationHistory;