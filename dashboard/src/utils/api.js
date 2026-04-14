import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchShipments() {
  const { data } = await api.get('/shipments');
  return data.data;
}

export async function fetchShipment(id) {
  const { data } = await api.get(`/shipments/${id}`);
  return data.data;
}

export async function fetchShipmentHistory(id) {
  const { data } = await api.get(`/shipments/${id}/history`);
  return data.data;
}

export async function createShipment(payload) {
  const { data } = await api.post('/shipments', payload);
  return data.data;
}

export async function updateShipmentStatus(id, payload) {
  const { data } = await api.put(`/shipments/${id}/status`, payload);
  return data.data;
}

export async function confirmDelivery(id, notes) {
  const { data } = await api.post(`/shipments/${id}/confirm`, { notes });
  return data.data;
}

// --- Invoice endpoints ---

export async function fetchInvoices(source) {
  const params = source ? { source } : {};
  const { data } = await api.get('/invoices', { params });
  return data.data;
}

export async function fetchInvoice(id) {
  const { data } = await api.get(`/invoices/${id}`);
  return data.data;
}

export async function fetchInvoiceStats() {
  const { data } = await api.get('/invoices/stats');
  return data.data;
}

export default api;
