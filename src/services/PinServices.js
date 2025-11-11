// src/services/PinService.js
const API_BASE_URL = 'https://gibsbrokersapi.newgibsonline.com/api';

class PinService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Ensure we have the latest token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      ...options,
    };

    // Add body if it exists and is an object
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    console.log('Making request to:', url);
    console.log('Request config:', {
      method: config.method,
      headers: config.headers,
      body: config.body
    });

    const response = await fetch(url, config);
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  }

  // Get my balance
  async getBalance(brokerId = null) {
    // If no brokerId provided, try to get it from localStorage
    if (!brokerId) {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          // Try to decrypt if encrypted
          let user;
          try {
            const CryptoJS = require('crypto-js');
            const bytes = CryptoJS.AES.decrypt(userData, "your-secret-key");
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            user = decryptedString ? JSON.parse(decryptedString) : JSON.parse(userData);
          } catch {
            // If decryption fails, try parsing as plain JSON
            user = JSON.parse(userData);
          }
          
          // Look for broker ID in common fields
          brokerId = user.brokerId || user.brokerID || user.BrokerId || 
                    user.brokerCode || user.BrokerCode || user.userId || 
                    user.UserId || user.id || user.Id || user.ID;
        }
      } catch (error) {
        console.warn('Could not extract brokerId from user data:', error);
      }
    }

    // If we still don't have brokerId, use the endpoint without ID (might work for current user)
    if (!brokerId) {
      console.warn('No brokerId provided, using generic balance endpoint');
      return this.request('/Pin/balance');
    }

    // Use the specific broker balance endpoint
    console.log(`Getting balance for broker: ${brokerId}`);
    return this.request(`/Pin/balance/${encodeURIComponent(brokerId)}`);
  }

  // Allocate pins to brokers
  async allocatePins(brokerId, pinAmount, remarks) {
    const requestBody = {
      brokerId: brokerId.toString().trim(),
      pinAmount: parseInt(pinAmount, 10),
      remarks: remarks || 'No remarks'
    };

    console.log('Allocation request body:', requestBody);

    return this.request('/Pin/allocate', {
      method: 'POST',
      body: requestBody,
    });
  }

  // Approve pin allocation
  async approveAllocation(allocationId, isApproved, approvalRemarks) {
    return this.request('/Pin/approve', {
      method: 'POST',
      body: JSON.stringify({
        allocationId: parseInt(allocationId),
        isApproved: isApproved,
        approvalRemarks: approvalRemarks || ''
      }),
    });
  }

  // Get pending allocations
  async getPendingAllocations() {
    return this.request('/Pin/pending');
  }

  // Share pins with clients
  async sharePins(clientId, pinAmount, remarks) {
    const requestBody = {
      clientId: clientId,
      pinAmount: parseInt(pinAmount),
      remarks: remarks || ''
    };

    console.log('Share pins request body:', requestBody);

    return this.request('/Pin/share', {
      method: 'POST',
      body: requestBody,
    });
  }

  // Get my allocations - SIMPLIFIED VERSION (no getCurrentUserId needed)
  async getMyAllocations() {
    try {
      // Simply get all allocations and let the frontend filter them
      console.log('Getting all allocations');
      const allAllocations = await this.request('/Pin/allocations?page=1&pageSize=50');
      return allAllocations;
    } catch (error) {
      console.error('Error fetching allocations:', error);
      // Return empty array as fallback
      return [];
    }
  }

  // Get pin summary with optional date range
  async getPinSummary(userId = null, fromDate = null, toDate = null) {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (userId) params.append('userId', userId);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/Pin/summary?${queryString}` : '/Pin/summary';
    
    return this.request(endpoint);
  }

  // Get allocation history with optional date range
  async getAllocationHistory(userId = null, fromDate = null, toDate = null) {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (userId) params.append('userId', userId);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/Pin/allocations?${queryString}` : '/Pin/allocations';
    
    return this.request(endpoint);
  }

  // Search allocations with criteria
  async searchAllocations(searchCriteria = {}) {
    return this.request('/Pin/allocations/search', {
      method: 'POST',
      body: searchCriteria,
    });
  }

  // Get all allocations (admin only)
  async getAllocations() {
    return this.request('/Pin/allocations/all');
  }
}

export default new PinService();