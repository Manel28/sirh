import api from "./api";

// Appelee par LoginPage : envoie les identifiants au controleur Symfony et
// retourne le JSON contenant le JWT et les informations de l'utilisateur.
export const loginUser = async (credentials) => {
  const response = await api.post("/login", credentials);
  return response.data;
};
