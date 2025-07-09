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
  const newRule: AtRiskRule = {
    type_of_logs: "",
    operator: "",
    unit: "",
    time: 0,
    number_of_logs: 0,
  };
  setRules([...rules, newRule]);
};

  const sanitizeRuleForPatch = (rule: AtRiskRule) => {
    const { type_of_logs, operator, unit, time, number_of_logs } = rule
    return { type_of_logs, operator, unit, time, number_of_logs }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      for (const rule of rules) {
        const cleaned = sanitizeRuleForPatch(rule)
        if (!rule._id) {
          await addAtRiskRule(cleaned)
        } else {
          await updateAtRiskRule(rule._id, cleaned)
        }
      }
      const updated = await getAtRiskRules()
      setRules(updated.data)
      setMessage({
        severity: "confirmation",
        summary: "Rules Updated",
        detail: "All rules have been saved successfully.",
      })
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
          summary: "Update Failed",
          detail: "Could not save rules. Please check your configuration.",
        })
      }
    } finally {
      setTimeout(() => setSaving(false), 500)
    }
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

  const updateRule = (idx: number, field: keyof AtRiskRule, value: string | number) => {
    setRules(rules.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
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
              key={i}
              style={`animation-delay: ${i * 0.1}s`}
            >
              <div class="atrisk-rule-header">
                <div class="rule-badge-container">
                  <span class="rule-number">Rule #{i + 1}</span>
                  <span class="rule-status">Active</span>
                </div>
                <button
                  title="Delete rule"
                  class="atrisk-delete-btn"
                  onClick={() => handleDelete(i)}
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
                <div class="rule-sentence">
                  <span class="sentence-part">If an application receives</span>

                  <div class="input-group">
                    <select
                      class="professional-select operator-select"
                      value={r.operator}
                      onChange={(e) => updateRule(i, "operator", e.currentTarget.value)}
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
                      value={r.number_of_logs}
                      onChange={(e) => updateRule(i, "number_of_logs", +e.currentTarget.value || 0)}
                    />
                  </div>

                  <div class="input-group">
                    <select
                      class="professional-select log-type-select"
                      value={r.type_of_logs}
                      onChange={(e) => updateRule(i, "type_of_logs", e.currentTarget.value)}
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
                      value={r.time}
                      onChange={(e) => updateRule(i, "time", +e.currentTarget.value || 1)}
                    />
                  </div>

                  <div class="input-group">
                    <select
                      class="professional-select unit-select"
                      value={r.unit}
                      onChange={(e) => updateRule(i, "unit", e.currentTarget.value)}
                    >
                      <option value="">Select unit</option>
                      <option value="Minutes">Minutes</option>
                      <option value="Hours">Hours</option>
                      <option value="Days">Days</option>
                    </select>
                  </div>
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
            </div>
          ))
        )}
      </div>

      {rules.length > 0 && (
        <div class="atrisk-actions">
          <oj-button chroming="outlined" class="atrisk-add-btn" onojAction={handleAddRule}>
            <span slot="startIcon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14m-7-7h14" />
              </svg>
            </span>
            Add Rule
          </oj-button>

          <oj-button chroming="solid" class="atrisk-save-btn" disabled={saving} onojAction={handleSave}>
            {saving ? (
              <div class="button-content">
                <div class="save-spinner"></div>
                <span>Saving Rules...</span>
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
                <span>Save All Rules</span>
              </div>
            )}
          </oj-button>
        </div>
      )}

      {message && (
        <div class="atrisk-messages">
          <oj-messages messages={[message]} display="general" />
        </div>
      )}
    </div>
  )
}

export default AtRiskRules
