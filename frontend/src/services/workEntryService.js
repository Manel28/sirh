import api from "./api";

// Charge le planning d'un mois. userId est facultatif et n'est exploite par le
// backend que lorsque l'utilisateur authentifie est administrateur.
export const getWorkEntriesByMonth = async (month, userId = null) => {
  const response = await api.get("/work-entries", {
    params: { month, ...(userId ? { userId } : {}) },
  });
  return response.data;
};

// Enregistre le code de presence choisi pour une date (site, teletravail, etc.).
export const saveWorkEntry = async ({ date, code }) => {
  const response = await api.post("/work-entries", { date, code });
  return response.data;
};
