/** @jsx h */
import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import ManagePinsTabs from "./ManagePinsTabs";
import { usePinnedApp } from "./usePinnedApp";
import "../../../styles/dashboard/pinnedapps.css";
import 'ojs/ojdialog';

interface Props {
  userId?: string;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
}

const ManagePinsDialog = ({ userId, open, onClose }: Props) => {
  const dialogRef = useRef<HTMLElement | null>(null);
  const { pinned, available, loading, refresh } = usePinnedApp(userId);

  useEffect(() => {
    const dialogEl = dialogRef.current as any;

    if (!dialogEl) return;

    if (open && typeof dialogEl.open === "function") {
      dialogEl.open();
    } else if (!open && typeof dialogEl.close === "function") {
      dialogEl.close();
    }
  }, [open]);

  return (
    <oj-dialog
      id="managePinsDialog"
      ref={dialogRef}
      cancel-behavior="icon"
      onojClose={onClose}
    >
      <div slot="header">
        <span class="oj-dialog-title">Manage Pinned Applications</span>
      </div>
      <div slot="body">
        <ManagePinsTabs
          pinnedApps={pinned}
          availableApps={available}
          loading={loading}
          onRefresh={refresh}
          userId={userId}
        />
      </div>
      <div slot="footer" class="oj-flex oj-sm-justify-content-flex-end">
        <oj-button onojAction={onClose}>Done</oj-button>
      </div>
    </oj-dialog>
  );
};

export default ManagePinsDialog;
