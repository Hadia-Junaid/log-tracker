import axios from "./axios"

export const getRetention = () => {
  return axios.get("/data-retention")
}

export const updateRetention = (data: { retentionDays: number; updatedBy: string }) => {
  return axios.patch("/data-retention", data)
}
