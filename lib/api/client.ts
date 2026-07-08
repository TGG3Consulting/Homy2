const API_BASE = '/api';

export const api = {
  auth: {
    async login(email: string, password: string) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },

    async register(email: string, password: string, data?: { first_name: string; last_name: string; patronymic?: string }) {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, ...data }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },

    async verifyOtp(email: string, otpCode: string) {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otpCode }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },

    async resendOtp(email: string) {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },

    async resetPasswordRequest(email: string) {
      const res = await fetch(`${API_BASE}/auth/reset-password-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },

    async resetPassword(resetToken: string, newPassword: string) {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resetToken, newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },

    async me() {
      const res = await fetch(`${API_BASE}/users/me`, {
        credentials: 'include', // Uses HttpOnly cookie
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },

    async updateProfile(data: Record<string, any>) {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Uses HttpOnly cookie
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },

    async logout() {
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      return res.json();
    },

    // Deprecated: tokens are now in HttpOnly cookies
    setToken(_token: string) {
      // No-op: tokens are handled via HttpOnly cookies
    },

    // Deprecated: tokens are now in HttpOnly cookies
    getToken(): string | null {
      return null;
    },
  },

  properties: {
    async search(params: Record<string, any>) {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/properties?${query}`);
      return res.json();
    },

    async getById(id: string) {
      const res = await fetch(`${API_BASE}/properties/${id}`);
      return res.json();
    },

    async getNearby(id: string) {
      const res = await fetch(`${API_BASE}/properties/${id}/nearby`);
      return res.json();
    },

    async getFeatured() {
      const res = await fetch(`${API_BASE}/properties/featured`);
      return res.json();
    },

    async getRecent() {
      const res = await fetch(`${API_BASE}/properties/recent`);
      return res.json();
    },
  },

  favorites: {
    async list() {
      const res = await fetch(`${API_BASE}/favorites`, {
        credentials: 'include',
      });
      return res.json();
    },

    async add(propertyId: string) {
      const res = await fetch(`${API_BASE}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ property_id: propertyId }),
      });
      return res.json();
    },

    async remove(id: string) {
      const res = await fetch(`${API_BASE}/favorites/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      return res.json();
    },

    async check(propertyId: string) {
      const res = await fetch(`${API_BASE}/favorites/check/${propertyId}`, {
        credentials: 'include',
      });
      return res.json();
    },
  },

  viewing: {
    async schedule(propertyId: string, scheduledAt: string, message?: string) {
      const res = await fetch(`${API_BASE}/viewing/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ property_id: propertyId, scheduled_at: scheduledAt, message }),
      });
      return res.json();
    },

    async list() {
      const res = await fetch(`${API_BASE}/viewing`, {
        credentials: 'include',
      });
      return res.json();
    },

    async cancel(id: string) {
      const res = await fetch(`${API_BASE}/viewing/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      return res.json();
    },
  },

  platform: {
    async getMetrics() {
      const res = await fetch(`${API_BASE}/platform/metrics`);
      return res.json();
    },

    async getStats() {
      const res = await fetch(`${API_BASE}/platform/stats`);
      return res.json();
    },
  },

  neighborhoods: {
    async list() {
      const res = await fetch(`${API_BASE}/neighborhoods`);
      return res.json();
    },

    async getById(id: string) {
      const res = await fetch(`${API_BASE}/neighborhoods/${id}`);
      return res.json();
    },
  },
};

export default api;
