import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import "ojs/ojdialog";
import "ojs/ojbutton";
import { userGroupService } from "../../services/userGroupServices";
import "../../styles/AddGroupDialog.css";

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
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (dialogRef.current) {
      if (isOpen) {
        dialogRef.current.open();
        setError(null);
        setSuccessMessage('');
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
      
      // Set success message
      setSuccessMessage('Group deleted successfully!');
      
      // Close dialog after a short delay to show the message
      setTimeout(() => {
        onGroupDeleted();
        onClose();
      }, 1500);
      
    } catch (err) {
      setError("Failed to delete group.");
      //unset error after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
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
        {/* Success Message */}
        {successMessage && (
          <div class="oj-sm-margin-4x-bottom success-message-banner">
            <div class="oj-flex oj-sm-align-items-center">
              <span class="oj-ux-ico-status-confirmation oj-text-color-success oj-sm-margin-2x-end"></span>
              <span class="oj-text-color-success">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div class="oj-sm-margin-4x-bottom error-message-banner">
            <div class="oj-flex oj-sm-align-items-center">
              <span class="oj-ux-ico-status-error oj-text-color-danger oj-sm-margin-2x-end"></span>
              <span class="oj-text-color-danger">{error}</span>
            </div>
          </div>
        )}

        {/* Confirmation Message - hide when showing success */}
        {!successMessage && (
          <p>
            Are you sure you want to delete <strong>{groupName}</strong>?
          </p>
        )}
      </div>
      <div slot="footer">
        {!successMessage && (
          <>
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
          </>
        )}
      </div>
    </oj-dialog>
  );
}
