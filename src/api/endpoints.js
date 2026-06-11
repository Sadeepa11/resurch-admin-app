import api from "./api";

export const dashboardApi = {
  stats: (range = "7days") => api.get(`/super-admin/dashboard/stats?range=${range}`),
  sidebarCounts: () => api.get("/super-admin/dashboard/sidebar-counts"),
};

export const usersApi = {
  list: (params = {}) => api.get("/users", { params }),
  toggleStatus: (id) => api.patch(`/users/${id}/status`),
  setStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  bulkAction: (payload) => api.post("/users/bulk-action", payload),
  bulkStatus: (payload) => api.post("/users/bulk-status", payload),
  blockReason: (payload) => api.post("/users/block-reason", payload),
  create: (payload) => api.post("/users", payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  remove: (id) => api.delete(`/users/${id}`),
  registerInvestor: (payload) => api.post("/register/investor", payload),
  registerGeneralUser: (payload) => api.post("/register/generaluser", payload),
  registerBoth: (payload) => api.post("/register/both", payload),
};

export const innovationsApi = {
  list: (params = {}) => api.get("/innovation", { params }),
  setStatus: (id, status) => api.patch(`/innovations/${id}/status`, { status }),
  bulkStatus: (ids, status) => api.post("/innovations/bulk-status", { ids, status }),
  requestRevision: (id, payload) => api.post(`/admin/innovations/${id}/request-revision`, payload),
  permanentlyReject: (id, payload) => api.post(`/admin/innovations/${id}/permanently-reject`, payload),
  remove: (id) => api.delete(`/innovations/${id}`),
};

export const researchApi = {
  list: (params = {}) => api.get("/research", { params }),
  setStatus: (id, status) => api.put(`/research/${id}/status`, { status }),
  bulkStatus: (ids, status) => api.post("/research/bulk-status", { ids, status }),
  requestRevision: (id, payload) => api.post(`/admin/research/${id}/request-revision`, payload),
  permanentlyReject: (id, payload) => api.post(`/admin/research/${id}/permanently-reject`, payload),
  remove: (id) => api.delete(`/research/${id}`),
};

export const innovationCommentsApi = {
  list: (params = {}) => api.get("/admin/innovation-comments", { params }),
  remove: (id) => api.delete(`/admin/innovation-comments/${id}`),
};

export const researchCommentsApi = {
  list: (params = {}) => api.get("/admin/research-comments", { params }),
  remove: (id) => api.delete(`/admin/research-comments/${id}`),
};

export const advertisementsApi = {
  list: () => api.get("/admin/advertisements"),
  analytics: () => api.get("/admin/advertisements/analytics"),
  approve: (id) => api.post(`/admin/advertisements/${id}/approve`),
  reject: (id) => api.post(`/admin/advertisements/${id}/reject`),
  remove: (id) => api.delete(`/admin/advertisements/${id}`),
  pricing: () => api.get("/super-admin/advertisements/pricing"),
  updatePricing: (payload) => api.put("/super-admin/advertisements/pricing", payload),
};

export const membershipsApi = {
  list: (params = {}) => api.get("/super-admin/memberships", { params }),
  pricing: () => api.get("/super-admin/memberships/pricing"),
  updatePricing: (payload) => api.put("/super-admin/memberships/pricing", payload),
};

export const investorZoneApi = {
  list: (params = {}) => api.get("/admin/investorzone/posts", { params }),
  approve: (id) => api.patch(`/admin/investorzone/posts/${id}/approve`),
  reject: (id) => api.patch(`/admin/investorzone/posts/${id}/reject`),
  remove: (id) => api.delete(`/admin/investorzone/posts/${id}`),
};

export const communityApi = {
  list: (params = {}) => api.get("/admin/community/posts", { params }),
  remove: (id) => api.delete(`/admin/community/posts/${id}`),
};

export const jobsApi = {
  list: (params = {}) => api.get("/admin/jobs", { params }),
  setStatus: (id, status) => api.patch(`/admin/jobs/${id}/status`, { status }),
  remove: (id) => api.delete(`/jobs/${id}`),
  create: (payload) => api.post("/jobs", payload),
};

export const hireRequestsApi = {
  list: (params = {}) => api.get("/super-admin/hire-requests", { params }),
  approve: (id) => api.patch(`/super-admin/hire-requests/${id}/approve`),
  reject: (id) => api.patch(`/super-admin/hire-requests/${id}/reject`),
};

export const paymentsApi = {
  overview: () => api.get("/super-admin/payments/overview"),
  orders: (params = {}) => api.get("/super-admin/payments/orders", { params }),
  ads: (params = {}) => api.get("/super-admin/payments/ads", { params }),
  payouts: (params = {}) => api.get("/super-admin/payments/payouts", { params }),
  markPayout: (orderId, notes) =>
    api.put(`/super-admin/payments/payouts/${orderId}/mark`, { payout_notes: notes }),
  bulkMarkPayouts: (payload) => api.post("/super-admin/payments/payouts/bulk-mark", payload),
  overdue: (page = 1) => api.get(`/super-admin/payments/overdue-deliveries?page=${page}&per_page=15`),
};

export const transactionsApi = {
  analytics: () => api.get("/super-admin/payments/transaction-analytics"),
  orders: (params = {}) => api.get("/super-admin/payments/orders", { params }),
};

export const auditLogsApi = {
  list: (page = 1) => api.get(`/super-admin/audit-logs?page=${page}`),
};

export const videoUploadApi = {
  payments: (params = {}) => api.get("/super-admin/video-upload-payments", { params }),
  fee: () => api.get("/super-admin/video-upload-fee"),
  updateFee: (payload) => api.put("/super-admin/video-upload-fee", payload),
};

const TOGGLE_BEST_TYPE_MAP = { research: "researcher", innovation: "innovator" };

export const leaderboardApi = {
  byContribution: (type) => api.get(`/super-admin/users-by-contribution?type=${type}`),
  toggleBest: (userId, type) =>
    api.post(`/super-admin/users/${userId}/toggle-best`, { type: TOGGLE_BEST_TYPE_MAP[type] ?? type }),
};

export const hubCardsApi = {
  list: () => api.get("/super-admin/hub-cards"),
  update: (id, formData) =>
    api.post(`/super-admin/hub-cards/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const removeContentApi = {
  list: (endpoint, params = {}) => api.get(endpoint, { params }),
  remove: (endpoint) => api.delete(endpoint),
};

export const notificationsApi = {
  list: (params = {}) => api.get("/super-admin/notifications", { params }),
  unreadCount: () => api.get("/super-admin/notifications", { params: { per_page: 1 } }),
  markRead: (id) => api.put(`/super-admin/notifications/${id}/read`),
  markAllRead: () => api.put("/super-admin/notifications/read-all"),
  remove: (id) => api.delete(`/super-admin/notifications/${id}`),
  clearRead: () => api.delete("/super-admin/notifications/clear-read"),
};

export const marketingApi = {
  // Reuses advertisement endpoints
  list: () => api.get("/admin/advertisements"),
};

export const studentVerificationApi = {
  list: (params = {}) => api.get("/super-admin/student-verifications", { params }),
  update: (id, payload) => api.put(`/super-admin/student-verifications/${id}`, payload),
  remove: (id) => api.delete(`/super-admin/student-verifications/${id}`),
};
