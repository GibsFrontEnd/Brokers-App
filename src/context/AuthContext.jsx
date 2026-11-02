import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { getApiBaseUrl, getStorageKey } from "../utils/config";
import { endServerSession, getToken, sessionIsValid, setSessionToken } from "../utils/session";

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
      const bytes = CryptoJS.AES.decrypt(encryptedData, getStorageKey());
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedString ? JSON.parse(decryptedString) : null;
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  };

  // Update last activity timestamp
  const updateLastActivity = useCallback(() => {
    setLastActivity(Date.now());
    // Reset warning when user is active
    if (showTimeoutWarning) {
      setShowTimeoutWarning(false);
    }
  }, [showTimeoutWarning]);

  // Logout function
  const logout = useCallback(() => {
    endServerSession();
    setSessionToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("entityType");
    localStorage.removeItem("lastActivity");
    setUser(null);
    setToken(null);
    setShowTimeoutWarning(false);
    return { success: true };
  }, []);

  // Check session timeout
  const checkSessionTimeout = useCallback(() => {
    if (!token) return;

    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastActivity;
    const timeRemaining = SESSION_TIMEOUT - timeSinceLastActivity;

    // Show warning 1 minute before timeout
    if (
      timeRemaining <= WARNING_TIME &&
      timeRemaining > 0 &&
      !showTimeoutWarning
    ) {
      setShowTimeoutWarning(true);
    }

    // Logout when timeout reached
    if (timeSinceLastActivity >= SESSION_TIMEOUT) {
      logout();
      // You can also show a notification here
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?timeout=true";
      }
    }
  }, [
    token,
    lastActivity,
    SESSION_TIMEOUT,
    WARNING_TIME,
    showTimeoutWarning,
    logout,
  ]);

  // Restore the signed-in user on mount. The token itself is in an HttpOnly cookie, so the
  // API is asked whether it is still valid before the user is treated as signed in.
  useEffect(() => {
    const initializeAuth = async () => {
      const encryptedUser = localStorage.getItem("user");
      const storedLastActivity = localStorage.getItem("lastActivity");

      // A token kept in localStorage is from before sessions moved to a cookie: sign in again.
      if (localStorage.getItem("token")) {
        logout();
        return;
      }

      if (encryptedUser) {
        const decryptedUser = decryptData(encryptedUser);
        if (decryptedUser && (await sessionIsValid())) {
          setUser(decryptedUser);
          setToken(getToken());
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

    initializeAuth().finally(() => setLoading(false));
  }, [logout]);

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
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      updateLastActivity();
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup function
    return () => {
      clearInterval(timeoutInterval);
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [token, lastActivity, checkSessionTimeout, updateLastActivity]);

  const login = async ({ username, password }) => {
    // Use capital letters for field names as required by the API
    const requestBody = {
      Username: username, // Capital U
      Password: password, // Capital P
    };

    try {
      const response = await fetch(`${getApiBaseUrl()}/Auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Try to get the actual error message from the server
        const errorText = await response.text();
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          console.log("Could not parse error as JSON");
        }
        throw new Error(
          errorData.message ||
            errorText ||
            `HTTP error! status: ${response.status}`,
        );
      }

      // Parse the successful JSON response
      const responseData = await response.json();

      // Extract token and user data from response
      const authToken = responseData.token;

      // Align to API shape from Swagger login response
      const authenticatedUser = {
        userId: responseData.userId || responseData.userID || "",
        username: responseData.userName || responseData.username || username,
        email: responseData.email || "",
        entityType: responseData.entityType || "User",
        permissions: responseData.permissions || responseData.permission || [],
        roles: responseData.roles || [],
      };

      // Encrypt before storing
      const userString = JSON.stringify(authenticatedUser);
      const encryptedUser = CryptoJS.AES.encrypt(
        userString,
        getStorageKey(),
      ).toString();

      // Store encrypted data
      localStorage.setItem("user", encryptedUser);
      // Keep entityType for routing/guards
      localStorage.setItem("entityType", authenticatedUser.entityType);
      localStorage.setItem("lastActivity", Date.now().toString());

      // Update state
      setSessionToken(authToken);
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
        `${getApiBaseUrl()}/Users/update-password`,
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return { success: true };
    } catch (error) {
      console.error(
        "Password update error:",
        error.response?.data || error.message,
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
