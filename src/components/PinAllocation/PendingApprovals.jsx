// src/components/PinAllocation/PendingApprovals.jsx
import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaUser, FaCoins, FaClock, FaSearch } from 'react-icons/fa';
import PinService from '../../services/PinServices';

const PendingApprovals = ({ onApprovalSuccess }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const requests = await PinService.getPendingAllocations();
      setPendingRequests(Array.isArray(requests) ? requests : []);
    } catch (error) {
      console.error('Failed to load pending requests:', error);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (allocationId, isApproved, approvalRemarks) => {
    setApproving(allocationId);
    try {
      await PinService.approveAllocation(allocationId, isApproved, approvalRemarks);
      await loadPendingRequests();
      onApprovalSuccess();
      alert(`Request ${isApproved ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      alert(`Failed to ${isApproved ? 'approve' : 'reject'} request: ${error.message}`);
    } finally {
      setApproving(null);
    }
  };

  const filteredRequests = pendingRequests.filter(request =>
    request.brokerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.brokerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pending Approval Requests</h2>
          <p className="text-gray-600 mt-1">
            Review and approve/reject pin allocation requests
          </p>
        </div>
        <div className="relative">
          <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <FaClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
          <p className="text-gray-500">All allocation requests have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request.allocationId} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 rounded-full p-3">
                    <FaUser className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{request.brokerName || 'Unknown Broker'}</h3>
                    <p className="text-sm text-gray-500">Broker ID: {request.brokerId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{request.pinAmount} Pins</div>
                  <div className="text-sm text-gray-500">Requested</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Remarks</label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{request.remarks}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Details</label>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Requested by: {request.requestedBy}</p>
                    <p>Date: {new Date(request.requestDate).toLocaleDateString()}</p>
                    <p>Allocation ID: {request.allocationId}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    const remarks = prompt('Enter approval remarks:');
                    if (remarks !== null) {
                      handleApproval(request.allocationId, true, remarks);
                    }
                  }}
                  disabled={approving === request.allocationId}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  {approving === request.allocationId ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FaCheck className="w-4 h-4" />
                  )}
                  <span>Approve</span>
                </button>

                <button
                  onClick={() => {
                    const remarks = prompt('Enter rejection reason:');
                    if (remarks !== null) {
                      handleApproval(request.allocationId, false, remarks);
                    }
                  }}
                  disabled={approving === request.allocationId}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  {approving === request.allocationId ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FaTimes className="w-4 h-4" />
                  )}
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;