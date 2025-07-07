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
  const [searchTerm, setSearchTerm] = useState('');
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
      const members = await userGroupService.searchUsers('');
      localStorage.setItem('allDirectoryMembers', JSON.stringify(members));
      setAllMembers(members);
    } catch (err) {
      setError('Failed to load members from directory.');
      setAllMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchTerm(value);
  };

  // Available members = allMembers - selectedMembers, filtered by search term
  const availableMembers = allMembers.filter(
    (m) => !selectedMembers.some((sel) => sel.id === m.id) &&
           (searchTerm === '' || 
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
    setSearchTerm('');
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
      <style>
{`
  .edit-group-content {
    gap: 24px;
    width: 100%;
  }

  .available-members-section,
  .current-members-section {
    flex: 1 1 50%;
    background: #f9f9f9;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 16px;
    box-sizing: border-box;
  }

  .available-members-section h4,
  .current-members-section h4 {
    margin-bottom: 16px;
  }

  .members-list {
    max-height: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    border: 1px solid #dcdcdc;
    border-radius: 6px;
    background-color: #fff;
    padding: 8px;
  }

  .member-list-item {
    padding: 8px;
    border-bottom: 1px solid #e0e0e0;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .member-list-item:hover {
    background-color: #f0f0f0;
  }

  .clickable-member {
    cursor: pointer;
  }

  .current-member-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .member-remove-btn {
    margin-left: 8px;
  }

  .no-members-content {
    text-align: center;
    padding: 16px;
    font-style: italic;
  }

  .oj-dialog-body {
    padding: 24px;
  }

  .oj-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    padding: 16px 24px;
    border-top: 1px solid #ddd;
  }

  .applications-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .application-checkbox-item {
    margin-right: 16px;
  }

  .error-message {
    color: red;
    margin-bottom: 16px;
    font-weight: 500;
  }
`}
</style>
<style>
{`
  .edit-group-content {
    display: flex;
    flex-direction: row;
    gap: 24px;
    width: 100%;
  }

  .available-members-section,
  .current-members-section {
    flex: 1;
    background: #f9f9f9;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 16px;
    box-sizing: border-box;
    min-height: 400px;
    display: flex;
    flex-direction: column;
  }

  .available-members-section h4,
  .current-members-section h4 {
    margin-bottom: 16px;
  }

  .members-list {
    flex: 1;
    overflow-y: auto;
    border: 1px solid #dcdcdc;
    border-radius: 6px;
    background-color: #fff;
    padding: 8px;
  }

  .member-list-item {
    padding: 8px;
    border-bottom: 1px solid #e0e0e0;
    border-radius: 4px;
    display: flex;
    align-items: center;
    transition: background-color 0.2s ease;
  }

  .member-list-item:hover {
    background-color: #f0f0f0;
  }

  .clickable-member {
    cursor: pointer;
  }

  .current-member-item .member-remove-btn {
    margin-left: auto;
  }

  .no-members-content {
    text-align: center;
    padding: 16px;
    font-style: italic;
  }

  .oj-dialog-body {
    padding: 24px;
  }

  .oj-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    padding: 16px 24px;
    border-top: 1px solid #ddd;
  }

  .applications-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .application-checkbox-item {
    margin-right: 16px;
  }

  .error-message {
    color: red;
    margin-bottom: 16px;
    font-weight: 500;
  }

  .member-list-item .oj-avatar {
    flex-shrink: 0;
  }

  .member-details {
    flex: 1;
    margin-left: 12px;
    min-width: 0;
  }

  .member-email {
    font-weight: 500;
    color: #1a1a1a;
    word-break: break-word;
  }

  .member-name {
    font-size: 0.875rem;
    color: #6b6b6b;
    word-break: break-word;
  }
`}
</style>

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
                <div class="oj-flex-item oj-flex oj-sm-flex-direction-column available-members-section">
                  <h4 class="oj-typography-heading-sm oj-text-color-primary">Available Members</h4>

                  {/* Search Input */}
                  <div class="oj-sm-margin-4x-bottom">
                    <oj-input-search
                      class="oj-form-control-full-width"
                      placeholder="Search directory..."
                      raw-value={searchTerm}
                      on-raw-value-changed={(e: any) => handleSearchInput(e.detail.value)}
                      ref={searchInputRef}
                    />
                  </div>

                  {/* Available Members List */}
                  <div class="members-list available-members-list" style="max-height: 300px; overflow-y: auto; overflow-x: hidden;">
                    {availableMembers.length > 0 ? (
                      availableMembers.map((member) => (
                        <div
                          key={member.id}
                          class="clickable-member member-list-item"
                          onClick={() => handleAddMember(member)}
                        >
                          <div class="oj-flex oj-sm-align-items-center" style="min-width: 0; flex: 1;">
                            <oj-avatar size="xs" initials={member.initials}></oj-avatar>
                            <div class="oj-sm-margin-2x-start" style="min-width: 0; flex: 1;">
                              <div class="oj-typography-body-md oj-text-color-primary" style="word-wrap: break-word; overflow-wrap: break-word;">
                                {member.email}
                              </div>
                              <div class="oj-typography-body-sm oj-text-color-secondary" style="word-wrap: break-word; overflow-wrap: break-word;">
                                {member.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div class="no-members-content">
                        <p class="oj-text-color-secondary">
                          {searchTerm ? 'No members found' : 'No available members'}
                        </p>
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
                  <div class="members-list current-members-list" style="max-height: 300px; overflow-y: auto; overflow-x: hidden;">
                    {selectedMembers.length > 0 ? (
                      selectedMembers.map((member) => (
                        <div key={member.id} class="member-list-item current-member-item">
                          <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between" style="min-width: 0; flex: 1;">
                            <div class="oj-flex oj-sm-align-items-center" style="min-width: 0; flex: 1;">
                              <oj-avatar size="xs" initials={member.initials}></oj-avatar>
                              <div class="oj-sm-margin-2x-start" style="min-width: 0; flex: 1;">
                                <div class="oj-typography-body-md oj-text-color-primary" style="word-wrap: break-word; overflow-wrap: break-word;">
                                  {member.email}
                                </div>
                                <div class="oj-typography-body-sm oj-text-color-secondary" style="word-wrap: break-word; overflow-wrap: break-word;">
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