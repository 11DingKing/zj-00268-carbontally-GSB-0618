import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

export const batchAPI = {
  list: () => api.get("/batches"),
  get: (id) => api.get(`/batches/${id}`),
  create: (data) => api.post("/batches", data),
  update: (id, data) => api.put(`/batches/${id}`, data),
  remove: (id) => api.delete(`/batches/${id}`),
  getMemberships: (id) => api.get(`/batches/${id}/memberships`),
  addPlots: (id, plotIds) => api.post(`/batches/${id}/plots`, { plot_ids: plotIds }),
  removePlots: (id, plotIds) => api.delete(`/batches/${id}/plots`, { data: { plot_ids: plotIds } }),
};

export default api;
