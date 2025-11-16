import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const MakePayment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Get payment details from navigation state
  const amount = state?.amount || "24,000.00";
  const [paymentDetails, setPaymentDetails] = useState({
    name: "Intteck Global Systems",
    email: "oseniwasiu@yahoo.com",
    phone: "08023140962",
    paymentMethod: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  /* 
  BACKEND IMPLEMENTATION: Process Payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/payments/process', {
        amount: parseFloat(amount.replace(/,/g, '')),
        currency: 'NGN',
        customerDetails: {
          name: paymentDetails.name,
          email: paymentDetails.email,
          phone: paymentDetails.phone
        },
        paymentMethod: paymentDetails.paymentMethod,
        cardDetails: {
          number: paymentDetails.cardNumber,
          expiry: paymentDetails.expiryDate,
          cvv: paymentDetails.cvv
        }
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSuccess(true);
        // Optionally redirect after successful payment
        setTimeout(() => navigate('/client-dashboard'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };
  */

  // Mock submit handler for frontend development
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      console.log("Payment processed (mock)", {
        amount,
        paymentDetails,
      });
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="p-8" style={{ minWidth: "1200px" }}>
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Make Payment
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Complete your payment for the selected proposal
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3 text-sm text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Welcome back, Sub Agent</span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              CN
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-4 sm:px-6 py-3 sm:py-4 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-sm sm:text-base">{error}</span>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 text-green-700 px-4 sm:px-6 py-3 sm:py-4 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <span className="font-medium text-sm sm:text-base">
                Payment processed successfully!
              </span>
              <p className="text-xs sm:text-sm mt-1 text-green-600">
                You will be redirected to the dashboard shortly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      {!success && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Information
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Enter your payment details to complete the transaction
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            {/* Payment Amount */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                <span className="text-sm sm:text-base">Payment Amount</span>
              </h3>
              <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm font-medium text-green-800">
                    Total Amount:
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-green-600">
                    ₦{amount}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-sm sm:text-base">Customer Details</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm sm:text-base">
                    {paymentDetails.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm sm:text-base break-all">
                    {paymentDetails.email}
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm sm:text-base">
                    {paymentDetails.phone}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <span className="text-sm sm:text-base">Payment Method</span>
              </h3>
              <select
                name="paymentMethod"
                value={paymentDetails.paymentMethod}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                required
              >
                <option value="">Select Payment Method</option>
                <option value="card">Credit/Debit Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="ussd">USSD</option>
              </select>
            </div>

            {/* Card Details */}
            {paymentDetails.paymentMethod === "card" && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span className="text-sm sm:text-base">Card Details</span>
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={paymentDetails.cardNumber}
                      onChange={handleChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={paymentDetails.expiryDate}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={paymentDetails.cvv}
                      onChange={handleChange}
                      placeholder="123"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>

                {/* Security Notice */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <div>
                      <p className="text-xs sm:text-sm text-blue-800 font-medium">
                        Secure Payment
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Your payment information is encrypted and secure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Information */}
            {paymentDetails.paymentMethod === "bank" && (
              <div className="mb-6 sm:mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      Bank Transfer Instructions
                    </h4>
                    <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                      You will be provided with bank account details after
                      clicking Submit Payment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {paymentDetails.paymentMethod === "ussd" && (
              <div className="mb-6 sm:mb-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-purple-800">
                      USSD Payment
                    </h4>
                    <p className="text-xs sm:text-sm text-purple-700 mt-1">
                      You will receive a USSD code to dial on your mobile phone
                      after clicking Submit Payment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 sm:pt-6 border-t border-gray-200 gap-4">
              <button
                type="button"
                onClick={() => navigate("/client-dashboard")}
                className="inline-flex items-center justify-center sm:justify-start px-4 sm:px-6 py-2 sm:py-3 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors text-sm sm:text-base"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Go back
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center justify-center px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm sm:text-base ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                {loading ? "Processing..." : "Submit Payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success Actions */}
      {success && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Payment Successful!
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Your payment of ₦{amount} has been processed successfully.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => navigate("/client-dashboard")}
                className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MakePayment;
