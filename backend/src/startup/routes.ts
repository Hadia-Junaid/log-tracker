import { Application } from "express";
import authRoutes from "../routes/auth.route";
import adminRoutes from "../routes/admin.route";
import userGroupRoutes from "../routes/userGroup.route";
import applications from "../routes/application.route";
import settingsRoutes from "../routes/settings.route";
import atRiskRuleRoutes from "../routes/atRiskRule.route";
import dashboardRoutes from "../routes/dashboard.route";
import dataRetentionRoutes from "../routes/dataRetention.route";
import logsRoutes from "../routes/logs.route";

export function setupRoutes(app: Application): void {
  app.use("/api/data-retention", dataRetentionRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/at-risk-rules", atRiskRuleRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/user-groups", userGroupRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/applications", applications);
  app.use("/api/logs", logsRoutes);
}
