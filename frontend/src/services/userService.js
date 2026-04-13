import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export const getCollaborators = async () => {
  const response = await axios.get(`${API_BASE_URL}/admin/users`);
  return response.data;
};

export const createCollaborator = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/admin/users`, payload);
  return response.data;
};

export const getProfileById = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/profile/${userId}`);
  return response.data;
};

export const updateProfileById = async (userId, formData) => {
  const response = await axios.post(`${API_BASE_URL}/profile/${userId}`, formData);
  return response.data;
};