import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [brokers, setBrokers] = useState([]);
  const [loadingBrokers, setLoadingBrokers] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    mobilePhone: "",
    address: "",
    contactPerson: "",
    insuredName: "",
    brokerID: "",
    submitDate: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Fetch brokers when in registration mode
  useEffect(() => {
    if (isRegistering) {
      fetchBrokers();
    }
  }, [isRegistering]);

  const fetchBrokers = async () => {
    setLoadingBrokers(true);
    try {
      // Try to get all brokers - you might need to adjust this endpoint
      const response = await fetch('https://gibsbrokersapi.newgibsonline.com/api/Brokers', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });

      if (response.ok) {
        const brokersData = await response.json();
        setBrokers(brokersData);
      } else {
        // If getting all brokers fails, create a static list or show input field
        console.log("Could not fetch brokers list, using empty array");
        setBrokers([]);
      }
    } catch (err) {
      console.error("Error fetching brokers:", err);
      setBrokers([]);
    } finally {
      setLoadingBrokers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  // Your existing login function
  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Attempting login with:", formData.username);
      
      const result = await login({
        username: formData.username,
        password: formData.password,
      });

      console.log("Login result:", result);

      if (result.success) {
        console.log("User role detected:", result.user.role);
        console.log("Is admin:", result.user.isAdmin);
        
        if (result.user.isAdmin) {
          console.log("Redirecting to admin dashboard");
          navigate('/admin/dashboard');
        } else {
          const userRole = result.user.role?.toLowerCase().trim();
          
          const dashboardPaths = {
            broker: '/brokers/dashboard',
            customer: '/client/dashboard', 
            company: '/company/dashboard',
          };

          const dashboardPath = dashboardPaths[userRole] || dashboardPaths.default;
          console.log(`Redirecting ${userRole} to:`, dashboardPath);
          navigate(dashboardPath);
        }
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // New function to create insured client
  const handleCreateInsuredClient = async () => {
    if (!formData.username || !formData.password || !formData.email || !formData.insuredName || !formData.brokerID) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Creating insured client:", formData);
      
      const registrationData = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        mobilePhone: formData.mobilePhone || "",
        address: formData.address || "",
        contactPerson: formData.contactPerson || "",
        insuredName: formData.insuredName,
        brokerID: formData.brokerID,
        submitDate: new Date().toISOString(),
      };

      console.log("Sending registration data:", registrationData);

      const response = await fetch('https://gibsbrokersapi.newgibsonline.com/api/Auth/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      const responseText = await response.text();
      let result;
      
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", responseText);
        throw new Error(responseText || "Server error");
      }

      if (response.ok) {
        console.log("Customer created successfully:", result);
        setSuccess("Account created successfully! You can now login.");
        
        // Reset form and switch to login
        setFormData({
          username: "",
          password: "",
          email: "",
          mobilePhone: "",
          address: "",
          contactPerson: "",
          insuredName: "",
          brokerID: "",
          submitDate: new Date().toISOString()
        });
        setIsRegistering(false);
      } else {
        if (result.errors) {
          const errorMessages = Object.values(result.errors).flat();
          setError(errorMessages.join(', '));
        } else {
          setError(result.message || "Failed to create account. Please try again.");
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (err.message.includes('BrokerID') && err.message.includes('NULL')) {
        setError("Broker ID is required. Please select a valid Broker ID.");
      } else {
        setError(err.message || "An error occurred during registration. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (isRegistering) {
        handleCreateInsuredClient();
      } else {
        handleLogin();
      }
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setSuccess("");
    setFormData({
      username: "",
      password: "",
      email: "",
      mobilePhone: "",
      address: "",
      contactPerson: "",
      insuredName: "",
      brokerID: "",
      submitDate: new Date().toISOString()
    });
  };


  return (
   <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-8">
  <a href="#" className="flex items-center space-x-2 mb-6">
    <span className="text-3xl font-extrabold text-blue-700">🛡</span>
    <span className="text-xl font-bold text-gray-800">GIBSLIFE BROKERS PORTAL</span>
  </a>

  <div className={`w-full max-w-sm bg-white rounded-lg shadow-md p-6 ${isRegistering ? 'max-w-md' : ''}`}>
    <div className="mb-4 text-center">
      <h1 className="text-xl font-bold text-gray-900">
        {isRegistering ? "Create Account" : "Welcome back to GIBSLIFE Brokers!"}
      </h1>
      <p className="text-xs text-gray-600 mt-1">
        {isRegistering ? "Register as new client" : "Enter your credentials"}
      </p>
    </div>

    <form className="space-y-3">
      <div>
        <label htmlFor="username" className="block text-xs font-medium text-gray-700">
          Username *
        </label>
        <input
          type="text"
          name="username"
          id="username"
          value={formData.username}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter username"
          className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {isRegistering && (
        <div className="space-y-3">
          <div>
            <label htmlFor="insuredName" className="block text-xs font-medium text-gray-700">
              Insured Name *
            </label>
            <input
              type="text"
              name="insuredName"
              id="insuredName"
              value={formData.insuredName}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter insured name"
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter email"
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

         <div>
        <label htmlFor="brokerID" className="block text-xs font-medium text-gray-700">
          Broker ID *
        </label>
        {loadingBrokers ? (
          <div className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100">
            Loading brokers...
          </div>
        ) : brokers.length > 0 ? (
          <select
            name="brokerID"
            id="brokerID"
            value={formData.brokerID}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a broker</option>
            {brokers.map((broker) => (
              <option key={broker.id} value={broker.id}>
                {broker.name || broker.id} {broker.companyName ? `- ${broker.companyName}` : ''}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            name="brokerID"
            id="brokerID"
            value={formData.brokerID}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter broker ID (e.g., 1111)"
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        )}
        <p className="text-xs text-gray-500 mt-1">
          {brokers.length > 0 ? "Select your broker from the list" : "Enter your broker ID"}
        </p>
      </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mobilePhone" className="block text-xs font-medium text-gray-700">
                Mobile
              </label>
              <input
                type="tel"
                name="mobilePhone"
                id="mobilePhone"
                value={formData.mobilePhone}
                onChange={handleInputChange}
                placeholder="Mobile"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="contactPerson" className="block text-xs font-medium text-gray-700">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                id="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                placeholder="Contact"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-xs font-medium text-gray-700">
              Address
            </label>
            <textarea
              name="address"
              id="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter address"
              rows="2"
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-xs font-medium text-gray-700">
          Password *
        </label>
        <div className="relative mt-1">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            value={formData.password}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="••••••••"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="text-green-600 text-xs bg-green-50 p-2 rounded">
          {success}
        </div>
      )}

      {!isRegistering && (
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center">
            <input type="checkbox" className="mr-1" />
            Remember me
          </label>
          <a href="#" className="text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={isRegistering ? handleCreateInsuredClient : handleLogin}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 text-sm rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isRegistering ? "Creating..." : "Signing in..."}
          </span>
        ) : (
          isRegistering ? "Create Account" : "Sign In"
        )}
      </button>
    </form>

    <div className="mt-4 text-center">
      <p className="text-xs text-gray-600">
        {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          onClick={toggleMode}
          className="text-blue-600 hover:underline font-medium"
        >
          {isRegistering ? "Sign in" : "Create account"}
        </button>
      </p>
    </div>
  </div>
</div>
  );
}