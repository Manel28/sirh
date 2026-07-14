import api from "./api";

export const loginUser = async (credentials) => {
  const response = await api.post("/login", credentials);
  return response.data;
};
