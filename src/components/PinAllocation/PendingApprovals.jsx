// src/components/PinAllocation/PendingApprovals.jsx
import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaUser, FaCoins, FaClock, FaSearch, FaBuilding, FaCalendar, FaIdCard } from 'react-icons/fa';
import PinService from '../../services/PinServices';
import UserService from '../../services/UserServices';

// Toast Notification Component (Both green and red)
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? <FaCheck className="w-5 h-5" /> : <FaTimes className="w-5 h-5" />;

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
        <FaTimes className="w-4 h-4" />
      </button>
    </div>
  );
};

const PendingApprovals = ({ onApprovalSuccess }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load both pending requests and brokers in parallel
      const [requests, brokersData] = await Promise.all([
        PinService.getPendingAllocations(),
        UserService.getBrokers().catch(() => []) // Fallback to empty array if service fails
      ]);

      console.log('Raw API response:', requests); // Debug log

      // Transform the API response to match component expectations
      const transformedRequests = Array.isArray(requests) ? requests.map(request => ({
        allocationId: request.allocationId,
        brokerId: request.toUserId, // Map toUserId to brokerId
        pinAmount: request.pinAmount,
        remarks: request.remarks,
        requestedBy: request.fromUserName || request.fromUserId, // Use fromUserName or fromUserId
        requestDate: request.allocatedDate, // Map allocatedDate to requestDate
        status: request.status,
        // Include additional fields from API for display
        fromUserId: request.fromUserId,
        fromUserName: request.fromUserName,
        toUserName: request.toUserName,
        allocatedDate: request.allocatedDate,
        allocatedBy: request.allocatedBy
      })) : [];

      console.log('Transformed requests:', transformedRequests); // Debug log

      setPendingRequests(transformedRequests);
      setBrokers(Array.isArray(brokersData) ? brokersData : []);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      setPendingRequests([]);
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  };

  // Get broker details by brokerId (now using toUserId)
  const getBrokerDetails = (brokerId) => {
    const broker = brokers.find(b => b.brokerId === brokerId || b.userId === brokerId);
    return broker || null;
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

const handleApproval = async (allocationId, isApproved, approvalRemarks) => {
  setApproving(allocationId);
  try {
    await PinService.approveAllocation(allocationId, isApproved, approvalRemarks);
    await loadData();
    
    if (onApprovalSuccess) {
      onApprovalSuccess(isApproved);
    }
    
    // Show appropriate toast based on approval status
    if (isApproved) {
      showToast('Pin allocation approved successfully!', 'success'); // Green
    } else {
      showToast('Pin allocation request rejected successfully!', 'error'); // Red
    }
  } catch (error) {
    console.error('Approval error:', error);
  } finally {
    setApproving(null);
  }
};

  const filteredRequests = pendingRequests.filter(request => {
    const broker = getBrokerDetails(request.brokerId);
    const brokerName = broker?.brokerName || broker?.fullName || request.toUserName || '';
    
    return (
      brokerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.brokerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.toUserName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
          <div className="animate-spin rounded-full h-5 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading pending requests...</p>
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

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Approval Requests</h2>
          <p className="text-gray-600 mt-1">
            Review and manage pin allocation requests requiring approval
          </p>
        </div>
        
        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {filteredRequests.length > 0 && (
            <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium">
              {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} pending
            </div>
          )}
          
          <div className="relative">
            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by broker name, ID, or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-64"
            />
          </div>
        </div>
      </div>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <FaClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No matching requests found' : 'No Pending Requests'}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {searchTerm 
              ? 'Try adjusting your search terms to find pending approval requests.'
              : 'All allocation requests have been processed and approved.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredRequests.map((request) => {
            const broker = getBrokerDetails(request.brokerId);
            const brokerName = broker?.brokerName || broker?.fullName || request.toUserName || 'Broker Information Not Available';
            const brokerEmail = broker?.email || 'Email not available';
            const brokerCompany = broker?.companyId || broker?.insCompanyId || 'Company not specified';

            return (
              <div key={request.allocationId} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <div className="p-6">
                  {/* Header Section */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 shadow-sm">
                        <FaUser className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {brokerName}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          Requested by: {request.requestedBy || request.fromUserId}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <FaIdCard className="w-3 h-3 mr-1" />
                            ID: {request.brokerId}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FaBuilding className="w-3 h-3 mr-1" />
                            {brokerCompany}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Status: {request.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Pin Amount */}
                    <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 min-w-32">
                      <div className="text-2xl font-bold text-blue-600">{request.pinAmount}</div>
                      <div className="text-sm font-medium text-blue-700">Pins Requested</div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Allocation Remarks */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FaCoins className="w-4 h-4 mr-2 text-gray-500" />
                        Allocation Remarks
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {request.remarks || 'No remarks provided'}
                        </p>
                      </div>
                    </div>

                    {/* Request Metadata */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FaCalendar className="w-4 h-4 mr-2 text-gray-500" />
                        Request Details
                      </label>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Requested By:</span>
                          <span className="text-sm text-gray-900 font-semibold">{request.requestedBy || request.fromUserId}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Submission Date:</span>
                          <span className="text-sm text-gray-900 font-semibold">{formatDate(request.requestDate)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-gray-600">Allocation ID:</span>
                          <span className="text-sm text-gray-900 font-semibold">#{request.allocationId}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        const remarks = prompt('Enter approval remarks (optional):');
                        if (remarks !== null) {
                          handleApproval(request.allocationId, true, remarks || '');
                        }
                      }}
                      disabled={approving === request.allocationId}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center space-x-3 shadow-sm hover:shadow-md"
                    >
                      {approving === request.allocationId ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <FaCheck className="w-5 h-5" />
                      )}
                      <span>Approve Allocation</span>
                    </button>

                    <button
                      onClick={() => {
                        const remarks = prompt('Please provide reason for rejection:');
                        if (remarks !== null && remarks.trim()) {
                          handleApproval(request.allocationId, false, remarks);
                        } else if (remarks !== null) {
                          alert('Please provide a reason for rejection.');
                        }
                      }}
                      disabled={approving === request.allocationId}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center space-x-3 shadow-sm hover:shadow-md"
                    >
                      {approving === request.allocationId ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <FaTimes className="w-5 h-5" />
                      )}
                      <span>Reject Request</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;