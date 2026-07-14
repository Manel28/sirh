import api from "./api";

export const getCollaborators = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const createCollaborator = async (payload) => {
  const response = await api.post("/admin/users", payload);
  return response.data;
};

export const updateCollaborator = async (userId, payload) => {
  const response = await api.put(`/admin/users/${userId}`, payload);
  return response.data;
};

export const deleteCollaborator = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};

export const updateProfile = async (formData) => {
  const response = await api.post("/profile", formData);
  return response.data;
};
