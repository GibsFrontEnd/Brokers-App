// src/services/userService.js
import { getApiBaseUrl } from "../utils/config";

const API_BASE_URL = getApiBaseUrl();

class UserService {
  getToken() {
    // Get token from localStorage (stored separately by AuthContext)
    return localStorage.getItem("token");
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();

    if (!token) {
      throw new Error("No authentication token found. Please log in again.");
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "*/*",
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    console.log(`Making API call to: ${url}`); // Debug

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Get broker's specific clients
  async getBrokerClients(brokerId) {
    return this.request(`/Auth/brokers/${brokerId}/clients`);
  }

  // Get all clients - CORRECT ENDPOINT
  async getClients() {
    return this.request("/InsuredClients");
  }

  // All super agents (brokers), as a plain list.
  // /Brokers answers with a server error, so this uses the same endpoint as the Super agents page.
  async getBrokers() {
    const data = await this.request("/Auth/brokers");
    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  }
}

export default new UserService();
