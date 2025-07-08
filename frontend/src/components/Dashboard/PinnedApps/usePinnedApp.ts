// usePinnedApps.ts
import { useState, useEffect, useCallback } from "preact/hooks";
import axios from "../../../api/axios";
import type { PinnedApp } from "../types";

export interface AvailableApp {
  _id: string;
  name: string;
  environment: string;
  status: string;
  description: string;
}

export const usePinnedApp = (userId?: string) => {
  const [pinned, setPinned] = useState<PinnedApp[]>([]);
  const [available, setAvailable] = useState<AvailableApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchApps = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(false);
    try {
      const [pinnedRes, activeRes] = await Promise.all([
        axios.get(`/dashboard/pinned/${userId}`),
        axios.get(`/dashboard/active/${userId}`),
      ]);

      const pinnedApps = pinnedRes.data.pinned_applications;
      const activeApps = activeRes.data.active_applications;
      const pinnedIds = pinnedApps.map((a: any) => a._id);

      setPinned(pinnedApps);
      setAvailable(activeApps.filter((a: any) => !pinnedIds.includes(a._id)));
    } catch (e) {
      console.error("Failed to fetch pinned/available apps:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  return {
    pinned,
    available,
    loading,
    error,
    refresh: fetchApps,
    setPinned,
    setAvailable,
  };
};
