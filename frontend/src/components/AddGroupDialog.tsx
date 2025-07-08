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
import 'oj-c/checkbox';


interface AddGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export function AddGroupDialog({ isOpen, onClose, onGroupCreated }: AddGroupDialogProps) {
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [allMembers, setAllMembers] = useState<MemberData[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [checkedAppIds, setCheckedAppIds] = useState<string[]>([]);
  const [searchTrigger, setSearchTrigger] = useState(0);

  const searchInputRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const groupNameRef = useRef<any>(null);
  const checkboxRefs = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (isOpen) {
      loadApplications();
      fetchAndStoreAllMembers();
      loadCurrentGroups();
    }
  }, [isOpen]);

  const loadApplications = async () => {
    setIsLoading(true);
    setError('');
    try {
      const allApplications = await userGroupService.fetchApplications();
      setApplications(allApplications);
      setCheckedAppIds([]);
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

  const loadCurrentGroups = async () => {
    try {
      const currentGroups = await userGroupService.fetchUserGroups();
      localStorage.setItem('userGroups', JSON.stringify(currentGroups));
    } catch (err) {
      console.error('Failed to load current groups for validation:', err);
    }
  };

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
    setCheckedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const validateForm = (): string | null => {
    const groupName = groupNameRef.current?.value || '';
    console.log('=== VALIDATE FORM DEBUG ===');
    console.log('Group name from ref:', groupName);
    console.log('Group name ref exists:', !!groupNameRef.current);
    console.log('Group name ref value:', groupNameRef.current?.value);
    console.log('groupName type:', typeof groupName);
    console.log('groupName length:', groupName?.length);
    
    if (!groupName || !groupName.trim()) {
      console.log('Group name is empty or undefined');
      return 'Group name is required.';
    }
    
    const trimmedName = groupName.trim();
    console.log('Trimmed name:', trimmedName);
    console.log('Trimmed name length:', trimmedName.length);
    
    // Check length validation (5-20 characters)
    if (trimmedName.length < 5 || trimmedName.length > 20) {
      return 'Group name must be between 5 and 20 characters.';
    }
    
    // Check for duplicate group names
    const existingGroups = JSON.parse(localStorage.getItem('userGroups') || '[]');
    const isDuplicate = existingGroups.some((group: any) => 
      group.groupName.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      return 'A group with this name already exists.';
    }
    
    // Check character validation - only allow hyphens, underscores, numbers, spaces, and letters
    const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validNameRegex.test(trimmedName)) {
      return 'Group name can only contain letters, numbers, spaces, hyphens (-), and underscores (_).';
    }
    
    // Check if at least one application is selected using refs
    const selectedAppIds = Object.keys(checkboxRefs.current).filter(appId => 
      checkboxRefs.current[appId]?.value === true
    );
    console.log('Selected app IDs from refs:', selectedAppIds);
    
    if (selectedAppIds.length === 0) {
      return 'Please select at least one accessible application.';
    }
    
    console.log('Validation passed!');
    return null;
  };

  const handleCreateGroup = async () => {
    const groupName = groupNameRef.current?.value || '';
    console.log('=== CREATE GROUP DEBUG ===');
    console.log('Group name from ref:', groupName);
    console.log('Group name ref exists:', !!groupNameRef.current);
    console.log('Group name ref value:', groupNameRef.current?.value);
    console.log('Selected members:', selectedMembers);
    console.log('Selected members emails:', selectedMembers.map(m => m.email));
    
    const validationError = validateForm();
    if (validationError) {
      console.log('Validation failed:', validationError);
      setError(validationError);
      return;
    }

    // Store the group name immediately after successful validation
    const validatedGroupName = groupNameRef.current?.value || '';
    console.log('Group name after successful validation:', validatedGroupName);

    // Store the selected application IDs immediately after successful validation
    const validatedAppIds = Object.keys(checkboxRefs.current).filter(appId => 
      checkboxRefs.current[appId]?.value === true
    );
    console.log('Selected app IDs after successful validation:', validatedAppIds);

    setIsCreating(true);
    setError('');

    try {
      // Load current groups for duplicate checking
      const currentGroups = await userGroupService.fetchUserGroups();
      localStorage.setItem('userGroups', JSON.stringify(currentGroups));
      
      // Use the stored group name for re-validation instead of reading from ref again
      console.log('=== RE-VALIDATION DEBUG ===');
      console.log('Using stored group name for re-validation:', validatedGroupName);
      console.log('Using stored app IDs for re-validation:', validatedAppIds);
      
      // Create a temporary validation function that uses the stored group name and app IDs
      const revalidateWithStoredValues = (): string | null => {
        console.log('=== RE-VALIDATION WITH STORED VALUES ===');
        console.log('Stored group name:', validatedGroupName);
        console.log('Stored app IDs:', validatedAppIds);
        
        if (!validatedGroupName || !validatedGroupName.trim()) {
          console.log('Stored group name is empty');
          return 'Group name is required.';
        }
        
        const trimmedName = validatedGroupName.trim();
        console.log('Trimmed stored name:', trimmedName);
        console.log('Trimmed stored name length:', trimmedName.length);
        
        // Check length validation (5-20 characters)
        if (trimmedName.length < 5 || trimmedName.length > 20) {
          return 'Group name must be between 5 and 20 characters.';
        }
        
        // Check for duplicate group names
        const existingGroups = JSON.parse(localStorage.getItem('userGroups') || '[]');
        const isDuplicate = existingGroups.some((group: any) => 
          group.groupName.toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
          return 'A group with this name already exists.';
        }
        
        // Check character validation - only allow hyphens, underscores, numbers, spaces, and letters
        const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
        if (!validNameRegex.test(trimmedName)) {
          return 'Group name can only contain letters, numbers, spaces, hyphens (-), and underscores (_).';
        }
        
        // Check if at least one application is selected using stored app IDs
        console.log('Checking stored app IDs:', validatedAppIds);
        
        if (validatedAppIds.length === 0) {
          return 'Please select at least one accessible application.';
        }
        
        console.log('Re-validation with stored values passed!');
        return null;
      };
      
      const revalidationError = revalidateWithStoredValues();
      if (revalidationError) {
        console.log('Re-validation failed:', revalidationError);
        setError(revalidationError);
        setIsCreating(false);
        return;
      }

      const payload = {
        name: validatedGroupName.trim(),
        members: selectedMembers.map(m => m.email),
        assigned_applications: validatedAppIds,
        is_admin: false
      };
      console.log('Sending payload:', payload);

      await userGroupService.createUserGroup(payload);

      onGroupCreated();
      handleClose();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('A group with this name already exists.');
      } else {
        setError('Failed to create group. Please try again.');
      }
      console.error('Failed to create group:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
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

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    // Force a re-render by updating the trigger
    setSearchTrigger(prev => prev + 1);
  };

  // Available members = allMembers - selectedMembers, filtered by search term
  const availableMembers = allMembers.filter(
    (m) => !selectedMembers.some((sel) => sel.id === m.id) &&
           (() => {
             const searchValue = searchInputRef.current?.value || '';
             return searchValue === '' || 
                    m.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                    m.email.toLowerCase().includes(searchValue.toLowerCase());
           })()
  );

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
                  ref={groupNameRef}
                  class="oj-form-control-full-width"
                />
                <div class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-top">
                  Group name must be 5-20 characters. Allowed characters: letters, numbers, spaces, hyphens (-), and underscores (_).
                </div>
                <div class="oj-typography-body-sm oj-text-color-secondary" style="color: red;">
                  Debug: Current value: "{groupNameRef.current?.value || ''}" (length: {(groupNameRef.current?.value || '').length})
                </div>
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
                      ref={searchInputRef}
                      on-value-changed={(e: any) => handleSearchChange(e.detail.value)}
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
                          {(searchInputRef.current?.value || '') ? 'No members found' : 'No available members'}
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
                <div class="oj-flex oj-sm-flex-direction-column applications-checkboxes">
                  {applications.map(app => (
                    <oj-c-checkbox 
                      key={app.id}
                      ref={(el: any) => {
                        if (el) checkboxRefs.current[app.id] = el;
                      }}
                      value={false}
                    >
                      {app.name}
                    </oj-c-checkbox>
                  ))}
                </div>
                <div class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-top">
                  At least one application must be selected for the group.
                </div>
                <div class="oj-typography-body-sm oj-text-color-secondary" style="color: red;">
                  Debug: checkedAppIds: {JSON.stringify(checkedAppIds)} | Selected from refs: {JSON.stringify(Object.keys(checkboxRefs.current).filter(appId => checkboxRefs.current[appId]?.value === true))}
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