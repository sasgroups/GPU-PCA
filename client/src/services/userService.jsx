// src/services/userService.js
import axios from "axios";
import { BASE_URL } from "../config";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const fetchOperatorsAPI = () =>
  axios.get(`${BASE_URL}/api/users/operators`, { headers: authHeader() });

export const addOperatorAPI = (data) =>
  axios.post(`${BASE_URL}/api/users/add-operator`, data, {
    headers: authHeader(),
  });

export const deleteOperatorAPI = (id) =>
  axios.delete(`${BASE_URL}/api/users/operator/${id}`, {
    headers: authHeader(),
  });

export const resetPasswordAPI = (id, newPassword) =>
  axios.put(
    `${BASE_URL}/api/users/operator/${id}/reset-password`,
    { newPassword },
    { headers: authHeader() }
  );
