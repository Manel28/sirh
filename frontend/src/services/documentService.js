import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8001/api";

const getStoredUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getDocuments = async () => {
  const user = getStoredUser();

  if (!user) {
    throw new Error("User not found in localStorage");
  }

  const response = await axios.get(`${API_BASE_URL}/documents`, {
    params: {
      userId: user.id,
    },
  });

  return response.data;
};

export const uploadDocument = async (formData) => {
  const response = await axios.post(`${API_BASE_URL}/documents`, formData);
  return response.data;
};

export const updateDocument = async (documentId, payload) => {
  const response = await axios.put(
    `${API_BASE_URL}/documents/${documentId}`,
    payload
  );

  return response.data;
};

export const deleteDocument = async (documentId) => {
  const response = await axios.delete(`${API_BASE_URL}/documents/${documentId}`);
  return response.data;
};