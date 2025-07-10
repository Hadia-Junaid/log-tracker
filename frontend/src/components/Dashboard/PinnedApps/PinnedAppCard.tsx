/** @jsx h */
import { h } from "preact";
import { Pin } from "lucide-preact";
import CardRow from "../utils/CardRow";
import { PinnedApp } from "../types";
import "../../../styles/dashboard/pinnedapps.css";

const PinnedAppCard = ({ app }: { app: PinnedApp }) => {
  const totalLogs =
    (app.logCounts.INFO ?? 0) +
    (app.logCounts.WARN ?? 0) +
    (app.logCounts.ERROR ?? 0);

  return (
    <div class="pinned-card oj-panel" role="button" tabindex={0}>
      <div class="pinned-card-header">
        <span class="pinned-card-title">{app.appName}</span>
        <Pin class="oj-icon-size-sm oj-text-color-secondary padding-right-sm" aria-hidden="true" />
      </div>

      <div class="pinned-card-body">
        <CardRow labelClass="card-row-logs-label" label="Logs" value={totalLogs.toLocaleString()} badge="NEUTRAL" />
        <CardRow label="Info" value={(app.logCounts.INFO ?? 0).toLocaleString()} badge="INFO" />
        <CardRow label="Warn" value={(app.logCounts.WARN ?? 0).toLocaleString()} badge="WARN" />
        <CardRow label="Error" value={(app.logCounts.ERROR ?? 0).toLocaleString()} badge="ERROR" />
      </div>
    </div>
  );
};

export default PinnedAppCard;
