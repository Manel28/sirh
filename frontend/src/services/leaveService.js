import api from "./api";

export const getLeaves = async () => {
  const response = await api.get("/leaves");
  return response.data;
};

export const createLeave = async ({ type, start, end }) => {
  const response = await api.post("/leaves", { type, start, end });
  return response.data;
};

export const updateLeaveStatus = async (leaveId, status) => {
  const response = await api.patch(`/leaves/${leaveId}/status`, { status });
  return response.data;
};
