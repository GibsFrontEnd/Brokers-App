import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateMotorPolicy = () => {
  const [formData, setFormData] = useState({
    certificateNo: 'AUTO',
    insuredName: '',
    email: '',
    address: '',
    transactionDate: new Date().toISOString().split('T')[0],
    vehicleRegNum: '',
    vehicleMake: '',
    engineNum: '',
    vehicleBrand: '',
    startDate: '',
    engineCapacity: '',
    sumInsured: '',
    mobilePhone: '',
    policyNo: '',
    vehicleType: '',
    vehicleColor: '',
    chassisNum: '',
    vehicleYear: '',
    expiryDate: '',
    grossPremium: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('https://gibsbrokersapi.newgibsonline.com/api/MotorPolicies', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 200 || response.status === 201) {
        setMessage('Motor policy created successfully!');
        setIsError(false);
        // Reset form after successful submission
        setFormData({
          certificateNo: 'AUTO',
          insuredName: '',
          email: '',
          address: '',
          transactionDate: new Date().toISOString().split('T')[0],
          vehicleRegNum: '',
          vehicleMake: '',
          engineNum: '',
          vehicleBrand: '',
          startDate: '',
          engineCapacity: '',
          sumInsured: '',
          mobilePhone: '',
          policyNo: '',
          vehicleType: '',
          vehicleColor: '',
          chassisNum: '',
          vehicleYear: '',
          expiryDate: '',
          grossPremium: ''
        });

        // Redirect after success
        setTimeout(() => {
          navigate('/brokers-dashboard/certificates', {
            state: { success: 'Motor policy created successfully!' }
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      setMessage(error.response?.data?.message || 'Failed to create policy. Please try again.');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // Render field function for consistent styling
  const renderField = (label, name, type = 'text', options = null) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {type === 'select' ? (
          <select
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            required
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            required
            step={type === 'number' ? '0.01' : undefined}
            min={name === 'vehicleYear' ? '1900' : undefined}
            max={name === 'vehicleYear' ? '2030' : undefined}
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-8" style={{ minWidth: "1200px" }}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Motor Third Party Insurance
            </h1>
            <p className="text-gray-600">
              Create a new motor insurance policy
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success Display */}
      {message && (
        <div className="mb-6">
          <div className={`${isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'} border px-6 py-4 rounded-lg`}>
            <div className="flex items-center">
              {isError ? (
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <span>{message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Policy Details Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Policy Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Certificate No
                </label>
                <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm font-semibold text-blue-900">
                  {formData.certificateNo}
                </div>
              </div>

              {renderField("Policy Number", "policyNo")}
              {renderField("Transaction Date", "transactionDate", "date")}
              {renderField("Start Date", "startDate", "date")}
              {renderField("Expiry Date", "expiryDate", "date")}
            </div>
          </div>

          <div className="border-t border-gray-200 my-8"></div>

          {/* Insured Information Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Insured Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderField("Insured Name", "insuredName")}
              {renderField("Email Address", "email", "email")}
              {renderField("Mobile Phone", "mobilePhone", "tel")}
              {renderField("Address", "address")}
            </div>
          </div>

          <div className="border-t border-gray-200 my-8"></div>

          {/* Vehicle Information Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Vehicle Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderField("Vehicle Registration Number", "vehicleRegNum")}
              {renderField("Vehicle Make", "vehicleMake")}
              {renderField("Vehicle Brand", "vehicleBrand")}
              {renderField("Vehicle Type", "vehicleType", "select", [
                { value: "", label: "Select Vehicle Type" },
                { value: "Saloon Car", label: "Saloon Car" },
                { value: "SUV", label: "SUV" },
                { value: "Truck", label: "Truck" },
                { value: "Motorcycle", label: "Motorcycle" },
                { value: "Bus", label: "Bus" },
                { value: "Van", label: "Van" },
                { value: "Pickup", label: "Pickup" }
              ])}
              {renderField("Vehicle Color", "vehicleColor")}
              {renderField("Vehicle Year", "vehicleYear", "number")}
              {renderField("Chassis Number", "chassisNum")}
              {renderField("Engine Number", "engineNum")}
              {renderField("Engine Capacity", "engineCapacity")}
            </div>
          </div>

          <div className="border-t border-gray-200 my-8"></div>

          {/* Insurance Information Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Insurance Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderField("Sum Insured", "sumInsured", "number")}
              {renderField("Gross Premium", "grossPremium", "number")}
              
              {/* Premium Calculation Display */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Premium Calculation
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-900">
                    {formData.sumInsured && formData.grossPremium 
                      ? `₦${(parseFloat(formData.sumInsured) * parseFloat(formData.grossPremium) / 100).toFixed(2)}`
                      : 'Calculate premium'
                    }
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      // Simple premium calculation logic
                      if (formData.sumInsured) {
                        const premium = parseFloat(formData.sumInsured) * 0.05; // 5% for example
                        setFormData(prev => ({ ...prev, grossPremium: premium.toFixed(2) }));
                      }
                    }}
                  >
                    Compute
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 my-8"></div>

          {/* Additional Information Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Additional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* You can add additional fields here if needed */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Coverage Type
                </label>
                <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm font-semibold text-green-900">
                  Third Party Liability
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Policy Status
                </label>
                <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm font-semibold text-yellow-900">
                  Pending
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/brokers-dashboard/certificates')}
                className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Cancel
              </button>
              
              <button 
                type="submit" 
                disabled={loading}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    SUBMIT POLICY
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMotorPolicy;