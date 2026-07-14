import api from "./api";

export const getWorkEntriesByMonth = async (month, userId = null) => {
  const response = await api.get("/work-entries", {
    params: { month, ...(userId ? { userId } : {}) },
  });
  return response.data;
};

export const saveWorkEntry = async ({ date, code }) => {
  const response = await api.post("/work-entries", { date, code });
  return response.data;
};
