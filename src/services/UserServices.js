// src/services/userService.js
const API_BASE_URL = 'https://gibsbrokersapi.newgibsonline.com/api';

class UserService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
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