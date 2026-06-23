// Import de la bibliothèque Axios utilisée pour communiquer avec l'API Symfony
import axios from "axios";

// URL de base de l'API backend
const API_BASE_URL = "http://127.0.0.1:8001/api";

/**
 * Récupère la liste des collaborateurs.
 *
 * Fonction utilisée par les administrateurs RH
 * pour afficher tous les utilisateurs de l'application.
 */
export const getCollaborators = async () => {
  // Appel API de récupération des utilisateurs
  const response = await axios.get(
    `${API_BASE_URL}/admin/users`
  );

  // Retour des données reçues
  return response.data;
};

/**
 * Crée un nouveau collaborateur.
 *
 * Paramètre :
 * - payload contenant :
 *   - prénom ;
 *   - nom ;
 *   - email ;
 *   - poste ;
 *   - département ;
 *   - photo ;
 *   - rôle utilisateur.
 */
export const createCollaborator = async (payload) => {
  // Appel API de création
  const response = await axios.post(
    `${API_BASE_URL}/admin/users`,
    payload
  );

  return response.data;
};

/**
 * Modifie les informations d'un collaborateur existant.
 *
 * Paramètres :
 * - userId : identifiant du collaborateur ;
 * - payload : nouvelles données à enregistrer.
 */
export const updateCollaborator = async (userId, payload) => {
  // Appel API de modification
  const response = await axios.put(
    `${API_BASE_URL}/admin/users/${userId}`,
    payload
  );

  return response.data;
};

/**
 * Supprime un collaborateur.
 *
 * Paramètre :
 * - userId : identifiant de l'utilisateur à supprimer.
 */
export const deleteCollaborator = async (userId) => {
  // Appel API de suppression
  const response = await axios.delete(
    `${API_BASE_URL}/admin/users/${userId}`
  );

  return response.data;
};

/**
 * Récupère le profil d'un utilisateur.
 *
 * Paramètre :
 * - userId : identifiant de l'utilisateur.
 *
 * Utilisé pour afficher les informations
 * dans la page Profil.
 */
export const getProfileById = async (userId) => {
  // Appel API de récupération du profil
  const response = await axios.get(
    `${API_BASE_URL}/profile/${userId}`
  );

  return response.data;
};

/**
 * Met à jour le profil utilisateur.
 *
 * Paramètres :
 * - userId : identifiant de l'utilisateur ;
 * - formData : données modifiées.
 *
 * FormData est utilisé pour permettre
 * l'envoi d'une photo de profil.
 */
export const updateProfileById = async (userId, formData) => {
  // Appel API de mise à jour du profil
  const response = await axios.post(
    `${API_BASE_URL}/profile/${userId}`,
    formData
  );

  return response.data;
};