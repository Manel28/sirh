import axios from "axios";

const API_BASE_URL = "http://localhost:8001/api";

export const getNotifications = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/notifications/${userId}`);
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await axios.patch(
    `${API_BASE_URL}/notifications/${notificationId}/read`
  );
  return response.data;
};

export const markAllNotificationsAsRead = async (userId) => {
  const response = await axios.patch(
    `${API_BASE_URL}/notifications/user/${userId}/read-all`
  );
  return response.data;
};