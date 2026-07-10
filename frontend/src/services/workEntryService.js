// Import de la bibliothèque Axios utilisée pour communiquer avec l'API Symfony
import axios from "axios";

// URL de base de l'API backend
const API_BASE_URL = "https://sirh-723w.onrender.com/api";

/**
 * Récupère les saisies de temps de travail (Work Entries)
 * pour un mois donné.
 *
 * Paramètres :
 * - month : mois sélectionné (format YYYY-MM) ;
 * - userId : identifiant de l'utilisateur (optionnel).
 *
 * Comportement :
 * - Collaborateur : récupération de ses propres saisies ;
 * - Administrateur RH : récupération des saisies d'un collaborateur spécifique.
 */
export const getWorkEntriesByMonth = async (
  month,
  userId = null
) => {
  // Appel API pour récupérer les données du mois sélectionné
  const response = await axios.get(
    `${API_BASE_URL}/work-entries`,
    {
      params: {
        month,
        userId,
      },
    }
  );

  // Retour des données reçues
  return response.data;
};

/**
 * Enregistre une saisie de temps de travail.
 *
 * Paramètres :
 * - userId : identifiant du collaborateur ;
 * - date : date concernée ;
 * - code : code d'activité ou d'absence.
 *
 * Exemples de codes :
 * - TT : télétravail ;
 * - CP : congé payé ;
 * - RTT ;
 * - ABS ;
 * - présence.
 */
export const saveWorkEntry = async ({
  userId,
  date,
  code,
}) => {
  // Appel API pour enregistrer la saisie
  const response = await axios.post(
    `${API_BASE_URL}/work-entries`,
    {
      userId,
      date,
      code,
    }
  );

  // Retour des données renvoyées par le backend
  return response.data;
};