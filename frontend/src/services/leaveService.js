import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/leaves";

const getStoredUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getLeaves = async () => {
  const user = getStoredUser();

  if (!user) {
    throw new Error("User not found in localStorage");
  }

  const response = await axios.get(API_URL, {
    params: {
      userId: user.id,
      roles: Array.isArray(user.roles) ? user.roles : [],
    },
  });

  return response.data;
};

export const createLeave = async (data) => {
  const user = getStoredUser();

  if (!user) {
    throw new Error("User not found in localStorage");
  }

  const payload = {
    ...data,
    userId: user.id,
  };

  const response = await axios.post(API_URL, payload);
  return response.data;
};

export const updateLeaveStatus = async (leaveId, status) => {
  const response = await axios.patch(`${API_URL}/${leaveId}/status`, {
    status,
  });

  return response.data;
};