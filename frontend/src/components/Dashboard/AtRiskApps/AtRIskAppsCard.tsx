/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";
import { AlertTriangle, Clock } from "lucide-preact";
import axios from "../../../api/axios";
import "../../../styles/dashboard/atriskapps.css";

interface AtRiskApp {
  id: string;
  name: string;
  errorCount: number;
  riskLevel: "high" | "medium" | "low";
  lastError: string;
}

const AtRiskAppsListCard = ({ userId }: { userId?: string }) => {
  const [apps, setApps] = useState<AtRiskApp[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchAtRiskApps = async () => {
      try {
        const response = await axios.get(`/dashboard/atrisk/${userId}`);
        setApps(response.data.at_risk_applications);
      } catch (error) {
        console.error("Error fetching at-risk applications:", error);
      }
    };

    fetchAtRiskApps();
  }, [userId]);

  const displayedApps = apps.slice(0, 3);
  const remainingCount = apps.length - 3;

  const getRiskLevelClass = (level: string) => {
    return `badge ${level}-risk`;
  };

  const getErrorClass = (count: number) => {
    return `badge ${count >= 30 ? "high-risk" : count >= 15 ? "medium-risk" : "low-risk"}`;
  };

  const AppItem = (app: AtRiskApp) => (
    <div class="risk-item">
      <div class="risk-app-info">
        <div class="dot" />
        <div class="risk-meta">
          <div class="risk-app-name">{app.name}</div>
          <div class="risk-app-time">
            <Clock class="icon" />
            <span>{app.lastError}</span>
          </div>
        </div>
      </div>
      <div class="risk-app-metrics">
        <span class={getRiskLevelClass(app.riskLevel)}>{app.riskLevel.toUpperCase()}</span>
        <span class={getErrorClass(app.errorCount)}>{app.errorCount} errors</span>
      </div>
    </div>
  );

  const dialogRef = useRef(null);

  useEffect(() => {
    const dialogEl = dialogRef.current as any;
    if (!dialogEl) return;

    if (isDialogOpen && typeof dialogEl.open === "function") {
      dialogEl.open();
    } else if (!isDialogOpen && typeof dialogEl.close === "function") {
      dialogEl.close();
    }
  }, [isDialogOpen]);

  return (
    <div class="risk-card">
      <div class="risk-header">
        <div class="risk-header-title">
          <AlertTriangle class="icon" />
          <span>At-Risk Applications</span>
        </div>
        <span class="app-count-badge">{apps.length} Apps</span>
      </div>

      {apps.length > 0 ? (
        <>
          <div class="risk-list">
            {displayedApps.map((app) => (
              <AppItem key={app.id} {...app} />
            ))}
          </div>

          {remainingCount > 0 && (
            <div class="risk-more">
              <oj-button chroming="outlined" onojAction={() => setIsDialogOpen(true)}>
                +{remainingCount} more
              </oj-button>

              {isDialogOpen && (
                <oj-dialog
                  id="atRiskDialog"
                  ref={dialogRef}
                  cancel-behavior="icon"
                  class="risk-dialog"
                  onojClose={() => setIsDialogOpen(false)}
                >
                  <div slot="header" class="dialog-header">
                    <AlertTriangle class="icon" />
                    <span>All At-Risk Applications ({apps.length})</span>
                  </div>
                  <div slot="body" class="dialog-body">
                    {apps.map((app) => (
                      <AppItem key={app.id} {...app} />
                    ))}
                  </div>
                </oj-dialog>
              )}
            </div>
          )}
        </>
      ) : (
        <div class="risk-empty-state">
          <AlertTriangle class="icon" />
          <p>No at-risk applications detected</p>
          <small>Applications will appear here when issues are identified</small>
        </div>
      )}
    </div>
  );
};

export default AtRiskAppsListCard;
