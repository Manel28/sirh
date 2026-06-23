// Import de la bibliothèque Axios utilisée pour effectuer les appels HTTP vers l'API Symfony
import axios from "axios";

// URL de base de l'API backend
const API_BASE_URL = "http://127.0.0.1:8001/api";

/**
 * Récupère l'utilisateur connecté depuis le localStorage.
 *
 * Retour :
 * - objet utilisateur si connecté ;
 * - null sinon.
 */
const getStoredUser = () => {
  const user = localStorage.getItem("user");

  return user ? JSON.parse(user) : null;
};

/**
 * Récupère les demandes de congé.
 *
 * Le comportement dépend du rôle :
 * - Collaborateur : récupération de ses propres demandes ;
 * - Administrateur RH : récupération de toutes les demandes.
 */
export const getLeaves = async () => {
  // Récupération de l'utilisateur connecté
  const user = getStoredUser();

  // Appel API pour récupérer les demandes de congé
  const response = await axios.get(`${API_BASE_URL}/leaves`, {
    params: {
      // Identifiant de l'utilisateur connecté
      userId: user?.id,

      // Rôles de l'utilisateur utilisés côté backend
      roles: user?.roles || [],
    },
  });

  // Retourne les données reçues
  return response.data;
};

/**
 * Crée une nouvelle demande de congé.
 *
 * Paramètre :
 * - leaveData contenant :
 *   - type de congé ;
 *   - date de début ;
 *   - date de fin.
 *
 * L'identifiant utilisateur est ajouté automatiquement
 * à partir du localStorage.
 */
export const createLeave = async (leaveData) => {
  // Récupération de l'utilisateur connecté
  const user = getStoredUser();

  // Envoi de la demande de congé au backend
  const response = await axios.post(`${API_BASE_URL}/leaves`, {
    type: leaveData.type,
    start: leaveData.start,
    end: leaveData.end,

    // Association de la demande à l'utilisateur connecté
    userId: user?.id,
  });

  // Retour des données de réponse
  return response.data;
};

/**
 * Modifie le statut d'une demande de congé.
 *
 * Utilisé pour :
 * - approuver une demande ;
 * - refuser une demande ;
 * - annuler une demande.
 *
 * Paramètres :
 * - leaveId : identifiant de la demande ;
 * - status : nouveau statut.
 */
export const updateLeaveStatus = async (leaveId, status) => {
  // Appel API de mise à jour du statut
  const response = await axios.patch(
    `${API_BASE_URL}/leaves/${leaveId}/status`,
    {
      status,
    }
  );

  // Retour des données mises à jour
  return response.data;
};