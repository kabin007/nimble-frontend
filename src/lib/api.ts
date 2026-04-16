import axios, { AxiosInstance } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://nimble-backend-6245.onrender.com";

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ EMPLOYEE API ============

export const employeeAPI = {
  getAll: async () => {
    const res = await api.get("/employees/");
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/employees/${id}/`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post("/employees/", data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.patch(`/employees/${id}/`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/employees/${id}/`);
    return res.data;
  },
};

// ============ ATTENDANCE API ============

export const attendanceAPI = {
  getAll: async () => {
    const res = await api.get("/attendance/");
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post("/attendance/", data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/attendance/${id}/`);
    return res.data;
  },
  update : async (id: string, data: any) => {
    const res = await api.patch(`/attendance/${id}/`, data);
    return res.data;
  }
};

// ============ ADVANCE API ============

export const advanceAPI = {
  getAll: async () => {
    const res = await api.get("/employees/advances/");
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post("/employees/advances/", data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/employees/advances/${id}/`);
    return res.data;
  },
};

// ============ ORDER API ============

export const orderAPI = {
  getAll: async () => {
    const res = await api.get("/orders/");
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post("/orders/", data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.patch(`/orders/${id}/`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/orders/${id}/`);
    return res.data;
  },
};

// ============ INVENTORY API ============

export const inventoryAPI = {
  getAll: async () => {
    const res = await api.get("/inventory/");
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post("/inventory/", data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.patch(`/inventory/${id}/`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/inventory/${id}/`);
    return res.data;
  },
};

// ============ TRANSACTION API ============

export const transactionAPI = {
  getAll: async () => {
    const res = await api.get("/transactions/");
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post("/transactions/", data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/transactions/${id}/`);
    return res.data;
  },
};

// ============ BILL API ============

export const billAPI = {
  getAll: async () => {
    const res = await api.get("/bills/");
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post("/bills/", data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.patch(`/bills/${id}/`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/bills/${id}/`);
    return res.data;
  },
};

// ============ DEALER API ============

export const dealerAPI = {
  getAll: async () => {
    const res = await api.get("/dealers/");
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/dealers/${id}/`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post("/dealers/", data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.patch(`/dealers/${id}/`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/dealers/${id}/`);
    return res.data;
  },
};

// ============ AUTH API ============

export const authAPI = {
  me: async () => {
    const res = await api.get("/auth/me/");
    return res.data;
  },
};

export default api;
