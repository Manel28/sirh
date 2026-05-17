import axios from "axios";

const API_BASE_URL = "http://localhost:8001/api";

export const getWorkEntriesByMonth = async (month, userId = null) => {
  const response = await axios.get(`${API_BASE_URL}/work-entries`, {
    params: { month, userId },
  });
  return response.data;
};

export const saveWorkEntry = async ({ userId, date, code }) => {
  const response = await axios.post(`${API_BASE_URL}/work-entries`, {
    userId,
    date,
    code,
  });
  return response.data;
};