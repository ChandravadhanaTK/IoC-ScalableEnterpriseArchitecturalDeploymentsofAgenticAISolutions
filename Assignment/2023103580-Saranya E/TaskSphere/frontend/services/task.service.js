import api from "@/lib/axios";

export const getTasks = async (
  page = 1,
  limit = 10,
  status = ""
) => {
  const response = await api.get(
    `/tasks?page=${page}&limit=${limit}&status=${status}`
  );

  return response.data;
};

export const createTask = async (data) => {
  const response = await api.post("/tasks", data);
  return response.data;
};

export const updateTask = async (id, data) => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const getTaskById = async (id) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};