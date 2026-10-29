import { getApiBaseUrl } from "../utils/config";
// src/services/PaymentServices.js
const paymentsUrl = () => `${getApiBaseUrl()}/Payments`;

class PaymentService {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please log in again.");
    }

    const response = await fetch(`${paymentsUrl()}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "*/*",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Payment endpoints return { success: false, message } on failure
      throw new Error(data?.message || `Request failed (${response.status})`);
    }
    return data;
  }

  getWallet() {
    return this.request("/wallet");
  }

  getWalletTransactions(take = 50) {
    return this.request(`/wallet/transactions?take=${take}`);
  }

  // Starts a Paystack card payment; resolves with { authorizationUrl, reference }
  fundWallet(amount, email) {
    return this.request("/wallet/fund", {
      method: "POST",
      body: JSON.stringify({ amount, email }),
    });
  }

  // Which of these certificates are paid: [{ certNo, method, amount, paidAt }]. Unpaid ones are absent.
  getPaidCertificates(certNos) {
    return this.request("/certificates/status", {
      method: "POST",
      body: JSON.stringify({ certNos }),
    });
  }

  getCertificateStatus(certNo) {
    return this.request(`/certificate/${encodeURIComponent(certNo)}/status`);
  }

  // Starts a Paystack card payment; resolves with { authorizationUrl, reference }
  payCertificateByCard(certNo, email) {
    return this.request(`/certificate/${encodeURIComponent(certNo)}/card`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  payCertificateByWallet(certNo) {
    return this.request(`/certificate/${encodeURIComponent(certNo)}/wallet`, {
      method: "POST",
    });
  }

  verify(reference) {
    return this.request(`/verify/${encodeURIComponent(reference)}`);
  }
}

export default new PaymentService();
