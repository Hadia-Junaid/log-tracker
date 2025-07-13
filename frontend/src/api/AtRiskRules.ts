import axios from "./axios";
import type { AtRiskRule } from "../components/logviewsettings/AtRiskRules";

export const getAtRiskRules = () => axios.get<AtRiskRule[]>("/at-risk-rules");

export const addAtRiskRule = (rule: AtRiskRule) =>
    axios.post("/at-risk-rules", rule);

export const updateAtRiskRule = (id: string, rule: AtRiskRule) =>
    axios.patch(`/at-risk-rules/${id}`, rule);

export const deleteAtRiskRule = (id: string) =>
    axios.delete(`/at-risk-rules/${id}`);
