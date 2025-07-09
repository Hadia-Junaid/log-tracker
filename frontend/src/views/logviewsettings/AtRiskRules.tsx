"use client"
import { useState, useEffect } from "preact/hooks"
import { getAtRiskRules, addAtRiskRule, updateAtRiskRule, deleteAtRiskRule } from "../../api/AtRiskRules"
import "ojs/ojbutton"
import "ojs/ojmessages"
import "ojs/ojanimation"
import "../../styles/settings/AtRiskRules.css"

export interface AtRiskRule {
  _id?: string
  type_of_logs: string
  operator: string
  unit: string
  time: number
  number_of_logs: number
}

interface MessageItem {
  severity: "error" | "confirmation" | "warning" | "info"
  summary: string
  detail: string
}

const AtRiskRules = ({ isAdmin }: { isAdmin: boolean }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rules, setRules] = useState<AtRiskRule[]>([])
  const [message, setMessage] = useState<MessageItem | null>(null)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentRule, setCurrentRule] = useState<AtRiskRule | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    getAtRiskRules()
      .then((res) => setRules(res.data))
      .catch(() =>
        setMessage({
          severity: "error",
          summary: "Error",
          detail: "Failed to load at‑risk rules.",
        }),
      )
      .finally(() => setTimeout(() => setLoading(false), 600))
  }, [isAdmin])

  const handleAddRule = () => {
    setCurrentRule({
      type_of_logs: "",
      operator: "",
      unit: "Minutes",
      time: 1,
      number_of_logs: 1,
    })
    setEditingIndex(null)
    setIsModalOpen(true)
  }

  const handleEditRule = (rule: AtRiskRule, index: number) => {
    setCurrentRule({ ...rule })
    setEditingIndex(index)
    setIsModalOpen(true)
  }

  const handleModalSave = async () => {
    if (!currentRule) return
    setSaving(true)
    try {
      const cleaned = sanitizeRuleForPatch(currentRule)
      if (currentRule._id) {
        await updateAtRiskRule(currentRule._id, cleaned)
      } else {
        await addAtRiskRule(cleaned)
      }
      const updated = await getAtRiskRules()
      setRules(updated.data)
      setMessage({
        severity: "confirmation",
        summary: "Rule Saved",
        detail: currentRule._id ? "Rule updated successfully." : "New rule added successfully.",
      })
      setIsModalOpen(false)
      setCurrentRule(null)
      setEditingIndex(null)
    } catch (error: any) {
      console.error("Save failed:", error)
      if (error.response?.status === 409) {
        setMessage({
          severity: "error",
          summary: "Duplicate Rule",
          detail: "A rule with the same configuration already exists.",
        })
      } else {
        setMessage({
          severity: "error",
          summary: "Save Failed",
          detail: "Could not save rule. Please check your configuration.",
        })
      }
    } finally {
      setTimeout(() => setSaving(false), 500)
    }
  }

  const handleModalCancel = () => {
    setIsModalOpen(false)
    setCurrentRule(null)
    setEditingIndex(null)
  }

  const sanitizeRuleForPatch = (rule: AtRiskRule) => {
    const { type_of_logs, operator, unit, time, number_of_logs } = rule
    return { type_of_logs, operator, unit, time, number_of_logs }
  }

  const handleDelete = async (idx: number) => {
    const rule = rules[idx]
    setDeletingIndex(idx)
    try {
      if (rule._id) {
        await deleteAtRiskRule(rule._id)
      }
      setTimeout(() => {
        setRules(rules.filter((_, i) => i !== idx))
        setDeletingIndex(null)
        setMessage({
          severity: "confirmation",
          summary: "Rule Deleted",
          detail: "Rule has been removed successfully.",
        })
      }, 300)
    } catch (error) {
      console.error("Delete failed:", error)
      setDeletingIndex(null)
      setMessage({
        severity: "error",
        summary: "Delete Failed",
        detail: "Could not delete the rule. Please try again.",
      })
    }
  }

  const updateCurrentRule = (field: keyof AtRiskRule, value: string | number) => {
    setCurrentRule((prev) => {
      if (!prev) return null
      const parsedValue = field === "number_of_logs" || field === "time" ? +value || 0 : value
      return { ...prev, [field]: parsedValue }
    })
  }

  useEffect(() => {
    if (!message) return
    const id = setTimeout(() => setMessage(null), 4000)
    return () => clearTimeout(id)
  }, [message])

  if (!isAdmin) return null

  if (loading) {
    return (
      <div class="atrisk-loading">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading Risk Management Rules...</p>
        </div>
      </div>
    )
  }

  return (
    <div class="atrisk-container">
      <div class="atrisk-rules-list">
        {rules.length === 0 ? (
          <div class="atrisk-empty-state">
            <div class="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 class="empty-state-title">No Risk Rules Configured</h3>
            <p class="empty-state-description">
              Create automated rules to monitor application health and detect potential issues based on log patterns and
              thresholds.
            </p>
            <oj-button chroming="solid" class="empty-state-button" onojAction={handleAddRule}>
              <span slot="startIcon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14m-7-7h14" />
                </svg>
              </span>
              Create First Rule
            </oj-button>
          </div>
        ) : (
          rules.map((r, i) => (
            <div
              class={`atrisk-rule-card ${deletingIndex === i ? "deleting" : ""}`}
              key={r._id || `new-${i}`}
              style={`animation-delay: ${i * 0.1}s`}
              onClick={() => handleEditRule(r, i)}
            >
              <div class="atrisk-rule-header">
                <div class="rule-badge-container">
                  <span class="rule-number">Rule #{i + 1}</span>
                  <span class="rule-status">Active</span>
                </div>
                <button
                  title="Delete rule"
                  class="atrisk-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(i)
                  }}
                  disabled={deletingIndex === i}
                >
                  {deletingIndex === i ? (
                    <div class="delete-spinner"></div>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>
              <div class="atrisk-rule-content">
                <div class="rule-summary">
                  If an application receives
                  <span class="summary-value">{r.operator === "less" ? " less than " : " more than "}</span>
                  <span class="summary-value">{r.number_of_logs}</span>
                  <span class="summary-value"> {r.type_of_logs} logs</span>
                  within the last
                  <span class="summary-value"> {r.time}</span>
                  <span class="summary-value"> {r.unit}</span>, mark it as at-risk.
                </div>
                <div class="rule-action">
                  <div class="action-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <span class="action-text">Mark application as at risk</span>
                </div>
              </div>
              <div class="rule-edit-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Click to edit</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div class="atrisk-actions">
        {rules.length > 0 && (
          <oj-button chroming="outlined" class="atrisk-add-btn" onojAction={handleAddRule}>
            <span slot="startIcon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14m-7-7h14" />
              </svg>
            </span>
            Add Rule
          </oj-button>
        )}
      </div>

      {message && (
        <div class="atrisk-messages">
          <oj-messages messages={[message]} display="general" />
        </div>
      )}

      {/* Rule Configuration Modal */}
      {isModalOpen && currentRule && (
        <div class="modal-overlay">
          <div class="modal-content rule-modal">
            <div class="modal-header">
              <div class="modal-icon rule-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 class="modal-title">{currentRule._id ? "Edit Rule" : "Add New Rule"}</h3>
              <button class="modal-close-btn" onClick={handleModalCancel}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="rule-sentence-modal">
                <span class="sentence-part">If an application receives</span>
                <div class="input-group">
                  <select
                    class="professional-select operator-select"
                    value={currentRule.operator}
                    onChange={(e) => updateCurrentRule("operator", e.currentTarget.value)}
                  >
                    <option value="">Select condition</option>
                    <option value="less">less than</option>
                    <option value="more">more than</option>
                  </select>
                </div>
                <div class="input-group">
                  <input
                    class="professional-input number-input"
                    type="number"
                    min="1"
                    placeholder="0"
                    value={currentRule.number_of_logs}
                    onChange={(e) => updateCurrentRule("number_of_logs", +e.currentTarget.value)}
                  />
                </div>
                <div class="input-group">
                  <select
                    class="professional-select log-type-select"
                    value={currentRule.type_of_logs}
                    onChange={(e) => updateCurrentRule("type_of_logs", e.currentTarget.value)}
                  >
                    <option value="">Select log type</option>
                    <option value="Error">🔴 Error logs</option>
                    <option value="Warning">🟡 Warning logs</option>
                    <option value="Info">🔵 Info logs</option>
                  </select>
                </div>
                <span class="sentence-part">within the last</span>
                <div class="input-group">
                  <input
                    class="professional-input time-input"
                    type="number"
                    min="1"
                    placeholder="0"
                    value={currentRule.time}
                    onChange={(e) => updateCurrentRule("time", +e.currentTarget.value)}
                  />
                </div>
                <div class="input-group">
                  <select
                    class="professional-select unit-select"
                    value={currentRule.unit}
                    onChange={(e) => updateCurrentRule("unit", e.currentTarget.value)}
                  >
                    <option value="">Select unit</option>
                    <option value="Minutes">Minutes</option>
                    <option value="Hours">Hours</option>
                    <option value="Days">Days</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <oj-button chroming="outlined" class="modal-cancel-btn" onojAction={handleModalCancel} disabled={saving}>
                Cancel
              </oj-button>
              <oj-button chroming="solid" class="modal-confirm-btn" onojAction={handleModalSave} disabled={saving}>
                {saving ? (
                  <div class="button-content">
                    <div class="save-spinner"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <span>Save Rule</span>
                )}
              </oj-button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AtRiskRules
