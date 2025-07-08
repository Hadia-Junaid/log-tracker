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

  useEffect(() => {
    if (dialogRef.current) {
      if (isOpen) {
        dialogRef.current.open();
        setError(null);
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
      onClose();
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
      dialogTitle="Confirm Deletion"
      cancelBehavior="icon"
      onojClose={handleDialogClose}
      id="deleteConfirmationDialog"
    >
      <div class="oj-dialog-body">
        {error && <p class="error-message">{error}</p>}
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
