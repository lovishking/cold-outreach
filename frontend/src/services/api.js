import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

export const getLeads = () => api.get('/leads/');
export const createLead = (data) => api.post('/leads/', data);
export const deleteLead = (id) => api.delete(`/leads/${id}`);
export const uploadLeads = (formData) => api.post('/leads/upload', formData);

export const getTemplates = () => api.get('/templates/');
export const createTemplate = (data) => api.post('/templates/', data);
export const updateTemplate = (id, data) => api.put(`/templates/${id}`, data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`);
export const previewTemplate = (id, leadId) => api.get(`/templates/${id}/preview?lead_id=${leadId}`);
export const uploadAttachment = (formData) => api.post('/templates/upload_attachment', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const getCampaigns = () => api.get('/campaigns/');
export const createCampaign = (data) => api.post('/campaigns/', data);
export const startCampaign = (id) => api.post(`/campaigns/${id}/start`);
export const pauseCampaign = (id) => api.post(`/campaigns/${id}/pause`);
export const resumeCampaign = (id) => api.post(`/campaigns/${id}/resume`);
export const stopCampaign = (id) => api.post(`/campaigns/${id}/stop`);
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`);

export const getLogs = () => api.get('/logs/');

export const getSenders = () => api.get('/senders/');
export const createSender = (data) => api.post('/senders/', data);
export const deleteSender = (id) => api.delete(`/senders/${id}`);
export const setSenderDefault = (id) => api.post(`/senders/${id}/default`);

export default api;
