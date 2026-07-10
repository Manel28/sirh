// Import de la bibliothèque Axios utilisée pour effectuer les appels HTTP vers l'API Symfony
import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

// URL de l'endpoint de connexion
// Cette route reçoit l'email et le mot de passe de l'utilisateur
const API_URL = `${API_BASE_URL}/login`;

/**
 * Fonction permettant d'authentifier un utilisateur.
 *
 * Paramètre :
 * - credentials : objet contenant l'email et le mot de passe.
 *
 * Exemple :
 * {
 *   email: "user@email.com",
 *   password: "password123"
 * }
 *
 * Retour :
 * - les données renvoyées par l'API (utilisateur connecté).
 */
export const loginUser = async (credentials) => {

  // Affichage de l'URL appelée dans la console
  // Utile pendant le développement pour vérifier la route utilisée
  console.log("LOGIN URL =", API_URL);

  // Affichage des données envoyées à l'API
  // Permet de vérifier les informations du formulaire
  console.log("LOGIN DATA =", credentials);

  // Envoi de la requête POST vers l'API Symfony
  const response = await axios.post(
    API_URL,
    credentials,
    {
      headers: {
        // Indique que les données sont envoyées au format JSON
        "Content-Type": "application/json",
      },
    }
  );

  // Retourne uniquement les données utiles de la réponse
  return response.data;
};
