// src/services/pinService.js
const API_BASE_URL = 'https://gibsbrokersapi.newgibsonline.com/api';

class PinService {
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

  // Allocate pins to brokers
  async allocatePins(brokerId, pinAmount, remarks) {
    return this.request('/Pin/allocate', {
      method: 'POST',
      body: JSON.stringify({
        brokerId,
        pinAmount: parseInt(pinAmount),
        remarks
      }),
    });
  }

  // Approve pin allocation
async approveAllocation(allocationId, isApproved, approvalRemarks) {
  return this.request('/Pin/approve', {
    method: 'POST',
    body: JSON.stringify({
      allocationId: parseInt(allocationId),
      isApproved: isApproved, // Make sure this is boolean true/false
      approvalRemarks: approvalRemarks || '' // Ensure it's never undefined
    }),
  });
}
  // Get pending allocations
  async getPendingAllocations() {
    return this.request('/Pin/pending');
  }

  // Share pins with clients
  async sharePins(clientId, pinAmount, remarks) {
    return this.request('/Pin/share', {
      method: 'POST',
      body: JSON.stringify({
        clientId,
        pinAmount: parseInt(pinAmount),
        remarks
      }),
    });
  }

  // Get my balance
  async getBalance() {
    return this.request('/Pin/balance');
  }

  // Get my allocations
  async getMyAllocations() {
    return this.request('/Pin/allocations/my');
  }
}

export default new PinService();