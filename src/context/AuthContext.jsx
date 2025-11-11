import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Session timeout duration (5 minutes in milliseconds)
  const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const WARNING_TIME = 1 * 60 * 1000; // Show warning 1 minute before timeout

  // Function to decrypt data from localStorage
  const decryptData = (encryptedData) => {
    if (!encryptedData) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, "your-secret-key");
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedString ? JSON.parse(decryptedString) : null;
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  };

  // Update last activity timestamp
  const updateLastActivity = () => {
    setLastActivity(Date.now());
    // Reset warning when user is active
    if (showTimeoutWarning) {
      setShowTimeoutWarning(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("lastActivity");
    setUser(null);
    setToken(null);
    setShowTimeoutWarning(false);
    return { success: true };
  };

  // Check session timeout
  const checkSessionTimeout = () => {
    if (!token) return;

    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastActivity;
    const timeRemaining = SESSION_TIMEOUT - timeSinceLastActivity;

    // Show warning 1 minute before timeout
    if (timeRemaining <= WARNING_TIME && timeRemaining > 0 && !showTimeoutWarning) {
      setShowTimeoutWarning(true);
    }

    // Logout when timeout reached
    if (timeSinceLastActivity >= SESSION_TIMEOUT) {
      console.log("Session timeout - auto logging out");
      logout();
      // You can also show a notification here
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?timeout=true";
      }
    }
  };

  // Initialize user and token from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem("token");
      const encryptedUser = localStorage.getItem("user");
      const storedLastActivity = localStorage.getItem("lastActivity");

      if (storedToken) {
        setToken(storedToken);
      }

      if (encryptedUser) {
        const decryptedUser = decryptData(encryptedUser);
        if (decryptedUser) {
          setUser(decryptedUser);
        } else {
          // Clear invalid/corrupted data
          logout();
        }
      }

      // Restore last activity time
      if (storedLastActivity) {
        setLastActivity(parseInt(storedLastActivity));
      }
    };

    initializeAuth();
    setLoading(false);
  }, []);

  // Save last activity to localStorage whenever it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("lastActivity", lastActivity.toString());
    }
  }, [lastActivity, token]);

  // Set up activity listeners and timeout checker
  useEffect(() => {
    if (!token) return;

    // Set up interval to check session timeout
    const timeoutInterval = setInterval(checkSessionTimeout, 1000); // Check every second

    // Event listeners for user activity
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
    ];

    const handleActivity = () => {
      updateLastActivity();
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup function
    return () => {
      clearInterval(timeoutInterval);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [token, lastActivity]);

  const login = async ({ username, password, role }) => {
    // Use capital letters for field names as required by the API
    const requestBody = {
      Username: username, // Capital U
      Password: password, // Capital P
      Role: role, // Capital R (if needed)
    };

    console.log("=== LOGIN DEBUG INFO ===");
    console.log("Username:", username);
    console.log("Password length:", password?.length);
    console.log("Role:", role);
    console.log("Full request body:", JSON.stringify(requestBody));

    try {
      const response = await fetch(
        "https://gibsbrokersapi.newgibsonline.com/api/Auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        // Try to get the actual error message from the server
        const errorText = await response.text();
        console.log("Error response body:", errorText);

        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          console.log("Could not parse error as JSON");
        }

        throw new Error(
          errorData.message ||
            errorText ||
            `HTTP error! status: ${response.status}`
        );
      }

      // Parse the successful JSON response
      const responseData = await response.json();
      console.log("Full API response:", responseData);

      // The API returns user data directly, not nested under 'user'
      const authToken = responseData.token;
      const userData = responseData; // The response IS the user data

      // Determine role from server response
      const serverRole =
        (userData.roles && userData.roles[0]?.toLowerCase()) ||
        userData.userType?.toLowerCase() ||
        role?.toLowerCase() ||
        "user"; // fallback to 'user'

      // Check if user is admin (based on backend response or username pattern)
      const isAdmin =
        userData.role === "admin" ||
        userData.isAdmin ||
        serverRole === "admin" ||
        username.toLowerCase().includes("admin");

      // Create user object with admin flag
      const authenticatedUser = {
        ...userData,
        role: serverRole,
        isAdmin: isAdmin,
        token: authToken,
      };

      // Encrypt before storing
      const userString = JSON.stringify(authenticatedUser);
      const encryptedUser = CryptoJS.AES.encrypt(
        userString,
        "your-secret-key"
      ).toString();

      // Store encrypted data
      localStorage.setItem("token", authToken);
      localStorage.setItem("user", encryptedUser);
      localStorage.setItem("role", serverRole);
      localStorage.setItem("lastActivity", Date.now().toString());

      // DEBUG: Check if token is being stored correctly
      console.log("Login successful, token:", authToken);
      console.log(
        "Stored token in localStorage:",
        localStorage.getItem("token")
      );

      // Update state
      setToken(authToken);
      setUser(authenticatedUser);
      setLastActivity(Date.now());
      setShowTimeoutWarning(false);

      return {
        success: true,
        user: authenticatedUser,
      };
    } catch (error) {
      console.error("Login error:", error.message);
      return {
        success: false,
        error: error.message || "Login failed",
      };
    }
  };

  const updatePassword = async ({ oldPassword, newPassword }) => {
    try {
      await axios.post(
        "https://gibsbrokersapi.newgibsonline.com/api/Users/update-password",
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return { success: true };
    } catch (error) {
      console.error(
        "Password update error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data?.message || "Password update failed",
      };
    }
  };

  // Extend session when user interacts with timeout warning
  const extendSession = () => {
    updateLastActivity();
    setShowTimeoutWarning(false);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
    updatePassword,
    showTimeoutWarning,
    extendSession,
    updateLastActivity, // Export this for manual activity updates
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}