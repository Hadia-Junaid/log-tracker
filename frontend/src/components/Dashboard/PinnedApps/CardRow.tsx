/** @jsx h */
import { h } from "preact";
import { getLogLevelBadgeClass } from "../utils/badgeUtils";
import { LogLevel } from "../types";

const CardRow = ({
  label,
  value,
  badge,
  labelClass = "",
}: {
  label: string;
  value: string;
  badge?: LogLevel;
  labelClass?: string;
}) => (
  <div class={`card-row ${labelClass}`}>
    <span class="card-row-label">{label}</span>
    {badge ? (
      <span class={getLogLevelBadgeClass(badge)}>
        <span class="card-row-value">{value}</span>
      </span>
    ) : (
      <span class={`card-row-value`}>{value}</span>
    )}
  </div>
);

export default CardRow;
