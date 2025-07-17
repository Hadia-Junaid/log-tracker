/** @jsxImportSource preact */
import { h } from "preact";
//import "../../styles/settings/DataRetention.css";

type Props = {
  value: string;                         // e.g. "30"
  onChange: (value: string) => void;
};

const OPTIONS = [
  { value: "1",   label: "24 hours" },
  { value: "7",   label: "7 days" },
  { value: "14",  label: "14 days" },    
  { value: "30",  label: "30 days" },
];


const DataRetention = ({ value, onChange }: Props) => {
  return (
    <div class="setting-item">
      <div class="setting-info">
        <div class="setting-label">
          <span class="label-text">Retention Period</span>
          <span class="label-badge label-badge-info">Auto‑cleanup</span>
        </div>
        <div class="setting-description">
          Logs older than this period will be automatically removed from the system
        </div>
      </div>

      <div class="setting-control">
        <div class="retention-container">
          <select
            class="retention-select"
            value={value}
            onChange={(e) => onChange(e.currentTarget.value)}
          >
            {/* Placeholder option when no value is set yet */}
            {!value && (
              <option value="" disabled hidden>
                Select retention period
              </option>
            )}

            {OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          
        </div>
        
      </div>
                <div style={{ height: "200px" }} />

    </div>
  );
};

export default DataRetention;
