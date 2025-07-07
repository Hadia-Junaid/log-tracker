import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { MemberData, ApplicationOption, UpdateGroupPayload, GroupData } from '../types/userManagement';
import { userGroupService } from '../services/userGroupServices';

interface EditGroupDialogProps {
  isOpen: boolean;
  groupId: string;
  groupName: string;
  onClose: () => void;
  onGroupUpdated: () => void;
}

export function EditGroupDialog({ isOpen, groupId, groupName, onClose, onGroupUpdated }: EditGroupDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableMembers, setAvailableMembers] = useState<MemberData[]>([]);
  const [currentMembers, setCurrentMembers] = useState<MemberData[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && groupId) {
      loadGroupData();
      loadApplications();
    }
  }, [isOpen, groupId]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchUsers();
    } else {
      setAvailableMembers([]);
    }
  }, [searchQuery]);

  const loadGroupData = async () => {
    try {
      const group = await userGroupService.fetchGroupById(groupId);
      // Convert member emails to MemberData objects
      const memberData: MemberData[] = (group.members || []).map((email: string) => ({
        id: email,
        email,
        name: email.split('@')[0], // Fallback name
        initials: email.split('@')[0].substring(0, 2).toUpperCase()
      }));
      setCurrentMembers(memberData);
    } catch (err) {
      console.error('Failed to load group data:', err);
      setError('Failed to load group data');
    }
  };

  const loadApplications = async () => {
    try {
      const apps = await userGroupService.fetchApplications();
      setApplications(apps);
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  };

  const searchUsers = async () => {
    try {
      const users = await userGroupService.searchUsers(searchQuery);
      // Filter out users that are already in the group
      const filteredUsers = users.filter(user => 
        !currentMembers.find(member => member.email === user.email)
      );
      setAvailableMembers(filteredUsers);
    } catch (err) {
      console.error('Failed to search users:', err);
    }
  };

  const addMemberToGroup = (member: MemberData) => {
    if (!currentMembers.find(m => m.email === member.email)) {
      setCurrentMembers([...currentMembers, member]);
    }
  };

  const removeMemberFromGroup = (member: MemberData) => {
    setCurrentMembers(currentMembers.filter(m => m.email !== member.email));
  };

  const removeAllMembers = () => {
    setCurrentMembers([]);
  };

  const handleUpdateGroup = async () => {
    setIsUpdating(true);
    setError('');

    try {
      const payload: UpdateGroupPayload = {
        members: currentMembers.map(m => m.email),
        assigned_applications: applications
          .filter(app => app.checked)
          .map(app => app.id)
      };

      await userGroupService.updateUserGroup(groupId, payload);
      onGroupUpdated();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update group');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setAvailableMembers([]);
    setCurrentMembers([]);
    setApplications([]);
    setError('');
    setIsUpdating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div class="oj-dialog-mask">
      <div class="oj-dialog" role="dialog" aria-labelledby="edit-dialog-title">
        <div class="oj-dialog-header">
          <h2 id="edit-dialog-title" class="oj-dialog-title">
            Edit Group: {groupName}
          </h2>
        </div>

        <div class="oj-dialog-body">
          {error && (
            <div class="oj-sm-margin-2x-bottom error-message">
              {error}
            </div>
          )}

          <p class="oj-typography-body-md oj-text-color-secondary oj-sm-margin-4x-bottom">
            Manage group members using the directory below.
          </p>

          <div class="edit-group-content">
            {/* Available Members */}
            <div class="available-members-section">
              <h4 class="oj-typography-heading-sm oj-text-color-primary">Available Members</h4>
              
              <div class="oj-sm-margin-4x-bottom">
                <input
                  type="search"
                  class="oj-inputsearch oj-form-control-full-width"
                  value={searchQuery}
                  onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                  placeholder="Search directory..."
                />
              </div>

              <div class="members-list available-members-list">
                {availableMembers.length > 0 ? (
                  availableMembers.map(member => (
                    <div 
                      key={member.email}
                      class="clickable-member member-list-item"
                      onClick={() => addMemberToGroup(member)}
                    >
                      <div class="oj-flex oj-sm-align-items-center">
                        <div class="oj-avatar oj-avatar-xs" style="margin-right: 8px;">
                          {member.initials}
                        </div>
                        <div>
                          <div class="oj-typography-body-md oj-text-color-primary">
                            {member.email}
                          </div>
                          <div class="oj-typography-body-sm oj-text-color-secondary">
                            {member.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div class="no-members-content">
                    <p class="oj-text-color-secondary">
                      {searchQuery.length > 2 ? 'No users found' : 'Type a name/email to begin search'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Current Members */}
            <div class="current-members-section">
              <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between oj-sm-margin-4x-bottom">
                <h4 class="oj-typography-heading-sm oj-text-color-primary">Current Members</h4>
                <div class="oj-flex oj-sm-align-items-center">
                  <span class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-end">
                    {currentMembers.length} members
                  </span>
                  <button
                    class="oj-button oj-button-sm"
                    onClick={removeAllMembers}
                    disabled={currentMembers.length === 0}
                  >
                    Remove All
                  </button>
                </div>
              </div>

              <div class="members-list current-members-list">
                {currentMembers.length > 0 ? (
                  currentMembers.map(member => (
                    <div key={member.email} class="member-list-item current-member-item">
                      <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between">
                        <div class="oj-flex oj-sm-align-items-center">
                          <div class="oj-avatar oj-avatar-xs" style="margin-right: 8px;">
                            {member.initials}
                          </div>
                          <div>
                            <div class="oj-typography-body-md oj-text-color-primary">
                              {member.email}
                            </div>
                            <div class="oj-typography-body-sm oj-text-color-secondary">
                              {member.name}
                            </div>
                          </div>
                        </div>
                        <button
                          class="oj-button oj-button-sm member-remove-btn"
                          onClick={() => removeMemberFromGroup(member)}
                          title="Remove member"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div class="no-members-content">
                    <p class="oj-text-color-secondary">No members in this group</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Accessible Applications */}
          <div class="oj-sm-margin-4x-top">
            <h4 class="oj-typography-heading-sm oj-text-color-primary oj-sm-margin-2x-bottom">
              Accessible Applications
            </h4>
            {groupName === 'admin group' && (
              <div class="oj-sm-margin-2x-bottom">
                <p class="oj-text-color-secondary oj-typography-body-sm">
                  Admin groups have access to all applications automatically.
                </p>
              </div>
            )}
            <div class="applications-checkboxes">
              {applications.map(app => (
                <label key={app.id} class="oj-checkbox">
                  <input
                    type="checkbox"
                    checked={app.checked}
                    disabled={groupName === 'admin group'}
                    onChange={(e) => {
                      const newApps = applications.map(a => 
                        a.id === app.id ? { ...a, checked: (e.target as HTMLInputElement).checked } : a
                      );
                      setApplications(newApps);
                    }}
                  />
                  <span class="oj-checkbox-label">{app.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div class="oj-dialog-footer">
          <button class="oj-button" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </button>
          <button 
            class="oj-button oj-button-primary" 
            onClick={handleUpdateGroup}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Group'}
          </button>
        </div>
      </div>
    </div>
  );
} 