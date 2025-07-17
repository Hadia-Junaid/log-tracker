/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";
import { AlertTriangle } from "lucide-preact";
import axios from "../../../api/axios";
import { useUser } from "../../../context/UserContext";
import "../../../styles/dashboard/atriskapps.css";

interface AtRiskApp {
  appId: string;
  name: string;
  messages: string[];
}

const AtRiskAppsListCard = () => {
  const [apps, setApps] = useState<AtRiskApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<AtRiskApp | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMoreDialogOpen, setIsMoreDialogOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  const { user } = useUser();

  useEffect(() => {
    if (!user?.id) return;

    const fetchAtRiskApps = async () => {
      try {
        const response = await axios.get(`/dashboard/atrisk/${user.id}`);
        setApps(response.data.at_risk_applications ?? []);
      } catch (error) {
        console.error("Error fetching at-risk applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAtRiskApps();
  }, [user?.id]);

  const displayedApps = apps?.slice?.(0, 3) || [];
  const remainingCount = (apps?.length || 0) - 3;

  const [showOnlyBadge, setShowOnlyBadge] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      setShowOnlyBadge(width >= 1025 && width <= 1300);
    };

    checkWidth(); // run once on mount

    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const AppRow = (app: AtRiskApp) => (
    <div class="risk-item" onClick={() => setSelectedApp(app)}>
      <div class="risk-app-info">
        <div class="dot"></div>
        <div class="risk-app-name">{app.name}</div>
      </div>
      <div class="risk-app-rule-preview">
        {showOnlyBadge ? (
          <span class="risk-rule-count oj-badge oj-badge-neutral oj-badge-subtle">{app.messages.length} rule{app.messages.length > 1 ? "s" : ""}</span>
        ) : app.messages.length > 1 ? (
          <div class="risk-multiple-rules">
            {/* <span class="risk-single-rule" title={app.messages[0]}>{app.messages[0]}</span> */}
            <span
              class="risk-rule-count oj-badge oj-badge-neutral risk-rule-hover"
              style={{ cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#0e0e0eff")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
            >
              {app.messages.length} rules violated
            </span>
          </div>
        ) : (
          <span class="risk-single-rule oj-badge oj-badge-neutral" title={app.messages[0]}>{app.messages[0]}</span>
        )}
      </div>
    </div>
  );

  const dialogRef = useRef(null);
  const moreDialogRef = useRef(null);

  useEffect(() => {
    const dialogEl = dialogRef.current as any;
    if (!dialogEl) return;
    if (selectedApp && typeof dialogEl.open === "function") dialogEl.open();
    if (!selectedApp && typeof dialogEl.close === "function") dialogEl.close();
  }, [selectedApp]);

  useEffect(() => {
    const dialogEl = moreDialogRef.current as any;
    if (!dialogEl) return;
    if (isMoreDialogOpen && typeof dialogEl.open === "function") dialogEl.open();
    if (!isMoreDialogOpen && typeof dialogEl.close === "function") dialogEl.close();
  }, [isMoreDialogOpen]);

  return (
    <div class="risk-card oj-panel">
      <div class="risk-header">
        <div class="risk-header-title">
          <AlertTriangle class="icon" />
          <span>At-Risk Applications</span>
        </div>
        <span class="app-count-badge">{apps.length} Apps</span>
      </div>

      { loading ? (
        <oj-progress-circle size="md" class="loader"></oj-progress-circle>
      ) : apps.length !== 0 ? (
        <>
          {!loading && (<div class="risk-list">
            {displayedApps.map((app) => (
              <AppRow key={app.appId} {...app} />
            ))}
            {/* </div> */}

            {remainingCount > 0 && (
              <div class="risk-more-container">
                <oj-button chroming="outlined" onojAction={() => setIsMoreDialogOpen(true)}>
                  +{remainingCount} more
                </oj-button>
              </div>
            )}

            {selectedApp && (
              <oj-dialog
                id="appDetailsDialog"
                ref={dialogRef}
                cancel-behavior="icon"
                class="risk-dialog"
                onojClose={() => setSelectedApp(null)}
              >
                <div slot="header" class="dialog-header">
                  <AlertTriangle class="icon" />
                  <span>{selectedApp.name}</span>
                </div>
                <div slot="body" class="dialog-body">
                  <ul class="risk-app-messages">
                    {selectedApp.messages.map((msg, idx) => (
                      <li key={idx} class="risk-app-message">{msg}</li>
                    ))}
                  </ul>
                </div>
              </oj-dialog>
            )}

            {isMoreDialogOpen && (
              <oj-dialog
                id="atRiskDialog"
                ref={moreDialogRef}
                cancel-behavior="icon"
                class="risk-dialog"
                onojClose={() => setIsMoreDialogOpen(false)}
              >
                <div slot="header" class="dialog-header">
                  <AlertTriangle class="icon" />
                  <span>All At-Risk Applications ({apps.length})</span>
                </div>
                <div slot="body" class="dialog-body">
                  {apps.map((app) => (
                    <AppRow key={app.appId} {...app} />
                  ))}
                </div>
              </oj-dialog>
            )}
          </div>)}
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
