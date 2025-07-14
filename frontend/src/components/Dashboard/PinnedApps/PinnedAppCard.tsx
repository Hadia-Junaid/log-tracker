/** @jsx h */
import { h } from "preact";
import { PinOff } from "lucide-preact";
import CardRow from "../utils/CardRow";
import { PinnedApp } from "../types";
import "../../../styles/dashboard/pinnedapps.css";
import axios from "../../../api/axios";
interface Props {
  app: PinnedApp;
  userId: string | undefined;
  onUnpin?: (id: string) => () => void;
}


const PinnedAppCard = ({ app, userId, onUnpin: onUnpin }: Props) => {
  const totalLogs =
    (app.logCounts.INFO ?? 0) +
    (app.logCounts.WARN ?? 0) +
    (app.logCounts.ERROR ?? 0) +
    (app.logCounts.DEBUG ?? 0);

  const handleUnpin = async () => {
    if (!userId || !app._id) return;

  const rollback = onUnpin?.(app._id);

  try {
    await axios.patch(`/dashboard/pinned/${userId}/${app._id}`);
  } catch (err) {
    console.error("Failed to unpin app", err);
    rollback?.(); // Restore UI if API call fails
  }
  };

  return (
    <div class="pinned-card oj-panel" role="button" tabindex={0}>
      <div class="pinned-card-header">
        <span class="pinned-card-title">{app.appName}</span>
        <PinOff
          class="oj-icon-size-sm oj-text-color-secondary padding-right-sm unpin-icon"
          aria-hidden="true"
          onClick={(e) => {
            e.stopPropagation();
            handleUnpin();
          }}
        />
      </div>

      <div class="pinned-card-body">
        <CardRow labelClass="card-row-logs-label" label="Logs" value={totalLogs.toLocaleString()} badge="NEUTRAL" />
        <CardRow label="Info" value={(app.logCounts.INFO ?? 0).toLocaleString()} badge="INFO" />
        <CardRow label="Warn" value={(app.logCounts.WARN ?? 0).toLocaleString()} badge="WARN" />
        <CardRow label="Error" value={(app.logCounts.ERROR ?? 0).toLocaleString()} badge="ERROR" />
        <CardRow label="Debug" value={(app.logCounts.DEBUG ?? 0).toLocaleString()} badge="DEBUG" />
      </div>
    </div>
  );
};

export default PinnedAppCard;
