import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import "ojs/ojdialog";
import "ojs/ojbutton";
import { userGroupService } from "../../services/userGroupServices";

interface DeleteGroupDialogProps {
  isOpen: boolean;
  groupId: string;
  groupName: string;
  onClose: () => void;
  onGroupDeleted: () => void;
}

export function DeleteGroupDialog({
  isOpen,
  groupId,
  groupName,
  onClose,
  onGroupDeleted,
}: DeleteGroupDialogProps) {
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

  const handleDeleteGroup = async () => {
    setLoading(true);
    setError(null);

    try {
      await userGroupService.deleteUserGroup(groupId);
      onGroupDeleted();
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete group.");
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
      id="deleteGroupDialog"
    >
      <div class="oj-dialog-body">
        {error && <p class="error-message">{error}</p>}
        <p>
          Are you sure you want to delete <strong>{groupName}</strong>?
        </p>
      </div>
      <div slot="footer">
        <oj-button onojAction={onClose} disabled={loading}>
          Cancel
        </oj-button>
        <oj-button
          chroming="danger"
          onojAction={handleDeleteGroup}
          disabled={loading}
        >
          Delete
        </oj-button>
      </div>
    </oj-dialog>
  );
}
