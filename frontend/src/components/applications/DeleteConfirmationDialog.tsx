import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import "ojs/ojdialog";
import "ojs/ojbutton";
import axios from "../../api/axios";

type Props = {
  isOpen: boolean;
  applicationId: string | null;
  applicationName?: string;
  onClose: () => void;
  onDeleteSuccess: () => void;
};

export default function DeleteConfirmationDialog({
  isOpen,
  applicationId,
  applicationName,
  onClose,
  onDeleteSuccess,
}: Props) {
  const dialogRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (dialogRef.current) {
      if (isOpen) {
        dialogRef.current.open();
        setError(null);
        setSuccessMessage(null);
      } else {
        dialogRef.current.close();
      }
    }
  }, [isOpen]);

  const handleDialogClose = (event: CustomEvent) => {
    if (event.detail.originalEvent) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!applicationId) return;

    setLoading(true);
    setError(null);

    try {
      await axios.delete(`/applications/${applicationId}`);
      onDeleteSuccess();
      setSuccessMessage(
        `Application "${applicationName}" deleted successfully.`
      );

      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <oj-dialog
      ref={dialogRef}
      cancelBehavior="icon"
      onojClose={handleDialogClose}
      id="deleteConfirmationDialog"
    >
      <div slot="header" class="custom-dialog-title">
        <h6>Confirm Deletion</h6>

        {error && (
          <div style="color: red; font-size: 0.9em; margin-top: 4px;">
            {error}
          </div>
        )}

        {successMessage && !error && (
          <div style="color: green; font-size: 0.9em; margin-top: 4px;">
            {successMessage}
          </div>
        )}
      </div>

      <div class="oj-dialog-body">
        <p>
          Are you sure you want to delete <strong>{applicationName}</strong>?
        </p>
      </div>
      <div slot="footer">
        <oj-button onojAction={onClose} disabled={loading}>
          Cancel
        </oj-button>
        <oj-button
          chroming="danger"
          onojAction={handleDelete}
          disabled={loading}
        >
          Delete
        </oj-button>
      </div>
    </oj-dialog>
  );
}
