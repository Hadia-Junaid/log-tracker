/** @jsxImportSource preact */
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import {
  getAtRiskRules,
  addAtRiskRule,
  updateAtRiskRule,
  deleteAtRiskRule,
} from "../../api/AtRiskRules";
import "ojs/ojbutton";
import "ojs/ojmessages";
import "../../styles/settings/AtRiskRules.css";
import LoadingSpinner from "../../components/LoadingSpinner";

export interface AtRiskRule {
  _id?: string;
  type_of_logs: string;
  operator: string;
  unit: string;
  time: number;
  number_of_logs: number;
}

interface MessageItem {
  severity: "error" | "confirmation" | "warning" | "info";
  summary: string;
  detail: string;
}

const AtRiskRules = ({ isAdmin }: { isAdmin: boolean }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<AtRiskRule[]>([]);
  const [message, setMessage] = useState<MessageItem | null>(null);

  /* ───────────── Load existing rules ───────────── */
  useEffect(() => {
    if (!isAdmin) return;
    getAtRiskRules()
      .then((res) => setRules(res.data))
      .catch(() =>
        setMessage({
          severity: "error",
          summary: "Error",
          detail: "Failed to load at‑risk rules.",
        }),
      )
      .finally(() => setLoading(false));
  }, [isAdmin]);

  /* ───────────── Add new rule row ───────────── */
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

  /* ───────────── Sanitize payload ───────────── */
  const sanitizeRuleForPatch = (rule: AtRiskRule) => {
    const { type_of_logs, operator, unit, time, number_of_logs } = rule;
    return { type_of_logs, operator, unit, time, number_of_logs };
  };

  /* ───────────── Persist changes ───────────── */
  const handleSave = async () => {
    try {
      setSaving(true);
      for (const rule of rules) {
        const cleaned = sanitizeRuleForPatch(rule);
        if (!rule._id) {
          await addAtRiskRule(cleaned);
        } else {
          await updateAtRiskRule(rule._id, cleaned);
        }
      }
      const updated = await getAtRiskRules();
      setRules(updated.data);
      setMessage({
        severity: "confirmation",
        summary: "Rules Updated",
        detail: "Rules updated successfully.",
      });
    } catch (error: any) {
      console.error("Save failed:", error);
      if (error.response?.status === 409) {
        setMessage({
          severity: "error",
          summary: "Duplicate Rule",
          detail: "A rule with the same log type and operator already exists.",
        });
      } else {
        setMessage({
          severity: "error",
          summary: "Update Failed",
          detail: "Could not update rules. Please check and try again.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  /* ───────────── Delete rule row ───────────── */
  const handleDelete = async (idx: number) => {
    const rule = rules[idx];
    try {
      if (rule._id) {
        await deleteAtRiskRule(rule._id);
      }
      setRules(rules.filter((_, i) => i !== idx));
      setMessage({
        severity: "confirmation",
        summary: "Rule Deleted",
        detail: "Rule deleted successfully.",
      });
    } catch (error) {
      console.error("Delete failed:", error);
      setMessage({
        severity: "error",
        summary: "Delete Failed",
        detail: "Could not delete the rule. Please try again.",
      });
    }
  };

  const updateRule = (
    idx: number,
    field: keyof AtRiskRule,
    value: string | number,
  ) => {
    setRules(
      rules.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    );
  };

  /* ───────────── Auto-clear messages ───────────── */
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(id);
  }, [message]);

  if (!isAdmin) return null;
  if (loading) return <LoadingSpinner message="Loading At‑Risk Rules…" />;

  /* ───────────── Render ───────────── */
  return (
    <div class="atrisk-container">
      {/* header */}
      <div class="atrisk-header">
        <h3 class="atrisk-title">At Risk App Rules</h3>
        <p class="atrisk-description">
          Configure rules to mark apps as at risk if they haven’t received
          enough logs of a certain type in a given time window.
        </p>
      </div>

      {/* rule list */}
      <div class="atrisk-rules-list">
        {rules.length === 0 ? (
          <div class="atrisk-empty-state">
            <p>No rules configured. Add your first at‑risk rule to get started.</p>
          </div>
        ) : (
          rules.map((r, i) => (
            <div class="atrisk-rule-card" key={i}>
              <div class="atrisk-rule-header">
                <span>Rule {i + 1}</span>
                <button
                  title="Delete rule"
                  class="atrisk-delete-btn"
                  onClick={() => handleDelete(i)}
                >
                  ✖
                </button>
              </div>
              <div class="atrisk-rule-content">
                If an app receives
                <select
                  class="atrisk-select"
                  value={r.operator}
                  onChange={(e) =>
                    updateRule(i, "operator", e.currentTarget.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="less">less</option>
                  <option value="more">more</option>
                </select>
                <input
                  class="atrisk-input"
                  type="number"
                  min="1"
                  value={r.number_of_logs}
                  onChange={(e) =>
                    updateRule(i, "number_of_logs", +e.currentTarget.value || 0)
                  }
                />
                <select
                  class="atrisk-select"
                  value={r.type_of_logs}
                  onChange={(e) =>
                    updateRule(i, "type_of_logs", e.currentTarget.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="Error">Error</option>
                  <option value="Info">Info</option>
                  <option value="Warning">Warning</option>
                </select>
                logs in the last
                <input
                  class="atrisk-input"
                  type="number"
                  min="1"
                  value={r.time}
                  onChange={(e) =>
                    updateRule(i, "time", +e.currentTarget.value || 1)
                  }
                />
                <select
                  class="atrisk-select"
                  value={r.unit}
                  onChange={(e) => updateRule(i, "unit", e.currentTarget.value)}
                >
                  <option value="">Select</option>
                  <option value="Minutes">Minutes</option>
                  <option value="Hours">Hours</option>
                  <option value="Days">Days</option>
                </select>
                mark as at risk.
              </div>
            </div>
          ))
        )}
      </div>

      {/* actions */}
      <div class="atrisk-actions">
        <oj-button chroming="outlined" class="atrisk-add-btn" onojAction={handleAddRule}>
          Add Rule
        </oj-button>
        {rules.length > 0 && (
          <oj-button
            chroming="solid"
            disabled={saving}
            class="atrisk-save-btn"
            onojAction={handleSave}
          >
            {saving ? "Saving…" : "Save Rules"}
          </oj-button>
        )}
      </div>

      {/* messages */}
      {message && (
        <div class="atrisk-messages">
          <oj-messages messages={[message]} display="general" />
        </div>
      )}
    </div>
  );
};

export default AtRiskRules;
