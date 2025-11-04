import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiRefreshCw, FiX, FiUsers, FiKey } from 'react-icons/fi';

const RolesTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleDetails, setShowRoleDetails] = useState(false);
  const rolesPerPage = 10;

  // Fetch roles from API
  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found.');
      }

      const response = await fetch('https://gibsbrokersapi.newgibsonline.com/api/Auth/roles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRoles(data);
      console.log('Roles loaded successfully:', data);
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // View role details
  const handleViewRole = (role) => {
    setSelectedRole(role);
    setShowRoleDetails(true);
  };

  // Filter roles based on search query
  const filteredRoles = roles.filter(role =>
    role.roleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredRoles.length / rolesPerPage);
  const currentRoles = filteredRoles.slice(
    (currentPage - 1) * rolesPerPage,
    currentPage * rolesPerPage
  );

  // Close role details modal
  const closeRoleDetails = () => {
    setShowRoleDetails(false);
    setSelectedRole(null);
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
          <button onClick={() => setError(null)} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          <button onClick={() => setSuccess(null)} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Search by role name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2 flex-wrap gap-2">
          <button 
            className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg"
            onClick={fetchRoles}
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Roles Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-4 py-3">S/N</th>
                  <th scope="col" className="px-4 py-3">Role Name</th>
                  <th scope="col" className="px-4 py-3">Description</th>
                  <th scope="col" className="px-4 py-3">Permissions Count</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Created Date</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRoles.length > 0 ? (
                  currentRoles.map((role, index) => (
                    <tr key={role.roleID} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{(currentPage - 1) * rolesPerPage + index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center">
                          <FiKey className="mr-2 text-blue-500" size={16} />
                          {role.roleName}
                        </div>
                      </td>
                      <td className="px-4 py-3">{role.description}</td>
                      <td className="px-4 py-3">
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {role.permissions?.length || 0} permissions
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {role.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(role.createdDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleViewRole(role)}
                            title="View Role Details"
                          >
                            <FiEye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      {searchQuery ? 'No roles match your search' : 'No roles found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer with Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border-t border-gray-200">
            <span className="text-sm text-gray-700 mb-4 sm:mb-0">
              Showing <span className="font-medium">{(currentPage - 1) * rolesPerPage + 1}</span> to <span className="font-medium">
                {Math.min(currentPage * rolesPerPage, filteredRoles.length)}
              </span> of <span className="font-medium">{filteredRoles.length}</span> Roles
            </span>
            <div className="flex space-x-2">
              <button 
                className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button 
                className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Details Modal */}
      {showRoleDetails && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                Role Details: {selectedRole.roleName}
              </h3>
              <button onClick={closeRoleDetails} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Role Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium mb-3 text-gray-800">Role Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Role Name:</span>
                      <p className="text-gray-900">{selectedRole.roleName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Description:</span>
                      <p className="text-gray-900">{selectedRole.description}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedRole.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedRole.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Created Date:</span>
                      <p className="text-gray-900">{new Date(selectedRole.createdDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Permissions Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium mb-3 text-gray-800">Permissions Summary</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Total Permissions:</span>
                      <p className="text-gray-900">{selectedRole.permissions?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Modules:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {[...new Set(selectedRole.permissions?.map(p => p.module))].map(module => (
                          <span key={module} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                            {module}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions List */}
              <div>
                <h4 className="text-lg font-medium mb-4 text-gray-800">Assigned Permissions</h4>
                {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                          <th className="px-4 py-3">Permission Name</th>
                          <th className="px-4 py-3">Module</th>
                          <th className="px-4 py-3">Action</th>
                          <th className="px-4 py-3">Endpoint</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRole.permissions.map((permission, index) => (
                          <tr key={permission.permissionID || index} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {permission.permissionName}
                            </td>
                            <td className="px-4 py-3">
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                {permission.module}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                permission.action === 'Create' ? 'bg-green-100 text-green-800' :
                                permission.action === 'Read' ? 'bg-blue-100 text-blue-800' :
                                permission.action === 'Update' ? 'bg-yellow-100 text-yellow-800' :
                                permission.action === 'Delete' ? 'bg-red-100 text-red-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {permission.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {permission.endpoint}
                            </td>
                            <td className="px-4 py-3">
                              {permission.isActive ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Inactive
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiKey size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No permissions assigned to this role.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesTab;