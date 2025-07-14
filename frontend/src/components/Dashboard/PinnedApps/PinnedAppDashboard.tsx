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
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isManageDialogOpen, setManageDialogOpen] = useState(false);
  const [allApps, setAllApps] = useState<{ _id: string; name: string }[]>([]);

  const fetchPinnedApps = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(false);
      const [pinnedRes, activeRes] = await Promise.all([
        axios.get(`/dashboard/pinned/${userId}`),
        axios.get(`/dashboard/active/${userId}`),
      ]);
      const pinned = pinnedRes.data.pinned_applications || [];
      const active = activeRes.data.active_applications || [];
      setPinnedApps(pinned);
      setPinnedIds(pinned.map((a: PinnedApp) => a._id));
    setAllApps(active.map((a: any) => ({ _id: a._id, name: a.name })));
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
              <PinnedAppCard
                app={app}
                userId={userId}
                onUnpin={(id) => {
                  setPinnedApps((prev) => prev.filter((a) => a._id !== id));
                  setPinnedIds((prev) => prev.filter((a) => a !== id));
                  return () => {
                    setPinnedApps((prev) => [...prev, app]);
                    setPinnedIds((prev) => [...prev, app._id]);
                  };
                }} />
            </div>
          ))}
        </div>
      )}
      <ManagePinsDialog
        userId={userId}
        open={isManageDialogOpen}
        pinnedIds={pinnedIds}
        setPinnedIds={setPinnedIds}
        onClose={() => setManageDialogOpen(false)}
        onRefresh={fetchPinnedApps}
        allApps={allApps}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default PinnedAppsDashboard;
