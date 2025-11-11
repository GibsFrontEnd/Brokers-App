// src/services/userService.js
const API_BASE_URL = 'https://gibsbrokersapi.newgibsonline.com/api';

class UserService {
  getToken() {
    // Get token from localStorage (stored separately by AuthContext)
    return localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*',
        'Content-Type': 'application/json',
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
    return this.request('/InsuredClients');
  }

  // Get brokers if needed
  async getBrokers() {
    return this.request('/Brokers');
  }

}

export default new UserService();