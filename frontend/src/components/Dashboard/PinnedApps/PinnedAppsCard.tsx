/** @jsx h */
import { h } from "preact";
import { useEffect, useState, useCallback } from "preact/hooks";
import { Pin } from "lucide-preact";
import axios from "../../../api/axios";
import "../../../styles/dashboard/pinnedapps.css";

interface PinnedApp {
  id: string;
  appName: string;
  logCounts: {
    INFO: number;
    WARN: number;
    ERROR: number;
  };
}

type LogLevel = "INFO" | "WARN" | "ERROR" | string;

interface Props {
  userId?: string;
}

const getLogLevelBadgeClass = (log_level: LogLevel): string => {
  switch (log_level) {
    case "INFO":
      return "oj-badge oj-badge-success";
    case "WARN":
      return "oj-badge oj-badge-warning";
    case "ERROR":
      return "oj-badge oj-badge-danger";
    default:
      return "oj-badge oj-badge-neutral";
  }
};

const CardRow = ({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: LogLevel;
}) => (
  <div class="oj-flex oj-sm-justify-content-space-between oj-sm-margin-bottom-2x">
    <span class="oj-typography-caption oj-text-color-secondary">{label}</span>
    {badge ? (
      <span class={`oj-sm-padding-1x-horizontal ${getLogLevelBadgeClass(badge)}`}>
        <span class="oj-typography-body-sm">{value}</span>
      </span>
    ) : (
      <span class="oj-typography-body-sm oj-sm-padding-2x-horizontal">{value}</span>
    )}
  </div>
);

const PinnedAppCard = ({ app }: { app: PinnedApp }) => {
  const totalLogs =
    (app.logCounts.INFO ?? 0) +
    (app.logCounts.WARN ?? 0) +
    (app.logCounts.ERROR ?? 0);

  return (
    <div
      class="oj-flex-item pinned-card-width custom-card-hover oj-panel oj-sm-padding-5x "
      role="button"
      tabindex={0}
    >
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-start oj-sm-margin-bottom-1x">
        <span class="oj-typography-body-lg oj-text-color-primary oj-typography-bold oj-padding-2x-start">
          {app.appName}
        </span>
        <Pin class="oj-icon-size-sm oj-text-color-secondary" aria-hidden="true" />
      </div>

      <div class="oj-sm-margin-top-1x">
        <CardRow label="Logs" value={totalLogs.toLocaleString()} />
        <CardRow
          label="Info"
          value={(app.logCounts.INFO ?? 0).toLocaleString()}
          badge="INFO"
        />
        <CardRow
          label="Warn"
          value={(app.logCounts.WARN ?? 0).toLocaleString()}
          badge="WARN"
        />
        <CardRow
          label="Error"
          value={(app.logCounts.ERROR ?? 0).toLocaleString()}
          badge="ERROR"
        />
      </div>
    </div>
  );
};

const Dashboard: React.FC<Props> = ({ userId }) => {
  const [pinnedApps, setPinnedApps] = useState<PinnedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchPinnedApps() {
      try {
        setLoading(true);
        setError(false);
        const res = await axios.get(`/dashboard/pinned/${userId}`);
        setPinnedApps(res.data.pinned_applications || []);
      } catch (err) {
        console.error("Failed to fetch pinned applications:", err);
        setError(true);
        setPinnedApps([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPinnedApps();
  }, [userId]);

  if (loading) {
    return (
      <div class="oj-sm-padding-6x oj-text-align-center">
        <oj-progress-circle size="md" />
      </div>
    );
  }

  return (
    <div class="oj-panel oj-sm-padding-2x oj-md-padding-4x oj-lg-padding-6x">
      <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between oj-sm-margin-2x-bottom">
        <div class="oj-flex oj-sm-align-items-center oj-sm-gap-1">
          <Pin class="oj-icon-size-1x oj-text-color-brand" role="img" aria-label="Pinned Icon" />
          <h2 class="oj-typography-heading-md oj-text-color-primary">Pinned Applications</h2>
        </div>
        <oj-button display="all" chroming="outlined">
          Manage Pins
        </oj-button>
      </div>

      {error ? (
        <div class="oj-text-color-neutral">No Pinned applications.</div>
      ) : pinnedApps.length === 0 ? (
        <div class="oj-text-color-secondary oj-typography-body-sm">No Pinned Applications</div>
      ) : (
        <div class="oj-flex oj-flex-wrap oj-sm-gap-2x">
          {pinnedApps.map((app) => (
            <div class="oj-sm-width-full oj-md-width-50 oj-lg-width-25">
              <PinnedAppCard app={app} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
