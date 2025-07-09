/** @jsxImportSource preact */
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import AutoRefresh from "./AutoRefresh";
import LogsPerPage from "./LogsPerPage";
import AtRiskRules from "./AtRiskRules";
import {
  getLogSettings,
  updateLogSettings,
  resetLogSettings,
} from "../../api/logViewSettings";
import axios from "../../api/axios";
import "ojs/ojbutton";
import "ojs/ojmessages";
import "ojs/ojformlayout";
import "../../styles/settings/SettingsPanel.css";
import type { LogsPerPageValue } from "./LogsPerPage";

type MessageItem = {
  severity: "error" | "confirmation" | "warning" | "info";
  summary: string;
  detail: string;
};

const SettingsPanel = () => {
  const [userId, setUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshTime, setAutoRefreshTime] = useState<number>(30);
  const [logsPerPage, setLogsPerPage] = useState<LogsPerPageValue>("50");
  const [originalSettings, setOriginalSettings] = useState({
    autoRefresh: false,
    autoRefreshTime: 30,
    logsPerPage: "50" as LogsPerPageValue,
  });
  const [message, setMessage] = useState<MessageItem | null>(null);

  useEffect(() => {
    axios
      .get("/auth/status")
      .then((res) => {
        console.log("Auth status response:", res.data);
        const user = res.data.user;
        if (user) {
          setUserId(user._id);
          setIsAdmin(user.is_admin === true);
          return getLogSettings(user._id);
        } else {
          throw new Error("User not found in auth status");
        }
      })
      .then((res) => {
        const { autoRefresh, autoRefreshTime, logsPerPage } = res.data;
        setAutoRefresh(autoRefresh);
        setAutoRefreshTime(autoRefreshTime);
        setLogsPerPage(String(logsPerPage) as LogsPerPageValue);
        setOriginalSettings({
          autoRefresh,
          autoRefreshTime,
          logsPerPage: String(logsPerPage) as LogsPerPageValue,
        });
      })
      .catch((err) => {
        console.error("Error loading settings:", err);
        setMessage({
          severity: "error",
          summary: "Error",
          detail: "Failed to load settings",
        });
      });
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const hasChanges =
    autoRefresh !== originalSettings.autoRefresh ||
    autoRefreshTime !== originalSettings.autoRefreshTime ||
    logsPerPage !== originalSettings.logsPerPage;

  const handleSave = () => {
    if (!userId || !hasChanges) return;
    updateLogSettings(userId, {
      autoRefresh,
      autoRefreshTime,
      logsPerPage: parseInt(logsPerPage),
    })
      .then(() => {
        setMessage({
          severity: "confirmation",
          summary: "Success",
          detail: "Settings updated successfully",
        });
        setOriginalSettings({ autoRefresh, autoRefreshTime, logsPerPage });
      })
      .catch(() =>
        setMessage({
          severity: "error",
          summary: "Update Failed",
          detail: "Could not update settings",
        })
      );
  };

  const handleReset = () => {
    if (!userId) return;
    resetLogSettings(userId)
      .then(() => {
        setAutoRefresh(false);
        setAutoRefreshTime(30);
        setLogsPerPage("10" as LogsPerPageValue);
        setMessage({
          severity: "confirmation",
          summary: "Reset Successful",
          detail: "Settings have been reset to defaults.",
        });
        setOriginalSettings({
          autoRefresh: false,
          autoRefreshTime: 30,
          logsPerPage: "10" as LogsPerPageValue,
        });
      })
      .catch(() =>
        setMessage({
          severity: "error",
          summary: "Reset Failed",
          detail: "Could not reset settings.",
        })
      );
  };

  return (
    <div class="settings-page">
      {/* Global Messages */}
      {message && (
        <div class="settings-global-messages">
          <oj-messages messages={[message]} display="general" />
        </div>
      )}

      <div class="settings-grid">
        {/* Log Display Settings Card */}
        <div class="settings-card">
          <div class="settings-card-header">
            <div class="settings-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17.5-3.5L19 12l3.5 3.5M6.5 8.5L5 12l-3.5 3.5"></path>
              </svg>
            </div>
            <div class="settings-card-title-section">
              <h2 class="settings-card-title">Log Display Settings</h2>
              <p class="settings-card-subtitle">Configure how logs are displayed and filtered.</p>
            </div>
          </div>

          <div class="settings-card-content">
            {/* Auto-refresh Section */}
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">Auto-refresh logs</div>
                <div class="setting-description">
                  Automatically refresh logs every{" "}
                  {autoRefresh && (
                    <span class="refresh-time-inline">
                      <input
                        type="number"
                        class="time-input"
                        value={autoRefreshTime}
                        onChange={(e) => setAutoRefreshTime(Number(e.currentTarget.value))}
                        min="5"
                        max="300"
                      />
                    </span>
                  )}{" "}
                  seconds
                </div>
              </div>
              <div class="setting-control">
                <AutoRefresh value={autoRefresh} onChange={setAutoRefresh} />
              </div>
            </div>

            {/* Logs Per Page Section */}
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">Logs per page</div>
                <div class="setting-description">Number of log entries to display per page</div>
              </div>
              <div class="setting-control">
                <LogsPerPage value={logsPerPage} onChange={setLogsPerPage} />
              </div>
            </div>
          </div>

          {/* Card Actions */}
          <div class="settings-card-actions">
            <oj-button
              chroming="outlined"
              class="reset-button"
              onojAction={handleReset}
            >
              Reset to Defaults
            </oj-button>
            <oj-button
              chroming="solid"
              class="save-button"
              disabled={!hasChanges}
              onojAction={handleSave}
            >
              Save Settings
            </oj-button>
          </div>
        </div>

        {/* Data Retention Card */}
        <div class="settings-card">
          <div class="settings-card-header">
            <div class="settings-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                <path d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2h-4a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="settings-card-title-section">
              <h2 class="settings-card-title">Data Retention</h2>
              <p class="settings-card-subtitle">Configure how long logs are stored in the system.</p>
            </div>
          </div>

          <div class="settings-card-content">
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">Log retention period</div>
                <div class="setting-description">Logs older than the retention period will be automatically deleted.</div>
              </div>
              <div class="setting-control">
                <select class="retention-select">
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* At Risk Rules Card - Only for Admins */}
        {isAdmin && (
          <div class="settings-card settings-card-full-width">
            <div class="settings-card-header">
              <div class="settings-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <div class="settings-card-title-section">
                <h2 class="settings-card-title">At Risk App Rules</h2>
                <p class="settings-card-subtitle">Configure rules to mark apps as at risk based on log thresholds.</p>
              </div>
            </div>

            <div class="settings-card-content">
              <AtRiskRules isAdmin={isAdmin} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;