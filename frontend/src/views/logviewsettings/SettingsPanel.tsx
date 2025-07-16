"use client"
import { useState, useEffect } from "preact/hooks"
import AutoRefresh from "./AutoRefresh"
import LogsPerPage from "./LogsPerPage"
import AtRiskRules from "./AtRiskRules"
import DataRetention from "./dataRetention"
import { getLogSettings, updateLogSettings, resetLogSettings } from "../../api/logViewSettings"
import { getRetention, updateRetention } from "../../api/DataRetention"
import axios from "../../api/axios"
import type { LogsPerPageValue } from "./LogsPerPage"
import type { AtRiskRule } from "./AtRiskRules"
import "ojs/ojbutton"
import "ojs/ojmessages"
import "ojs/ojformlayout"
import "ojs/ojanimation"
import "../../styles/settings/SettingsPanel.css"

type MessageItem = {
  severity: "error" | "confirmation" | "warning" | "info"
  summary: string
  detail: string
}

const SettingsPanel = () => {
  const [userId, setUserId] = useState("")
  const [userEmail, setUserEmail] = useState("") // ✅ new state for email
  const [isAdmin, setIsAdmin] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshTime, setAutoRefreshTime] = useState(30)
  const [logsPerPage, setLogsPerPage] = useState<LogsPerPageValue>("25")
  const [retentionPeriod, setRetentionPeriod] = useState("30")
  const [originalSettings, setOriginalSettings] = useState({
    autoRefresh: false,
    autoRefreshTime: 30,
    logsPerPage: "25" as LogsPerPageValue,
    retentionPeriod: "30",
  })
  const [message, setMessage] = useState<MessageItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingLogDisplay, setIsSavingLogDisplay] = useState(false)
  const [isSavingDataRetention, setIsSavingDataRetention] = useState(false)
  const [showLogDisplayConfirmation, setShowLogDisplayConfirmation] = useState(false)
  const [showDataRetentionConfirmation, setShowDataRetentionConfirmation] = useState(false)
  const [autoRefreshTimeError, setAutoRefreshTimeError] = useState<string | null>(null)

  // Modal state for AtRiskRules
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [currentRule, setCurrentRule] = useState<AtRiskRule | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  useEffect(() => {
    setIsLoading(true)
    axios
      .get("/auth/status")
      .then(async (res) => {
        const user = res.data.user
        if (!user) throw new Error("User not found")

        setUserId(user.id)
        setUserEmail(user.email) // ✅ capture email
        setIsAdmin(user.is_admin === true)

        const [logRes, retentionRes] = await Promise.all([getLogSettings(user.id), getRetention()])

        const { autoRefresh, autoRefreshTime, logsPerPage } = logRes.data
        const { retentionDays } = retentionRes.data

        setAutoRefresh(autoRefresh)
        setAutoRefreshTime(autoRefreshTime)
        setLogsPerPage(String(logsPerPage) as LogsPerPageValue)
        setRetentionPeriod(String(retentionDays))

        setOriginalSettings({
          autoRefresh,
          autoRefreshTime,
          logsPerPage: String(logsPerPage) as LogsPerPageValue,
          retentionPeriod: String(retentionDays),

        })
      })
      .catch((err) => {
        console.error("Failed to load settings:", err)
        setMessage({
          severity: "error",
          summary: "Error",
          detail: "Failed to load settings. Please refresh and try again.",
        })
      })
      .finally(() => {
        setTimeout(() => setIsLoading(false), 800)
      })
  }, [])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // Add body class management for modal state
  useEffect(() => {
    if (isRuleModalOpen || showLogDisplayConfirmation || showDataRetentionConfirmation) {
      document.body.classList.add("modal-open")
    } else {
      document.body.classList.remove("modal-open")
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("modal-open")
    }
  }, [isRuleModalOpen, showLogDisplayConfirmation, showDataRetentionConfirmation])

  // Check for changes in each section
  const hasLogDisplayChanges =
    autoRefresh !== originalSettings.autoRefresh ||
    autoRefreshTime !== originalSettings.autoRefreshTime ||
    logsPerPage !== originalSettings.logsPerPage

  const hasDataRetentionChanges = retentionPeriod !== originalSettings.retentionPeriod

  // Log Display Save Functions
  const handleLogDisplaySaveInitiate = () => {
    if (!userId || !hasLogDisplayChanges) return
    setShowLogDisplayConfirmation(true)
  }

  const handleLogDisplaySaveConfirm = async () => {
    setShowLogDisplayConfirmation(false)
    setIsSavingLogDisplay(true)
    try {
      await updateLogSettings(userId, {
        autoRefresh,
        autoRefreshTime,
        logsPerPage: Number(logsPerPage),
      })

      setMessage({
        severity: "confirmation",
        summary: "Log Display Settings Saved",
        detail: `Auto-refresh: ${autoRefresh ? "Enabled" : "Disabled"}, Logs per page: ${logsPerPage}`,
      })

      setOriginalSettings((prev) => ({
        ...prev,
        autoRefresh,
        autoRefreshTime,
        logsPerPage,
      }))
    } catch (error) {
      console.error("Log display save failed:", error)
      setMessage({
        severity: "error",
        summary: "Update Failed",
        detail: "Could not save log display settings. Please try again.",
      })
    } finally {
      setTimeout(() => setIsSavingLogDisplay(false), 500)
    }
  }

  const handleLogDisplaySaveCancel = () => {
    setShowLogDisplayConfirmation(false)
    setMessage({
      severity: "info",
      summary: "Action Cancelled",
      detail: "Log display changes were not saved.",
    })
  }

  // Data Retention Save Functions
  const handleDataRetentionSaveInitiate = () => {
    if (!hasDataRetentionChanges) return
    setShowDataRetentionConfirmation(true)
  }

  const handleDataRetentionSaveConfirm = async () => {
    setShowDataRetentionConfirmation(false)
    setIsSavingDataRetention(true)
    try {
      await updateRetention({
        retentionDays: Number(retentionPeriod),
        updatedBy: userEmail, // ✅ required field
      })

      const retentionText =
        retentionPeriod === "7"
          ? "7 days (weekly cleanup)"
          : retentionPeriod === "30"
            ? "30 days (monthly cleanup)"
            : retentionPeriod === "60"
              ? "60 days (bi-monthly cleanup)"
              : retentionPeriod === "90"
                ? "90 days (quarterly cleanup)"
                : retentionPeriod === "180"
                  ? "180 days (semi-annual cleanup)"
                  : retentionPeriod === "365"
                    ? "1 year (annual cleanup)"
                    : `${retentionPeriod} days`

      setMessage({
        severity: "confirmation",
        summary: "Data Retention Updated",
        detail: `Log retention period set to ${retentionText}`,
      })

      setOriginalSettings((prev) => ({
        ...prev,
        retentionPeriod,
      }))
    } catch (error) {
      console.error("Data retention save failed:", error)
      setMessage({
        severity: "error",
        summary: "Update Failed",
        detail: "Could not save data retention settings. Please try again.",
      })
    } finally {
      setTimeout(() => setIsSavingDataRetention(false), 500)
    }
  }

  const handleDataRetentionSaveCancel = () => {
    setShowDataRetentionConfirmation(false)
    setMessage({
      severity: "info",
      summary: "Action Cancelled",
      detail: "Data retention changes were not saved.",
    })
  }

  const handleReset = async () => {
    if (!userId) return
    setIsSavingLogDisplay(true)
    try {
      await resetLogSettings(userId)
      setAutoRefresh(false)
      setAutoRefreshTime(30)
      setLogsPerPage("25" as LogsPerPageValue)

      setMessage({
        severity: "confirmation",
        summary: "Log Display Reset",
        detail: "Log display settings have been reset to defaults.",
      })

      setOriginalSettings((prev) => ({
        ...prev,
        autoRefresh: false,
        autoRefreshTime: 30,
        logsPerPage: "25" as LogsPerPageValue,
      }))
    } catch (error) {
      console.error("Reset failed:", error)
      setMessage({
        severity: "error",
        summary: "Reset Failed",
        detail: "Could not reset log display settings. Please try again.",
      })
    } finally {
      setTimeout(() => setIsSavingLogDisplay(false), 500)
    }
  }

  // Modal functions for AtRiskRules
  const handleAddRule = () => {
    setCurrentRule({
      type_of_logs: "",
      operator: "",
      unit: "Minutes",
      time: 1,
      number_of_logs: 1,
    })
    setEditingIndex(null)
    setIsRuleModalOpen(true)
  }

  const handleEditRule = (rule: AtRiskRule, index: number) => {
    setCurrentRule({ ...rule })
    setEditingIndex(index)
    setIsRuleModalOpen(true)
  }

  const handleCloseRuleModal = () => {
    setIsRuleModalOpen(false)
    setCurrentRule(null)
    setEditingIndex(null)
  }

  if (isLoading) {
    return (
      <div class="settings-loading-container">
        <div class="settings-loading-content">
          <div class="loading-spinner"></div>
          <h3 class="loading-title">Loading Settings</h3>
          <p class="loading-subtitle">Please wait while we prepare your configuration...</p>
        </div>
      </div>
    )
  }

  const isLogDisplaySaveDisabled =
    !hasLogDisplayChanges || isSavingLogDisplay || !!autoRefreshTimeError

  return (
    <div class="settings-page">
      {/* Toast Notifications */}
      {message && (
        <div class={`settings-toast settings-toast-${message.severity}`}>
          <div class="toast-icon">
            {message.severity === "confirmation" && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {message.severity === "error" && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {message.severity === "info" && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <div class="toast-content">
            <div class="toast-title">{message.summary}</div>
            <div class="toast-message">{message.detail}</div>
          </div>
          <button class="toast-close" onClick={() => setMessage(null)}>
            ×
          </button>
        </div>
      )}

      <div class="settings-container">
        {/* Header */}
        <div class="settings-header">
          <div class="settings-header-content">
            <h1 class="settings-main-title">Application Settings</h1>
            <p class="settings-main-subtitle">Configure your preferences and system behavior</p>
          </div>
          <div class="settings-header-actions">
            {(hasLogDisplayChanges || hasDataRetentionChanges) && (
              <div class="unsaved-indicator">
                <div class="unsaved-dot"></div>
                <span>Unsaved changes</span>
              </div>
            )}
          </div>
        </div>

        <div class="settings-grid">
          {/* Log Display Settings Card */}
          <div class="settings-card card-animate">
            <div class="settings-card-header">
              <div class="settings-card-icon settings-icon-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div class="settings-card-title-section">
                <h2 class="settings-card-title">Log Display</h2>
                <p class="settings-card-subtitle">Configure how logs are displayed and refreshed</p>
              </div>
              {hasLogDisplayChanges && (
                <div class="card-changes-indicator">
                  <div class="changes-dot"></div>
                  <span class="changes-text">Modified</span>
                </div>
              )}
            </div>

            <div class="settings-card-content">
              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">
                    <span class="label-text">Auto-refresh</span>
                    <span class="label-badge">Real-time</span>
                  </div>
                  <div class="setting-description">
                    Automatically refresh logs every{" "}
                    {autoRefresh && (
                      <span class="refresh-time-inline">
                        <input
                          type="number"
                          class="time-input"
                          value={autoRefreshTime}
                          onChange={(e) => {
                            const value = Number(e.currentTarget.value)
                            setAutoRefreshTime(value)
                            if (value < 15 || value > 120) {
                              setAutoRefreshTimeError("Auto-refresh time must be between 15 and 120 seconds.")
                            } else {
                              setAutoRefreshTimeError(null)
                            }
                          }}
                          min="5"
                          max="300"
                        />
                      </span>
                    )}{" "}
                    seconds
                    {!autoRefresh && (
                      <span class="current-value-display">(Currently: {autoRefreshTime} seconds when enabled)</span>
                    )}
                  </div>
                  {autoRefreshTimeError && (
                    <div style={{ color: 'var(--error-600)', fontSize: '13px', marginTop: '4px' }}>
                      {autoRefreshTimeError}
                    </div>
                  )}
                </div>
                  <div class="setting-control flex items-center gap-2 justify-end">
                    <AutoRefresh value={autoRefresh} onChange={setAutoRefresh} />
                    {hasLogDisplayChanges && (
                      <div class="unsaved-dot w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </div>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">
                    <span class="label-text">Pagination</span>
                  </div>
                  <div class="setting-description">
                    Number of log entries displayed per page
                    <span class="current-value-display">(Currently: {logsPerPage} entries)</span>
                  </div>
                </div>
                <div class="setting-control">
                  <LogsPerPage value={logsPerPage} onChange={setLogsPerPage} />
                </div>
              </div>
            </div>

            <div class="settings-card-actions">
              <oj-button
                chroming="outlined"
                class="reset-button"
                disabled={isSavingLogDisplay}
                onojAction={handleReset}
              >
                <span slot="startIcon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                </span>
                {isSavingLogDisplay ? "Resetting..." : "Reset Defaults"}
              </oj-button>
              <oj-button
                chroming="solid"
                class={`save-button ${hasLogDisplayChanges ? "save-button-active" : ""}`}
                disabled={isLogDisplaySaveDisabled}
                onojAction={handleLogDisplaySaveInitiate}
              >
                {isSavingLogDisplay ? (
                  <div class="button-content">
                    <div class="button-spinner"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div class="button-content">
                    <span slot="startIcon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17,21 17,13 7,13 7,21" />
                        <polyline points="7,3 7,8 15,8" />
                      </svg>
                    </span>
                    <span>Save Changes</span>
                  </div>
                )}
              </oj-button>
            </div>
          </div>

          {/* Data Retention Card - Only for Admins */}
          {isAdmin && (
            <div class="settings-card card-animate" style="animation-delay: 0.1s">
              <div class="settings-card-header">
                <div class="settings-card-icon settings-icon-secondary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <div class="settings-card-title-section">
                  <h2 class="settings-card-title">Data Retention</h2>
                  <p class="settings-card-subtitle">Manage log storage and cleanup policies</p>
                </div>
                <div class="settings-card-header-right">
                  <div class="admin-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    Admin Access
                  </div>
                  {hasDataRetentionChanges && (
                    <div class="card-changes-indicator">
                      <div class="changes-dot"></div>
                      <span class="changes-text">Modified</span>
                    </div>
                  )}
                </div>
              </div>

              <div class="settings-card-content">
                <DataRetention value={retentionPeriod} onChange={setRetentionPeriod} />
              </div>

              <div class="settings-card-actions">
                <oj-button
                  chroming="solid"
                  class={`save-button ${hasDataRetentionChanges ? "save-button-active" : ""}`}
                  disabled={!hasDataRetentionChanges || isSavingDataRetention}
                  onojAction={handleDataRetentionSaveInitiate}
                >
                  {isSavingDataRetention ? (
                    <div class="button-content">
                      <div class="button-spinner"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div class="button-content">
                      <span slot="startIcon">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17,21 17,13 7,13 7,21" />
                          <polyline points="7,3 7,8 15,8" />
                        </svg>
                      </span>
                      <span>Save Changes</span>
                    </div>
                  )}
                </oj-button>
              </div>
            </div>
          )}

          {/* At Risk Rules Card - Only for Admins */}
          {isAdmin && (
            <div class="settings-card settings-card-full-width card-animate" style="animation-delay: 0.2s">
              <div class="settings-card-header">
                <div class="settings-card-icon settings-icon-warning">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div class="settings-card-title-section">
                  <h2 class="settings-card-title">Risk Management</h2>
                  <p class="settings-card-subtitle">Configure automated risk detection rules</p>
                </div>
                <div class="admin-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  Admin Access
                </div>
              </div>

              <div class="settings-card-content">
                <AtRiskRules
                  isAdmin={isAdmin}
                  isModalOpen={isRuleModalOpen}
                  currentRule={currentRule}
                  editingIndex={editingIndex}
                  onAddRule={handleAddRule}
                  onEditRule={handleEditRule}
                  onCloseModal={handleCloseRuleModal}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Display Confirmation Modal */}
      {showLogDisplayConfirmation && (
        <div class="modal-overlay">
          <div class="modal-content confirmation-modal">
            <div class="modal-header">
              <div class="modal-icon confirmation-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="modal-title">Save Log Display Settings</h3>
              <button class="modal-close-btn" onClick={handleLogDisplaySaveCancel}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="modal-message">Are you sure you want to save the log display changes?</p>
              <p class="modal-submessage">This will update your auto-refresh and pagination settings.</p>
            </div>
            <div class="modal-footer">
              <oj-button
                chroming="outlined"
                class="modal-cancel-btn"
                onojAction={handleLogDisplaySaveCancel}
                disabled={isSavingLogDisplay}
              >
                Cancel
              </oj-button>
              <oj-button
                chroming="solid"
                class="modal-confirm-btn"
                onojAction={handleLogDisplaySaveConfirm}
                disabled={isSavingLogDisplay}
              >
                {isSavingLogDisplay ? (
                  <div class="button-content">
                    <div class="button-spinner"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <span>Save Settings</span>
                )}
              </oj-button>
            </div>
          </div>
        </div>
      )}

      {/* Data Retention Confirmation Modal */}
      {showDataRetentionConfirmation && (
        <div class="modal-overlay">
          <div class="modal-content confirmation-modal">
            <div class="modal-header">
              <div class="modal-icon confirmation-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="modal-title">Save Data Retention Settings</h3>
              <button class="modal-close-btn" onClick={handleDataRetentionSaveCancel}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="modal-message">Are you sure you want to update the data retention period?</p>
              <p class="modal-submessage">Logs will be automatically deleted after {retentionPeriod} days.</p>
            </div>
            <div class="modal-footer">
              <oj-button
                chroming="outlined"
                class="modal-cancel-btn"
                onojAction={handleDataRetentionSaveCancel}
                disabled={isSavingDataRetention}
              >
                Cancel
              </oj-button>
              <oj-button
                chroming="solid"
                class="modal-confirm-btn"
                onojAction={handleDataRetentionSaveConfirm}
                disabled={isSavingDataRetention}
              >
                {isSavingDataRetention ? (
                  <div class="button-content">
                    <div class="button-spinner"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  <span>Update Retention</span>
                )}
              </oj-button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPanel
