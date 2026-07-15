import api from "./api";

// Charge les notifications appartenant a l'utilisateur authentifie.
export const getNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

// Marque une notification precise comme lue.
export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

// Demande au backend de marquer toutes les notifications non lues en une fois.
export const markAllNotificationsAsRead = async () => {
  const response = await api.patch("/notifications/read-all");
  return response.data;
};
