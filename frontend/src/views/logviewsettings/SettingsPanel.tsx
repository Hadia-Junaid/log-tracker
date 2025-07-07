/** @jsxImportSource preact */
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import AutoRefresh from "./AutoRefresh";
import LogsPerPage from "./LogsPerPage";
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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshTime, setAutoRefreshTime] = useState<number>(30);
  const [logsPerPage, setLogsPerPage] = useState<LogsPerPageValue>("50");
  const [originalSettings, setOriginalSettings] = useState({
    autoRefresh: false,
    autoRefreshTime: 30,
    logsPerPage: "50" as LogsPerPageValue,
  });
  const [message, setMessage] = useState<MessageItem | null>(null);

  const refreshOptions = [15, 30, 60];

  useEffect(() => {
    axios
      .get("/auth/status")
      .then((res) => {
        const uid = res.data?.user?._id;
        if (uid) {
          setUserId(uid);
          return getLogSettings(uid);
        } else {
          throw new Error("User ID not found");
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
      .catch(() =>
        setMessage({
          severity: "error",
          summary: "Error",
          detail: "Failed to load settings",
        })
      );
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
    {
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
    }
  };

  return (
    <div class="settings-container">
      <div class="settings-card">
        {/* Header Section */}
        <div class="settings-header">
          <div class="settings-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17.5-3.5L19 12l3.5 3.5M6.5 8.5L5 12l-3.5 3.5"></path>
            </svg>
          </div>
          <div class="settings-title-section">
            <h2 class="settings-title">Log Display Settings</h2>
            <p class="settings-subtitle">Configure how logs are displayed and filtered.</p>
          </div>
        </div>

        {/* Settings Content */}
        <div class="settings-content">
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

          {/* Logs per page Section */}
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

        {/* Action Buttons */}
        <div class="settings-actions">
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

        {/* Messages */}
        {message && (
          <div class="settings-messages">
            <oj-messages messages={[message]} display="general" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;