// Import de la bibliothèque Axios utilisée pour communiquer avec l'API Symfony
import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

// URL de base de l'API backend

/**
 * Récupère toutes les notifications d'un utilisateur.
 *
 * Paramètre :
 * - userId : identifiant de l'utilisateur connecté.
 *
 * Retour :
 * - liste des notifications associées à cet utilisateur.
 */
export const getNotifications = async (userId) => {
  // Appel API pour récupérer les notifications
  const response = await axios.get(
    `${API_BASE_URL}/notifications/${userId}`
  );

  // Retour des données reçues
  return response.data;
};

/**
 * Marque une notification comme lue.
 *
 * Paramètre :
 * - notificationId : identifiant de la notification.
 *
 * Cette fonction est utilisée lorsqu'un utilisateur
 * clique sur "Mark as read".
 */
export const markNotificationAsRead = async (notificationId) => {
  // Appel API pour mettre à jour le statut de lecture
  const response = await axios.patch(
    `${API_BASE_URL}/notifications/${notificationId}/read`
  );

  // Retour des données mises à jour
  return response.data;
};

/**
 * Marque toutes les notifications d'un utilisateur comme lues.
 *
 * Paramètre :
 * - userId : identifiant de l'utilisateur connecté.
 *
 * Cette fonction est utilisée lorsqu'un utilisateur
 * clique sur "Mark all as read".
 */
export const markAllNotificationsAsRead = async (userId) => {
  // Appel API pour mettre à jour toutes les notifications
  const response = await axios.patch(
    `${API_BASE_URL}/notifications/user/${userId}/read-all`
  );

  // Retour des données renvoyées par l'API
  return response.data;
};
