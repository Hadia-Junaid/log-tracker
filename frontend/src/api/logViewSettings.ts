// src/api/logViewSettings.ts
import axios from "./axios";

export function getLogSettings(userId: string) {
  return axios.get(`/settings/${userId}`);
}

export function updateLogSettings(userId: string, settings: {
  autoRefresh: boolean;
  autoRefreshTime: number;
  logsPerPage: number;
}) {
  return axios.patch(`/settings/${userId}`, settings);
}


// ✅ DELETE settings (reset to defaults)
export function resetLogSettings(userId: string) {
  return axios.delete(`/settings/${userId}`);
}
