import React, { useState, useEffect } from "react";
import { FaCoins, FaUser, FaSearch, FaTimes, FaBuilding } from "react-icons/fa";
import PinService from "../../services/PinServices";
import UserService from "../../services/UserServices";

const AllocatePinsModal = ({ onAllocationSuccess }) => {
  const [selectedBroker, setSelectedBroker] = useState("");
  const [pinAmount, setPinAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [brokers, setBrokers] = useState([]);
  const [fetchingBrokers, setFetchingBrokers] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch brokers when modal opens
  useEffect(() => {
    if (showModal) {
      fetchBrokers();
    }
  }, [showModal]);

  const fetchBrokers = async () => {
    try {
      setFetchingBrokers(true);
      setError("");

      const brokersData = await UserService.getBrokers();

      const formattedBrokers = Array.isArray(brokersData)
        ? brokersData.map((broker) => ({
            userId: broker.brokerId,
            fullName: broker.brokerName,
            email: broker.email,
            mobilePhone: broker.mobilePhone,
            companyId: broker.insCompanyId,
            address: broker.address,
          }))
        : [];

      setBrokers(formattedBrokers);
    } catch (error) {
      console.error("Failed to fetch brokers:", error);
      setError("Failed to load brokers. Please try again.");
      setBrokers([]);
    } finally {
      setFetchingBrokers(false);
    }
  };

  // Filter brokers based on search term
  const filteredBrokers = brokers.filter(
    (broker) =>
      broker.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!selectedBroker || !pinAmount) {
      alert("Please select a broker and enter pin amount");
      return;
    }

    setLoading(true);
    try {
      console.log("Starting allocation with:", {
        brokerId: selectedBroker,
        pinAmount: pinAmount,
        remarks: remarks,
      });

      const result = await PinService.allocatePins(
        selectedBroker,
        pinAmount,
        remarks
      );

      console.log("Allocation successful:", result);

      alert("Pins allocated successfully! Waiting for approval.");
      setSelectedBroker("");
      setPinAmount("");
      setRemarks("");
      setShowModal(false);

      if (onAllocationSuccess) {
        onAllocationSuccess();
      }
    } catch (error) {
      console.error("Allocation failed:", error);
      alert(`Failed to allocate pins: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBroker("");
    setPinAmount("");
    setRemarks("");
    setError("");
    setSearchTerm("");
  };

  const handleBrokerSelect = (brokerId) => {
    setSelectedBroker(brokerId);
    setSearchTerm(""); // Clear search when broker is selected
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Super Agent Pin Allocation
          </h2>
          <p className="text-gray-600 mt-1">
            Allocate pins to super agents (requires administrative approval)
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center space-x-3 shadow-lg hover:shadow-xl"
        >
          <FaCoins className="w-5 h-5" />
          <span>Allocate Pins</span>
        </button>
      </div>

      {/* Allocation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Allocate Pins to Super Agent
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Select a super agent and specify pin allocation details
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {fetchingBrokers ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 font-medium">
                    Loading brokers...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAllocate}>
                  {/* Broker Selection Section */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Select Broker
                    </label>

                    {/* Selected Broker Display */}
                    {selectedBroker ? (
                      <div className="mb-4">
                        <div className="flex items-center justify-between p-4 border border-gray-300 rounded-xl bg-white">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <FaUser className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {
                                  filteredBrokers.find(
                                    (b) => b.userId === selectedBroker
                                  )?.fullName
                                }
                              </p>
                              <p className="text-xs text-gray-600">
                                {
                                  filteredBrokers.find(
                                    (b) => b.userId === selectedBroker
                                  )?.email
                                }
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedBroker(null)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Search Input - Only show when no broker is selected */
                      <div className="relative mb-4">
                        <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search by name, email, or ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    )}

                    {/* Broker List - Only show when no broker is selected */}
                    {!selectedBroker && (
                      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                        {filteredBrokers.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            {searchTerm
                              ? "No brokers match your search"
                              : "No brokers available"}
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {filteredBrokers.map((broker) => (
                              <div
                                key={broker.userId}
                                className="p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50"
                                onClick={() =>
                                  handleBrokerSelect(broker.userId)
                                }
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                      <FaUser className="w-5 h-5 text-white" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {broker.fullName}
                                    </p>
                                    <p className="text-sm text-gray-600 truncate">
                                      {broker.email}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-1">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        <FaBuilding className="w-3 h-3 mr-1" />
                                        {broker.companyId}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {broker.userId}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Allocation Details */}
                  <div className="space-y-6">
                    <div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Pins
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={pinAmount}
                            onChange={(e) => setPinAmount(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter number of pins to allocate"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Remarks (Optional)
                          </label>
                          <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows="3"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                            placeholder="Add allocation notes or purpose..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                      <p className="text-red-700 text-sm font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-8 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold border border-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !selectedBroker || !pinAmount}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Allocating...</span>
                        </>
                      ) : (
                        <>
                          <FaCoins className="w-4 h-4" />
                          <span>Allocate Pins</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllocatePinsModal;
