/** @jsx h */
import { h } from "preact";
import { useEffect, useState, useCallback } from "preact/hooks";
import axios from "../../../api/axios";
import { Pin } from "lucide-preact";
import PinnedAppCard from "./PinnedAppCard";
import { PinnedApp } from "../types";
import ManagePinsDialog from "./ManagePinsDialog";
import "../../../styles/dashboard/pinnedapps.css";

const PinnedAppsDashboard = ({ userId }: { userId?: string }) => {
  const [pinnedApps, setPinnedApps] = useState<PinnedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isManageDialogOpen, setManageDialogOpen] = useState(false);

  const fetchPinnedApps = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(false);
      const res = await axios.get(`/dashboard/pinned/${userId}`);
      setPinnedApps(res.data.pinned_applications || []);
    } catch (err) {
      console.error("Failed to fetch pinned applications:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPinnedApps();
  }, [fetchPinnedApps]);

  return (
    <div class="pinned-dashboard oj-panel">
      <div class="pinned-dashboard-header">
        <div class="pinned-dashboard-heading">
          <Pin class="oj-icon-size-sm oj-text-color-brand" aria-label="Pinned Icon" />
          <h2 class="pinned-dashboard-title">Pinned Applications</h2>
        </div>
        <oj-button display="all" chroming="outlined" onojAction={() => setManageDialogOpen(true)}>Manage Pins</oj-button>
      </div>

      {loading ? (
        <div class="pinned-dashboard-loading">
          <oj-progress-circle size="md" />
        </div>
      ) : error ? (
        <div class="pinned-dashboard-error">Failed to load pinned applications.</div>
      ) : pinnedApps.length === 0 ? (
        <div class="pinned-dashboard-empty">No Pinned Applications</div>
      ) : (
        <div class="pinned-cards-wrapper">
          {pinnedApps.map((app) => (
            <div key={app._id} class="pinned-card-col">
              <PinnedAppCard app={app} />
            </div>
          ))}
        </div>
      )}
      <ManagePinsDialog
        userId={userId}
        open={isManageDialogOpen}
        onClose={() => setManageDialogOpen(false)}
        onRefresh={fetchPinnedApps} 
      />
    </div>
  );
};

export default PinnedAppsDashboard;
