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
  const [isDeleting, setIsDeleting] = useState(false);
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
    setIsDeleting(true);
    setError(null);

    try {
      await userGroupService.deleteUserGroup(groupId);
      onGroupDeleted();
      onClose();
    } catch (err: any) {
      console.error("Failed to delete group:", err);
      setError("Failed to delete group. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <oj-dialog
      ref={dialogRef}
      dialogTitle="Delete Group"
      cancelBehavior="icon"
      onojClose={handleDialogClose}
      id="deleteGroupDialog"
    >
      <div class="oj-dialog-body">
        {error && <p class="oj-text-color-danger">{error}</p>}
        <p>
          Are you sure you want to delete the group <strong>{groupName}</strong>?
        </p>
        <p class="oj-text-color-secondary oj-typography-body-sm">
          This action cannot be undone.
        </p>
      </div>
      <div slot="footer">
        <oj-button onojAction={onClose} disabled={isDeleting}>
          Cancel
        </oj-button>
        <oj-button
          chroming="danger"
          onojAction={handleDeleteGroup}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </oj-button>
      </div>
    </oj-dialog>
  );
}
