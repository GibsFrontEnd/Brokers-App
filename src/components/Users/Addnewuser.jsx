import React, { useState } from 'react';
import { FiX, FiUserPlus, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';

const Addnewuser = ({ isOpen, onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    mobilePhone: '',
    address: '',
    contactPerson: '',
    submitDate: new Date().toISOString(),
    tag: '',
    remarks: '',
    a1: 0,
    a2: 0,
    roleIds: [0],
    title: '',
    insured_name: '',
    location: '',
    identification: '',
    id_number: '',
    phone: '',
    occupation: '',
    field01: '',
    field02: '',
    field03: '',
    field04: '',
    field05: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = 'https://gibsbrokersapi.newgibsonline.com/api/Auth/create-system-user';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e, fieldName) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      // For a1 and a2 fields, ensure they're numbers (not strings)
      if (fieldName === 'a1' || fieldName === 'a2') {
        // Convert to number and ensure it's not too large
        const numValue = value === '' ? 0 : parseInt(value, 10);
        setFormData(prev => ({
          ...prev,
          [fieldName]: numValue
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [fieldName]: value
        }));
      }
    }
  };

  const handleRoleIdsChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and commas
    if (value === '' || /^[\d,]*$/.test(value)) {
      const roleIdsArray = value.split(',')
        .map(id => id.trim())
        .filter(id => id !== '')
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id));
      
      // Ensure at least one role ID (default to [0] if empty)
      const finalRoleIds = roleIdsArray.length > 0 ? roleIdsArray : [0];
      
      setFormData(prev => ({
        ...prev,
        roleIds: finalRoleIds
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found.');
      }

      // Prepare the data to send
      const dataToSend = {
        ...formData,
        // Ensure a1 and a2 are numbers
        a1: typeof formData.a1 === 'string' ? parseFloat(formData.a1) || 0 : formData.a1,
        a2: typeof formData.a2 === 'string' ? parseFloat(formData.a2) || 0 : formData.a2,
        // Ensure roleIds is always an array with at least one element
        roleIds: formData.roleIds.length > 0 ? formData.roleIds : [0]
      };

      console.log('Sending data:', dataToSend); // For debugging

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          console.log('Could not parse error as JSON');
        }
        throw new Error(
          errorData.message ||
          errorData.error ||
          errorText ||
          `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log('User created successfully:', result);
      
      setSuccess(true);
      if (onUserAdded) {
        onUserAdded(result);
      }
      
      // Reset form after successful creation
      setTimeout(() => {
        setFormData({
          username: '',
          password: '',
          email: '',
          mobilePhone: '',
          address: '',
          contactPerson: '',
          submitDate: new Date().toISOString(),
          tag: '',
          remarks: '',
          a1: 0,
          a2: 0,
          roleIds: [0],
          title: '',
          insured_name: '',
          location: '',
          identification: '',
          id_number: '',
          phone: '',
          occupation: '',
          field01: '',
          field02: '',
          field03: '',
          field04: '',
          field05: ''
        });
        setShowPassword(false);
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.message);
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center">
            <FiUserPlus className="text-blue-600 mr-3" size={24} />
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                Create New System User
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Fill in the required fields to create a new user account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="font-bold">
                  ×
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <div className="flex items-center">
                <FiCheck className="mr-2" />
                <span>User created successfully! The modal will close shortly.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Required Fields */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">
                  Required Information
                </h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {formData.password && (
                  <p className="text-xs text-gray-500 mt-1">
                    Password strength: {formData.password.length >= 8 ? 'Strong' : 'Weak'} ({formData.password.length} characters)
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              {/* Basic Information */}
              <div className="md:col-span-2 mt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">
                  Basic Information
                </h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Mr, Mrs, Dr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="mobilePhone"
                  value={formData.mobilePhone}
                  onChange={(e) => handleNumberChange(e, 'mobilePhone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2348000000000"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person Phone
                </label>
                <input
                  type="tel"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => handleNumberChange(e, 'contactPerson')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2348000000000"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role IDs
                </label>
                <input
                  type="text"
                  name="roleIds"
                  value={formData.roleIds.join(', ')}
                  onChange={handleRoleIdsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0, 1, 2"
                  inputMode="numeric"
                  required
                />
                {formData.roleIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.roleIds.map((roleId, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Role ID: {roleId}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full address"
                />
              </div>

              {/* Additional Fields */}
              <div className="md:col-span-2 mt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">
                  Additional Information
                </h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insured Name
                </label>
                <input
                  type="text"
                  name="insured_name"
                  value={formData.insured_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Name for insurance purposes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Professional occupation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identification Type
                </label>
                <input
                  type="text"
                  name="identification"
                  value={formData.identification}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Passport, Driver's License"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  name="id_number"
                  value={formData.id_number}
                onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Identification number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  A1
                </label>
                <input
                  type="text"
                  name="a1"
                  value={formData.a1}
                  onChange={(e) => handleNumberChange(e, 'a1')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  inputMode="numeric"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">Numbers only (max 10 digits)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  A2
                </label>
                <input
                  type="text"
                  name="a2"
                  value={formData.a2}
                  onChange={(e) => handleNumberChange(e, 'a2')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  inputMode="numeric"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">Numbers only (max 10 digits)</p>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="User location"
                />
              </div>

              {/* Optional Fields */}
              <div className="md:col-span-2 mt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">
                  Optional Fields
                </h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag
                </label>
                <input
                  type="text"
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="User tag"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional remarks or notes"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.username || !formData.password || !formData.email || formData.roleIds.length === 0}
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiUserPlus className="mr-2" />
                    Create User
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <div className="text-sm text-gray-600">
            <p className="flex items-center">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Fields marked with * are required
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div className="flex items-center">
                <FiEye className="text-gray-400 mr-2" size={14} />
                <span>Click the eye icon to show/hide password</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-blue-100 rounded mr-2"></span>
                <span>Number fields accept only numeric input</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Addnewuser;