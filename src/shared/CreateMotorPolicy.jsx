import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateMotorPolicy = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const getBrokerId = () => {
    try {
      const encryptedUser = localStorage.getItem("user");
      if (encryptedUser) {
        const user = JSON.parse(encryptedUser);
        return user.userId || user.id || "";
      }
    } catch (error) {
      console.error("Error getting broker ID:", error);
    }
    return "";
  };

  const [formData, setFormData] = useState({
    certNo: "",
    insuredName: "",
    email: "",
    address: "",
    mobileNo: "",
    transDate: new Date().toISOString().split("T")[0],
    policyNo: "",
    vehicleRegNum: "",
    vehicleType: "",
    vehicleMake: "",
    vehicleColor: "",
    engineNum: "",
    chassisNum: "",
    vehicleBrand: "",
    vehicleYear: "",
    startDate: "",
    expiryDate: "",
    engineCapacity: "",
    insuredValue: "",
    grossPremium: "",
    refDNCNNo: "",
    brokerId: getBrokerId(),
    rate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const requestBody = {
        certNo: formData.certNo,
        insuredName: formData.insuredName,
        email: formData.email,
        address: formData.address,
        mobileNo: formData.mobileNo,
        transDate: new Date(formData.transDate).toISOString(),
        policyNo: formData.policyNo,
        vehicleRegNum: formData.vehicleRegNum,
        vehicleType: formData.vehicleType,
        vehicleMake: formData.vehicleMake,
        vehicleColor: formData.vehicleColor,
        engineNum: formData.engineNum,
        chassisNum: formData.chassisNum,
        vehicleBrand: formData.vehicleBrand,
        vehicleYear: formData.vehicleYear,
        startDate: new Date(formData.startDate).toISOString(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
        engineCapacity: formData.engineCapacity,
        insuredValue: parseFloat(formData.insuredValue) || 0,
        grossPremium: parseFloat(formData.grossPremium) || 0,
        refDNCNNo: formData.refDNCNNo,
        brokerId: formData.brokerId,
        rate: parseFloat(formData.rate) || 0,
      };

      const response = await axios.post(
        "https://gibsbrokersapi.newgibsonline.com/api/Certificate/motor",
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setMessage("Motor policy created successfully!");
        setIsError(false);

        // Show alert before redirecting
        alert("Motor Policy Created Successfully!");

        setTimeout(() => {
          navigate("/brokers/certificates", {
            state: { refresh: true },
          });
        }, 500);
      }
    } catch (error) {
      console.error("Error creating policy:", error);
      setMessage(
        error.response?.data?.message ||
          "Failed to create policy. Please try again."
      );
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-4"
          >
            ← Go Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Motor Insurance Policy
          </h1>
          <p className="text-gray-600">
            Fill in the details to create a new motor third party insurance
            certificate
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <div
              className={`${
                isError
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-green-50 border-green-200 text-green-700"
              } border px-6 py-4 rounded-lg`}
            >
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Certificate & Policy Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Certificate Number (Auto-filled)
                  </label>
                  <input
                    type="text"
                    name="certNo"
                    value={formData.certNo}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-sm cursor-not-allowed"
                    disabled
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Policy Number (Auto-filled)
                  </label>
                  <input
                    type="text"
                    name="policyNo"
                    value={formData.policyNo}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-sm cursor-not-allowed"
                    disabled
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Reference DN/CN Number
                  </label>
                  <input
                    type="text"
                    name="refDNCNNo"
                    value={formData.refDNCNNo}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Transaction Date (Auto-filled)
                  </label>
                  <input
                    type="date"
                    name="transDate"
                    value={formData.transDate}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-sm cursor-not-allowed"
                    disabled
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Broker ID (Auto-filled)
                  </label>
                  <input
                    type="text"
                    name="brokerId"
                    value={formData.brokerId}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-sm cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Insured Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Insured Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="insuredName"
                    value={formData.insuredName}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobileNo"
                    value={formData.mobileNo}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Vehicle Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle Registration Number{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleRegNum"
                    value={formData.vehicleRegNum}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle Make <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle Brand <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleBrand"
                    value={formData.vehicleBrand}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle Color <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleColor"
                    value={formData.vehicleColor}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleYear"
                    value={formData.vehicleYear}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Chassis Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="chassisNum"
                    value={formData.chassisNum}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Engine Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="engineNum"
                    value={formData.engineNum}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Engine Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="engineCapacity"
                    value={formData.engineCapacity}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Insurance Financial Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Insured Value (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="insuredValue"
                    value={formData.insuredValue}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Gross Premium (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="grossPremium"
                    value={formData.grossPremium}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Rate (%)
                  </label>
                  <input
                    type="number"
                    name="rate"
                    value={formData.rate}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Policy..." : "Create Motor Policy"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateMotorPolicy;
