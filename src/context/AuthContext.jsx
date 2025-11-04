import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

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

  // Initialize user and token from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem("token");
      const encryptedUser = localStorage.getItem("user");

      if (storedToken) {
        setToken(storedToken);
      }

      if (encryptedUser) {
        const decryptedUser = decryptData(encryptedUser);
        if (decryptedUser) {
          setUser(decryptedUser);
        } else {
          // Clear invalid/corrupted data
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("role");
        }
      }
    };

    initializeAuth();
  }, []);

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
        } catch (e) {
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

      // DEBUG: Check if token is being stored correctly
      console.log("Login successful, token:", authToken);
      console.log(
        "Stored token in localStorage:",
        localStorage.getItem("token")
      );

      // Update state
      setToken(authToken);
      setUser(authenticatedUser);

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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    setToken(null);
    return { success: true };
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

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
