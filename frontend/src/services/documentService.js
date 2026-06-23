// Import de la bibliothèque Axios utilisée pour communiquer avec l'API Symfony
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
 * Récupère les documents accessibles à l'utilisateur connecté.
 *
 * Le userId est envoyé à l'API afin de :
 * - récupérer uniquement les documents personnels d'un collaborateur ;
 * - récupérer l'ensemble des documents pour un administrateur RH.
 */
export const getDocuments = async () => {
  // Récupération de l'utilisateur connecté
  const user = getStoredUser();

  // Vérification de la présence d'un utilisateur connecté
  if (!user) {
    throw new Error("User not found in localStorage");
  }

  // Appel API pour récupérer les documents
  const response = await axios.get(`${API_BASE_URL}/documents`, {
    params: {
      userId: user.id,
    },
  });

  // Retour des données reçues
  return response.data;
};

/**
 * Envoie un nouveau document à l'API.
 *
 * Paramètre :
 * - formData contenant :
 *   - le titre ;
 *   - la catégorie ;
 *   - l'utilisateur associé ;
 *   - le fichier PDF.
 *
 * Utilisation de FormData car il s'agit d'un upload de fichier.
 */
export const uploadDocument = async (formData) => {
  // Envoi du document au backend
  const response = await axios.post(
    `${API_BASE_URL}/documents`,
    formData
  );

  return response.data;
};

/**
 * Met à jour les informations d'un document existant.
 *
 * Paramètres :
 * - documentId : identifiant du document ;
 * - payload : nouvelles données à enregistrer.
 *
 * Les informations modifiées peuvent être :
 * - le titre ;
 * - la catégorie ;
 * - l'utilisateur associé.
 */
export const updateDocument = async (documentId, payload) => {
  // Appel API de modification
  const response = await axios.put(
    `${API_BASE_URL}/documents/${documentId}`,
    payload
  );

  return response.data;
};

/**
 * Supprime un document existant.
 *
 * Paramètre :
 * - documentId : identifiant du document à supprimer.
 */
export const deleteDocument = async (documentId) => {
  // Appel API de suppression
  const response = await axios.delete(
    `${API_BASE_URL}/documents/${documentId}`
  );

  return response.data;
};