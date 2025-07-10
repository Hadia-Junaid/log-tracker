/** @jsx h */
import { h } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import axios from "../../../api/axios";
import "ojs/ojdialog";
import "ojs/ojbutton";
import "ojs/ojformlayout";
import "ojs/ojprogress-circle";
import "ojs/ojavatar";
import "ojs/ojinputtext";
import "../../../styles/dashboard/pinnedapps.css";
import "../../../styles/dashboard/activeapps.css";
import { Activity } from "lucide-preact";
import CardRow from "../utils/CardRow";

interface ActiveApp {
  _id: string;
  name: string;
  totalLogsLast24h: number;
}

const ActiveAppsDashboard = ({ userId }: { userId?: string }) => {
  const [apps, setApps] = useState<ActiveApp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);


  useEffect(() => {
    if (!userId) return;

    const fetchActiveApps = async () => {
      try {
        const res = await axios.get(`/dashboard/active/${userId}`);
        setApps(res.data.active_applications);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch active apps", err);
        setError("Unable to load active applications.");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveApps();
  }, [userId]);

  const dialogRef = useRef(null);

  useEffect(() => {
    const dialogEl = dialogRef.current as any;
    if (!dialogEl) return;

    if (dialogOpen && typeof dialogEl.open === "function") {
      dialogEl.open();
    } else if (!dialogOpen && typeof dialogEl.close === "function") {
      dialogEl.close();
    }
  }, [dialogOpen]);


  const displayedApps = apps.slice(0, 3);
  const remainingCount = apps.length - 3;

  return (
    <div class="active-apps-container oj-panel">
      <div class="active-apps-header">
        <span class="active-apps-title-container">
          <Activity class="icon-green" />
          <h2 class="active-apps-title">Active Applications - Logs (24hrs)</h2>
        </span>
        <span class="app-count-badge">{apps.length} Apps</span>
      </div>

      {loading && <oj-progress-circle size="md" class="loader"></oj-progress-circle>}
      {error && <p class="error-text">{error}</p>}

      {!loading && !error && (
        <div class="active-apps-list">
          {displayedApps.map((app) => (
            <div class="active-app-row" key={app._id}>
              <span class="active-app-name">{app.name}</span>
              <CardRow
                label=""
                value={app.totalLogsLast24h.toLocaleString()}
                badge="NEUTRAL"
                labelClass="card-row-logs-label"
              />
            </div>
          ))}

          {remainingCount > 0 && (
            <div class="see-more-container">
              <oj-button onojAction={() => setDialogOpen(true)}>+{remainingCount} more</oj-button>
            </div>
          )}

          <oj-dialog
            id="activeAppDialog"
            class="app-dialog"
            ref={dialogRef}
            onojClose={() => setDialogOpen(false)}
            cancel-behavior="icon">
            <div slot="header">
              <h2 class="dialog-title">All Active Applications ({apps.length})</h2>
            </div>
            <div slot="body">
              <div class="dialog-apps-list">
                {apps.map((app) => (
                  <div class="active-app-row" key={app._id}>
                    <span class="active-app-name">{app.name}</span>
                    <CardRow
                      label=""
                      value={app.totalLogsLast24h.toLocaleString()}
                      badge="NEUTRAL"
                      labelClass="card-row-logs-label"
                    />
                  </div>
                ))}
              </div>
            </div>
          </oj-dialog>
        </div>
      )}
    </div>
  );
};

export default ActiveAppsDashboard;
