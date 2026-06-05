import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8001/api";

const getStoredUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getLeaves = async () => {
  const user = getStoredUser();

  const response = await axios.get(`${API_BASE_URL}/leaves`, {
    params: {
      userId: user?.id,
      roles: user?.roles || [],
    },
  });

  return response.data;
};

export const createLeave = async (leaveData) => {
  const user = getStoredUser();

  const response = await axios.post(`${API_BASE_URL}/leaves`, {
    type: leaveData.type,
    start: leaveData.start,
    end: leaveData.end,
    userId: user?.id,
  });

  return response.data;
};

export const updateLeaveStatus = async (leaveId, status) => {
  const response = await axios.patch(`${API_BASE_URL}/leaves/${leaveId}/status`, {
    status,
  });

  return response.data;
};