"use client"
import { useState, useEffect } from "preact/hooks"
import AutoRefresh from "./AutoRefresh"
import LogsPerPage from "./LogsPerPage"
import AtRiskRules from "./AtRiskRules"
import { getLogSettings, updateLogSettings, resetLogSettings } from "../../api/logViewSettings"
import axios from "../../api/axios"
import "ojs/ojbutton"
import "ojs/ojmessages"
import "ojs/ojformlayout"
import "ojs/ojanimation"
import "../../styles/settings/SettingsPanel.css"
import type { LogsPerPageValue } from "./LogsPerPage"
import type { AtRiskRule } from "./AtRiskRules"
import { useUser } from "../../context/UserContext"


type MessageItem = {
  severity: "error" | "confirmation" | "warning" | "info"
  summary: string
  detail: string
}

const SettingsPanel = () => {
  const [userId, setUserId] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshTime, setAutoRefreshTime] = useState<number>(30)
  const [logsPerPage, setLogsPerPage] = useState<LogsPerPageValue>("25")
  const [retentionPeriod, setRetentionPeriod] = useState<string>("30")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [originalSettings, setOriginalSettings] = useState({
    autoRefresh: false,
    autoRefreshTime: 30,
    logsPerPage: "50" as LogsPerPageValue,
  })
  const [message, setMessage] = useState<MessageItem | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Risk Rules Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [currentRule, setCurrentRule] = useState<AtRiskRule | null>(null)
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null)

  //Use the user context to know if the user is an admin
  const { user } = useUser()



  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    setUserId(user._id)
    setIsAdmin(user.is_admin === true)
    getLogSettings(user._id)
      .then((res) => {
        const { autoRefresh, autoRefreshTime, logsPerPage } = res.data
        setAutoRefresh(autoRefresh)
        setAutoRefreshTime(autoRefreshTime)
        setLogsPerPage(String(logsPerPage) as LogsPerPageValue)
        setOriginalSettings({
          autoRefresh,
          autoRefreshTime,
          logsPerPage: String(logsPerPage) as LogsPerPageValue,
        })
      })
      .catch((err) => {
        console.error("Error loading settings:", err)
        setMessage({
          severity: "error",
          summary: "Error",
          detail: "Failed to load settings",
        })
      })
      .finally(() => {
        setTimeout(() => setIsLoading(false), 800)
      })
  }, [user])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const hasChanges =
    autoRefresh !== originalSettings.autoRefresh ||
    autoRefreshTime !== originalSettings.autoRefreshTime ||
    logsPerPage !== originalSettings.logsPerPage

  const handleSaveInitiate = () => {
    if (!userId || !hasChanges) return
    setShowConfirmation(true)
  }

  const handleSaveConfirm = async () => {
    setShowConfirmation(false)
    setIsSaving(true)
    try {
      await updateLogSettings(userId, {
        autoRefresh,
        autoRefreshTime,
        logsPerPage: Number.parseInt(logsPerPage),
      })
      setMessage({
        severity: "confirmation",
        summary: "Success",
        detail: "Changes Updated Successfully",
      })
      setOriginalSettings({ autoRefresh, autoRefreshTime, logsPerPage })
    } catch (error) {
      setMessage({
        severity: "error",
        summary: "Update Failed",
        detail: "Could not update settings",
      })
    } finally {
      setTimeout(() => setIsSaving(false), 500)
    }
  }

  const handleSaveCancel = () => {
    setShowConfirmation(false)
    setMessage({
      severity: "info",
      summary: "Action Cancelled",
      detail: "Settings changes were not saved.",
    })
  }

  const handleReset = async () => {
    if (!userId) return
    setIsSaving(true)
    try {
      await resetLogSettings(userId)
      setAutoRefresh(false)
      setAutoRefreshTime(30)
      setLogsPerPage("10" as LogsPerPageValue)
      setMessage({
        severity: "confirmation",
        summary: "Reset Successful",
        detail: "Settings have been reset to defaults.",
      })
      setOriginalSettings({
        autoRefresh: false,
        autoRefreshTime: 30,
        logsPerPage: "10" as LogsPerPageValue,
      })
    } catch (error) {
      setMessage({
        severity: "error",
        summary: "Reset Failed",
        detail: "Could not reset settings.",
      })
    } finally {
      setTimeout(() => setIsSaving(false), 500)
    }
  }

  // Risk Rules Modal Functions
  const handleAddRule = () => {
    setCurrentRule({
      type_of_logs: "",
      operator: "",
      unit: "Minutes",
      time: 1,
      number_of_logs: 1,
    })
    setEditingRuleIndex(null)
    setIsRuleModalOpen(true)
  }

  const handleEditRule = (rule: AtRiskRule, index: number) => {
    setCurrentRule({ ...rule })
    setEditingRuleIndex(index)
    setIsRuleModalOpen(true)
  }

  const handleCloseRuleModal = () => {
    setIsRuleModalOpen(false)
    setCurrentRule(null)
    setEditingRuleIndex(null)
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
            {hasChanges && (
              <div class="unsaved-indicator">
                <div class="unsaved-dot"></div>
                <span>Unsaved changes</span>
              </div>
            )}
            {isAdmin && (
              <oj-button chroming="outlined" class="quick-add-rule-btn" onojAction={handleAddRule}>
                <span slot="startIcon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14m-7-7h14" />
                  </svg>
                </span>
                Quick Add Rule
              </oj-button>
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

              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">
                    <span class="label-text">Pagination</span>
                  </div>
                  <div class="setting-description">Number of log entries displayed per page</div>
                </div>
                <div class="setting-control">
                  <LogsPerPage value={logsPerPage} onChange={setLogsPerPage} />
                </div>
              </div>
            </div>

            <div class="settings-card-actions">
              <oj-button chroming="outlined" class="reset-button" disabled={isSaving} onojAction={handleReset}>
                <span slot="startIcon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                </span>
                {isSaving ? "Resetting..." : "Reset Defaults"}
              </oj-button>
              <oj-button
                chroming="solid"
                class={`save-button ${hasChanges ? "save-button-active" : ""}`}
                disabled={!hasChanges || isSaving}
                onojAction={handleSaveInitiate}
              >
                {isSaving ? (
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

          {/* Data Retention Card */}
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
            </div>

            <div class="settings-card-content">
              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">
                    <span class="label-text">Retention Period</span>
                    <span class="label-badge label-badge-info">Auto-cleanup</span>
                  </div>
                  <div class="setting-description">Logs older than this period will be automatically removed</div>
                </div>
                <div class="setting-control">
                  <select
                    class="retention-select"
                    value={retentionPeriod}
                    onChange={(e) => setRetentionPeriod(e.currentTarget.value)}
                  >
                    <option value="7">7 days</option>
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
                  editingIndex={editingRuleIndex}
                  onAddRule={handleAddRule}
                  onEditRule={handleEditRule}
                  onCloseModal={handleCloseRuleModal}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div class="modal-overlay">
          <div class="modal-content confirmation-modal">
            <div class="modal-header">
              <div class="modal-icon confirmation-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="modal-title">Confirm Changes</h3>
              <button class="modal-close-btn" onClick={handleSaveCancel}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="modal-message">Are you sure you want to save these changes?</p>
              <p class="modal-submessage">This will apply your new settings immediately.</p>
            </div>
            <div class="modal-footer">
              <oj-button chroming="outlined" class="modal-cancel-btn" onojAction={handleSaveCancel} disabled={isSaving}>
                Cancel
              </oj-button>
              <oj-button chroming="solid" class="modal-confirm-btn" onojAction={handleSaveConfirm} disabled={isSaving}>
                {isSaving ? (
                  <div class="button-content">
                    <div class="button-spinner"></div>
                    <span>Confirming...</span>
                  </div>
                ) : (
                  <span>Confirm</span>
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
