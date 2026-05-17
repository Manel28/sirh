import axios from "axios";

const API_URL = "http://localhost:8001/api/login";

export const loginUser = async (credentials) => {
  const response = await axios.post(API_URL, credentials);
  return response.data;
};