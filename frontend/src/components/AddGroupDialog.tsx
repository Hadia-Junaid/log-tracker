import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { userGroupService } from '../services/userGroupServices';
import { MemberData, ApplicationOption } from '../types/userManagement';
import 'ojs/ojinputsearch';
import 'ojs/ojbutton';
import 'ojs/ojlistview';
import 'ojs/ojavatar';
import 'ojs/ojcheckboxset';
import 'ojs/ojinputtext';
import 'ojs/ojlabel';

interface AddGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export function AddGroupDialog({ isOpen, onClose, onGroupCreated }: AddGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [allMembers, setAllMembers] = useState<MemberData[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const searchInputRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadApplications();
      fetchAndStoreAllMembers();
    }
  }, [isOpen]);

  const loadApplications = async () => {
    setIsLoading(true);
    setError('');

    try {
      const allApplications = await userGroupService.fetchApplications();
      const appOptions: ApplicationOption[] = allApplications.map(app => ({
        id: app.id,
        name: app.name,
        checked: false
      }));
      setApplications(appOptions);
    } catch (err: any) {
      setError('Failed to load applications. Please try again.');
      console.error('Failed to load applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAndStoreAllMembers = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Use userGroupService for consistent user fetching
      const members = await userGroupService.searchUsers("");
      localStorage.setItem('allDirectoryMembers', JSON.stringify(members));
      setAllMembers(members);
    } catch (err) {
      setError('Failed to load members from directory.');
      setAllMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const availableMembers = allMembers.filter(
    (m) => !selectedMembers.some((sel) => sel.id === m.id)
  );

  const handleAddMember = (member: MemberData) => {
    setSelectedMembers((prev) => [...prev, member]);
  };

  const handleRemoveMember = (member: MemberData) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== member.id));
  };

  const handleRemoveAllMembers = () => {
    setSelectedMembers([]);
  };

  const handleApplicationToggle = (appId: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId ? { ...app, checked: !app.checked } : app
      )
    );
  };

  const validateForm = (): string | null => {
    if (!groupName.trim()) {
      return 'Group name is required.';
    }
    if (groupName.trim().length < 5 || groupName.trim().length > 20) {
      return 'Group name must be between 5 and 20 characters.';
    }
    if (applications.filter(app => app.checked).length === 0) {
      return 'Please select at least one accessible application.';
    }
    return null;
  };

  const handleCreateGroup = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const selectedApplications = applications
        .filter(app => app.checked)
        .map(app => app.id);

      await userGroupService.createUserGroup({
        name: groupName.trim(),
        members: selectedMembers.map(m => m.email),
        assigned_applications: selectedApplications
      });

      onGroupCreated();
      handleClose();
    } catch (err: any) {
      setError('Failed to create group. Please try again.');
      console.error('Failed to create group:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedMembers([]);
    setAllMembers([]);
    setApplications([]);
    setError('');
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    onClose();
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          {isLoading ? (
            <div class="oj-flex oj-sm-justify-content-center">
              <div class="oj-spinner"></div>
            </div>
          ) : (
            <div class="oj-flex oj-sm-flex-direction-column">
              {/* Error Message */}
              {error && (
                <div class="error-message">
                  {error}
                </div>
              )}

              {/* Group Name Input */}
              <div class="oj-sm-margin-4x-bottom">
                <oj-label for="groupNameInput">Group Name</oj-label>
                <oj-input-text
                  id="groupNameInput"
                  value={groupName}
                  on-value-changed={(e: any) => setGroupName(e.detail.value)}
                  class="oj-form-control-full-width"
                />
              </div>

              <div class="oj-flex oj-sm-flex-direction-row edit-group-content">
                {/* Available Members Section */}
                <div class="oj-flex-item oj-flex oj-sm-flex-direction-column available-members-section" style={{ maxHeight: '300px', minHeight: '300px', overflowY: 'auto' }}>
                  <h4 class="oj-typography-heading-sm oj-text-color-primary">Available Members</h4>
                  <div class="members-list available-members-list">
                    {availableMembers.length > 0 ? (
                      availableMembers.map((member) => (
                        <div
                          key={member.id}
                          class="clickable-member member-list-item"
                          onClick={() => handleAddMember(member)}
                        >
                          <div class="oj-flex oj-sm-align-items-center">
                            <oj-avatar size="xs" initials={member.initials}></oj-avatar>
                            <div class="oj-sm-margin-2x-start">
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
                        <p class="oj-text-color-secondary">No available members</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Members Section */}
                <div class="oj-flex-item oj-flex oj-sm-flex-direction-column current-members-section">
                  <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between oj-sm-margin-4x-bottom">
                    <h4 class="oj-typography-heading-sm oj-text-color-primary">Selected Members</h4>
                    <div class="oj-flex oj-sm-align-items-center">
                      <span class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-end">
                        {selectedMembers.length} members
                      </span>
                      <oj-button 
                        class="oj-button-sm" 
                        chroming="outlined"
                        on-oj-action={handleRemoveAllMembers} onClick={handleRemoveAllMembers}
                      >
                        Remove All
                      </oj-button>
                    </div>
                  </div>
                  <div class="members-list current-members-list">
                    {selectedMembers.length > 0 ? (
                      selectedMembers.map((member) => (
                        <div key={member.id} class="member-list-item current-member-item">
                          <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between">
                            <div class="oj-flex oj-sm-align-items-center">
                              <oj-avatar size="xs" initials={member.initials}></oj-avatar>
                              <div class="oj-sm-margin-2x-start">
                                <div class="oj-typography-body-md oj-text-color-primary">
                                  {member.email}
                                </div>
                                <div class="oj-typography-body-sm oj-text-color-secondary">
                                  {member.name}
                                </div>
                              </div>
                            </div>
                            <oj-button 
                              class="member-remove-btn oj-button-sm" 
                              chroming="borderless"
                              display="icons"
                              on-oj-action={() => handleRemoveMember(member)} onClick={() => handleRemoveMember(member)}
                              title="Remove member"
                            >
                              <span slot="startIcon" class="oj-ux-ico-close"></span>
                            </oj-button>
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

              {/* Accessible Applications Section */}
              <div class="oj-flex oj-sm-flex-direction-column oj-sm-margin-4x-top">
                <h4 class="oj-typography-heading-sm oj-text-color-primary oj-sm-margin-2x-bottom">
                  Accessible Applications
                </h4>
                <div class="applications-grid">
                  {applications.map(app => (
                    <div key={app.id} class="application-checkbox-item">
                      <oj-checkboxset
                        value={app.checked ? [app.id] : []}
                        on-value-changed={(e: any) => handleApplicationToggle(app.id)}
                      >
                        <oj-option value={app.id}>{app.name}</oj-option>
                      </oj-checkboxset>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div class="oj-dialog-footer">
          <oj-button on-oj-action={handleClose} onClick={handleClose} disabled={isCreating}>
            Cancel
          </oj-button>
          <oj-button 
            chroming="callToAction" 
            on-oj-action={handleCreateGroup} onClick={handleCreateGroup}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </oj-button>
        </div>
      </div>
    </div>
  );
} 