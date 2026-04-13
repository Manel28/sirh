import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/login";

export const loginUser = async (credentials) => {
  const response = await axios.post(API_URL, credentials);
  return response.data;
};