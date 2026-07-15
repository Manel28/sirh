import api from "./api";

// Les fonctions de ce service traduisent les actions de la page Collaborateurs
// en requetes HTTP vers les routes protegees /api/admin/users.
export const getCollaborators = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

// POST cree une nouvelle ressource User a partir des donnees du formulaire.
export const createCollaborator = async (payload) => {
  const response = await api.post("/admin/users", payload);
  return response.data;
};

// PUT remplace les informations modifiables du collaborateur selectionne.
export const updateCollaborator = async (userId, payload) => {
  const response = await api.put(`/admin/users/${userId}`, payload);
  return response.data;
};

// DELETE demande au backend de supprimer le collaborateur et ses donnees liees.
export const deleteCollaborator = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

// Charge le profil de l'utilisateur identifie par le JWT.
export const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};

// FormData permet d'envoyer ensemble les champs texte et la photo du profil.
export const updateProfile = async (formData) => {
  const response = await api.post("/profile", formData);
  return response.data;
};
