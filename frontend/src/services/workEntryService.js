import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export const getWorkEntriesByMonth = async (month) => {
  const response = await axios.get(`${API_BASE_URL}/work-entries`, {
    params: { month },
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