import taskApiClient from "./client";

// Get all columns
export const getColumns = async () => {
  const response = await taskApiClient.get("/columns");
  return response.data.data || [];
};

// Get column by ID
export const getColumnById = async (id: string) => {
  const response = await taskApiClient.get(`/columns/${id}`);
  return response.data.data;
};

// Create new column
export const createColumn = async (title: string) => {
  const response = await taskApiClient.post("/columns", { title });
  return response.data.data;
};

// Update column
export const updateColumn = async (id: string, title: string) => {
  const response = await taskApiClient.put(`/columns/${id}`, { title });
  return response.data.data;
};

// Delete column
export const deleteColumn = async (id: string) => {
  const response = await taskApiClient.delete(`/columns/${id}`);
  return response.data.success;
};
