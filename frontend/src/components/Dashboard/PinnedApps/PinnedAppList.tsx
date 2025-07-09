/** @jsx h */
import { h } from "preact";
import ManagePinsCard from "./ManagePinsCard";
import type { PinnedApp } from "../types";
import type { AvailableApp } from "./usePinnedApp";

interface Props {
  apps: (PinnedApp | AvailableApp)[];
  isPinned: boolean;
  userId?: string;
  onRefresh: () => void;
  loading: boolean;
}

const PinnedAppList = ({ apps, isPinned, userId, onRefresh, loading }: Props) => {
  if (loading) {
    return (
      <div class="oj-sm-padding-6x oj-text-align-center">
        <oj-progress-circle size="md" />
      </div>
    );
  }

  return (
    <div class="oj-flex oj-flex-direction-column oj-sm-gap-1x manage-pins-grid">
      {apps.map((app) => (
        <ManagePinsCard
          app={app}
          isPinned={isPinned}
          userId={userId}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};

export default PinnedAppList;
