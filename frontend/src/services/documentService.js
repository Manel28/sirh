import api from "./api";

export const getDocuments = async () => {
  const response = await api.get("/documents");
  return response.data;
};

export const uploadDocument = async (formData) => {
  const response = await api.post("/documents", formData);
  return response.data;
};

export const updateDocument = async (documentId, payload) => {
  const response = await api.put(`/documents/${documentId}`, payload);
  return response.data;
};

export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
};
