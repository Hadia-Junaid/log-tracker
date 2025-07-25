import axios from "axios";

const api = axios.create({
  baseURL: process.env.BACKEND_URL,
  withCredentials: true,   // always send cookies
});

export const isAxiosError = axios.isAxiosError;
export default api;
