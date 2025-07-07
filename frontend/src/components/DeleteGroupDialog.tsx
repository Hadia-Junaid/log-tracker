import { h } from 'preact';
import { useState } from 'preact/hooks';
import { userGroupService } from '../services/userGroupServices';

interface DeleteGroupDialogProps {
  isOpen: boolean;
  groupId: string;
  groupName: string;
  onClose: () => void;
  onGroupDeleted: () => void;
}

export function DeleteGroupDialog({ isOpen, groupId, groupName, onClose, onGroupDeleted }: DeleteGroupDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteGroup = async () => {
    setIsDeleting(true);

    try {
      await userGroupService.deleteUserGroup(groupId);
      onGroupDeleted();
      handleClose();
    } catch (err: any) {
      console.error('Failed to delete group:', err);
      alert('Failed to delete group. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div class="oj-dialog-mask">
      <div class="oj-dialog" role="dialog" aria-labelledby="delete-dialog-title">
        <div class="oj-dialog-header">
          <h2 id="delete-dialog-title" class="oj-dialog-title">Delete Group</h2>
        </div>

        <div class="oj-dialog-body">
          <p>
            Are you sure you want to delete the group <strong>{groupName}</strong>?
          </p>
          <p class="oj-text-color-secondary oj-typography-body-sm">
            This action cannot be undone.
          </p>
        </div>

        <div class="oj-dialog-footer">
          <button class="oj-button" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </button>
          <button 
            class="oj-button oj-button-danger" 
            onClick={handleDeleteGroup}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
} 