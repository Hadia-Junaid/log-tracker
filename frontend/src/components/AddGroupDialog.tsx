import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { MemberData, ApplicationOption, CreateGroupPayload } from '../types/userManagement';
import { userGroupService } from '../services/userGroupServices';

interface AddGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export function AddGroupDialog({ isOpen, onClose, onGroupCreated }: AddGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableMembers, setAvailableMembers] = useState<MemberData[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadApplications();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchUsers();
    } else {
      setAvailableMembers([]);
    }
  }, [searchQuery]);

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
      setAvailableMembers(users);
    } catch (err) {
      console.error('Failed to search users:', err);
    }
  };

  const addMemberToSelected = (member: MemberData) => {
    if (!selectedMembers.find(m => m.email === member.email)) {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const removeMemberFromSelected = (member: MemberData) => {
    setSelectedMembers(selectedMembers.filter(m => m.email !== member.email));
  };

  const removeAllSelectedMembers = () => {
    setSelectedMembers([]);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const payload: CreateGroupPayload = {
        name: groupName.trim(),
        members: selectedMembers.map(m => m.email),
        assigned_applications: applications
          .filter(app => app.checked)
          .map(app => app.id)
      };

      await userGroupService.createUserGroup(payload);
      onGroupCreated();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSearchQuery('');
    setAvailableMembers([]);
    setSelectedMembers([]);
    setApplications([]);
    setError('');
    setIsCreating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div class="oj-dialog-mask">
      <div class="oj-dialog" role="dialog" aria-labelledby="add-dialog-title">
        <div class="oj-dialog-header">
          <h2 id="add-dialog-title" class="oj-dialog-title">Add New Group</h2>
          <p class="oj-typography-body-sm oj-text-color-secondary">
            Create a new group and manage members using the directory below.
          </p>
        </div>

        <div class="oj-dialog-body">
          {error && (
            <div class="oj-sm-margin-2x-bottom error-message">
              {error}
            </div>
          )}

          <div class="oj-sm-margin-2x-bottom">
            <label for="groupNameInput" class="oj-label">Group Name</label>
            <input
              id="groupNameInput"
              type="text"
              class="oj-inputtext oj-form-control-full-width"
              value={groupName}
              onInput={(e) => setGroupName((e.target as HTMLInputElement).value)}
              placeholder="Enter group name"
            />
          </div>

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
                      onClick={() => addMemberToSelected(member)}
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

            {/* Selected Members */}
            <div class="current-members-section">
              <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between oj-sm-margin-4x-bottom">
                <h4 class="oj-typography-heading-sm oj-text-color-primary">Selected Members</h4>
                <div class="oj-flex oj-sm-align-items-center">
                  <span class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-end">
                    {selectedMembers.length} members
                  </span>
                  <button
                    class="oj-button oj-button-sm"
                    onClick={removeAllSelectedMembers}
                    disabled={selectedMembers.length === 0}
                  >
                    Remove All
                  </button>
                </div>
              </div>

              <div class="members-list current-members-list">
                {selectedMembers.length > 0 ? (
                  selectedMembers.map(member => (
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
                          onClick={() => removeMemberFromSelected(member)}
                          title="Remove member"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div class="no-members-content">
                    <p class="oj-text-color-secondary">No members selected</p>
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
            <div class="applications-checkboxes">
              {applications.map(app => (
                <label key={app.id} class="oj-checkbox">
                  <input
                    type="checkbox"
                    checked={app.checked}
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
          <button class="oj-button" onClick={handleClose} disabled={isCreating}>
            Cancel
          </button>
          <button 
            class="oj-button oj-button-primary" 
            onClick={handleCreateGroup}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
} 