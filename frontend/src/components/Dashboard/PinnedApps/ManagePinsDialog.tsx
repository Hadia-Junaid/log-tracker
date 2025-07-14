/** @jsx h */
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { usePinnedApp } from "./usePinnedApp";
import axios from "../../../api/axios";
import "../../../styles/dashboard/pinnedapps.css";
import "ojs/ojdialog";
import "ojs/ojcheckboxset";
import "ojs/ojformlayout";
import "ojs/ojinputtext";

interface Props {
  userId?: string;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
}

const ManagePinsDialog = ({ userId, open, onClose, onRefresh }: Props) => {
  const dialogRef = useRef<HTMLElement | null>(null);
  const {
    loading,
    error,
    refresh,
    pinnedIds,
    allApps,
  } = usePinnedApp(userId);

  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [autoClose, setAutoClose] = useState(false);

  useEffect(() => {
    if (pinnedIds.length > 0) {
      setSelectedAppIds(pinnedIds);
      if (!loading && pinnedIds.length === 4) {
        setMessage("You can only pin up to 4 applications.");
        setAutoClose(false);
      }
    }
  }, [pinnedIds]);

  useEffect(() => {
    const dialogEl = dialogRef.current as any;
    if (!dialogEl) return;

    if (open && typeof dialogEl.open === "function") {
      dialogEl.open();
    } else if (!open && typeof dialogEl.close === "function") {
      dialogEl.close();
    }
  }, [open]);

  useEffect(() => {
    if (message === "You can only pin up to 4 applications.") {
      return; // Don't auto-dismiss this specific warning
    }
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        if (autoClose) {
          onClose();
        }
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [message, autoClose, onClose]);

  useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open, refresh]);

  const handleCheckboxChange = (event: CustomEvent) => {
    const value = event.detail.value as string[];
    if (value.length === 4) {
      setMessage("You can only pin up to 4 applications.");
      setAutoClose(false);
    } else {
      setMessage(null);
    }
    setSelectedAppIds(value);
  };

  const handleDone = async () => {
    if (!userId) return;
    try {
      setAutoClose(true);
      await axios.patch(`/dashboard/pinned/${userId}`, { appIds: selectedAppIds });
      setMessage("Pins updated successfully.");
      await onRefresh?.();
    } catch (err) {
      console.error("Failed to update pins", err);
      setMessage("Something went wrong while updating pins.");
      setAutoClose(false);
    }
  };

  const isDisabled = (appId: string) => {
    return selectedAppIds.length === 4 && !selectedAppIds.includes(appId);
  };

  const getMessageClass = () => {
    if (!message?.trim()) return "hidden";
    return message.includes("only pin up to 4") ? "pin-error" : "pin-success";
  };

  return (
    <oj-dialog
      id="managePinsDialog"
      ref={dialogRef}
      cancel-behavior="icon"
      onojClose={onClose}
    >
      <div slot="header">
        <span class="oj-dialog-title">Manage Pinned Applications</span>
        <div class="manage-pins-header-subtitle">Select applications to pin</div>
      </div>
      <div slot="body" class="manage-pins-container">
        {loading && <div class="loading-spinner"></div>}
        {error && <div class="error-message">Failed to load applications.</div>}

        <div class={`pin-message ${getMessageClass()}`}>{message}</div>

        {!loading && !error && (
          <oj-form-layout max-columns="1">
            <oj-checkboxset
              value={selectedAppIds}
              onvalueChanged={handleCheckboxChange}
            >
              {allApps.map((app) => (
                <oj-option key={app._id} value={app._id} disabled={isDisabled(app._id)}>
                  {app.name ?? "Unnamed Application"}
                </oj-option>
              ))}
            </oj-checkboxset>
          </oj-form-layout>
        )}


      </div>
      <div slot="footer" class="oj-flex oj-sm-justify-content-flex-end">
        <oj-button onojAction={handleDone}>Done</oj-button>
      </div>
    </oj-dialog>
  );
};

export default ManagePinsDialog;
