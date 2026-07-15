import api from "./api";

// Recupere les demandes visibles par l'utilisateur connecte. Le backend renvoie
// seulement ses demandes, ou toutes les demandes si son role est administrateur.
export const getLeaves = async () => {
  const response = await api.get("/leaves");
  return response.data;
};

// Envoie une nouvelle demande de conge au format JSON.
export const createLeave = async ({ type, start, end }) => {
  const response = await api.post("/leaves", { type, start, end });
  return response.data;
};

// PATCH ne modifie qu'une partie de la demande : ici son statut.
export const updateLeaveStatus = async (leaveId, status) => {
  const response = await api.patch(`/leaves/${leaveId}/status`, { status });
  return response.data;
};
