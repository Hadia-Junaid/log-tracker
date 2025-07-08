import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { userGroupService } from '../services/userGroupServices';
import { MemberData, ApplicationOption } from '../types/userManagement';
import 'ojs/ojinputsearch';
import 'ojs/ojbutton';
import 'ojs/ojlistview';
import 'ojs/ojavatar';
import 'oj-c/checkbox';
import 'ojs/ojinputtext';
import 'ojs/ojlabel';

interface EditGroupDialogProps {
  isOpen: boolean;
  groupId: string;
  groupName: string;
  onClose: () => void;
  onGroupUpdated: () => void;
}

export function EditGroupDialog({ 
  isOpen, 
  groupId, 
  groupName, 
  onClose, 
  onGroupUpdated 
}: EditGroupDialogProps) {
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [allMembers, setAllMembers] = useState<MemberData[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [superAdminEmails, setSuperAdminEmails] = useState<string[]>([]);
  const [checkedAppIds, setCheckedAppIds] = useState<string[]>([]);
  const [currentCheckboxValues, setCurrentCheckboxValues] = useState<{ [key: string]: boolean }>({});

  const searchInputRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkboxRefs = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (isOpen) {
      loadGroupDetails();
      loadApplications();
      fetchAndStoreAllMembers();
      loadCurrentGroups();
    }
  }, [isOpen, groupId]);

  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      const currentSearchValue = searchInputRef.current?.value || '';
      if (currentSearchValue !== searchTerm) {
        console.log('Search value changed from ref:', currentSearchValue);
        setSearchTerm(currentSearchValue);
      }
    }, 100); // Check every 100ms
    
    return () => clearInterval(interval);
  }, [isOpen, searchTerm]);



  const loadGroupDetails = async () => {
    setIsLoading(true);
    setError('');

    try {
      const groupDetails = await userGroupService.fetchGroupById(groupId);
      
      // Set current members
      const members: MemberData[] = groupDetails.members?.map((member: any) => ({
        id: member._id || `fallback-id-${member.email}`,
        name: member.name || member.email,
        email: member.email,
        initials: getInitials(member.name || member.email)
      })) || [];
      setSelectedMembers(members);

      // Set applications with checked state
      const assignedAppIds = new Set(groupDetails.assigned_applications?.map((app: any) => app._id) || []);

      setSuperAdminEmails((groupDetails as any).superAdminEmails || []);
      setCheckedAppIds(Array.from(assignedAppIds));

    } catch (err: any) {
      setError('Failed to load group details. Please try again.');
      console.error('Failed to load group details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadApplications = async () => {
    setIsLoading(true);
    setError('');

    try {
      const allApplications = await userGroupService.fetchApplications();
      setApplications(allApplications);
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
if (superAdminEmails.includes(member.email)) {
  return;
}
    setSelectedMembers((prev) => prev.filter((m) => m.id !== member.id));
  };

  const handleRemoveAllMembers = () => {
    setSelectedMembers([]);
  };

  const handleCheckboxChange = (appId: string, checked: boolean) => {
    console.log(`Checkbox ${appId} changed to:`, checked);
    setCurrentCheckboxValues(prev => ({
      ...prev,
      [appId]: checked
    }));
  };

  const validateForm = (): string | null => {
    // Skip application validation for admin group since checkboxes are readonly
    if (groupName.toLowerCase() === 'admin group') {
      console.log('Skipping application validation for admin group');
      return null;
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

  const handleUpdateGroup = async () => {
    console.log('=== UPDATE GROUP DEBUG ===');
    console.log('Selected members:', selectedMembers);
    console.log('Selected members emails:', selectedMembers.map(m => m.email));
    
    const validationError = validateForm();
    if (validationError) {
      console.log('Validation failed:', validationError);
      setError(validationError);
      return;
    }

    // Store the selected application IDs immediately after successful validation
    console.log('=== CHECKBOX DEBUG ===');
    console.log('All checkbox refs:', Object.keys(checkboxRefs.current));
    console.log('Checked app IDs from state:', checkedAppIds);
    
    // Debug each checkbox value
    Object.keys(checkboxRefs.current).forEach(appId => {
      const checkbox = checkboxRefs.current[appId];
      console.log(`Checkbox ${appId}:`, {
        exists: !!checkbox,
        value: checkbox?.value,
        checked: checkbox?.checked,
        shouldBeChecked: checkedAppIds.includes(appId)
      });
    });
    
    const newAppIds = Object.keys(checkboxRefs.current).filter(appId => 
      checkboxRefs.current[appId]?.value === true
    );
    console.log('New app IDs after successful validation:', newAppIds);
    console.log('Previous app IDs:', checkedAppIds);

    setIsUpdating(true);
    setError('');

    try {
      // Update members first
      const memberPayload = {
        name: groupName,
        members: selectedMembers.map(m => m.email),
        is_admin: false
      };
      console.log('Sending member update payload:', memberPayload);
      await userGroupService.updateUserGroup(groupId, memberPayload);

      // Skip application assignment changes for admin group
      if (groupName.toLowerCase() !== 'admin group') {
        // Update all applications at once instead of individual calls
        console.log('Updating applications from:', checkedAppIds, 'to:', newAppIds);
        
        // Update the group with the new applications array
        const updatePayload = {
          name: groupName,
          members: selectedMembers.map(m => m.email),
          applications: newAppIds,
          is_admin: false
        };
        
        console.log('Sending application update payload:', updatePayload);
        await userGroupService.updateUserGroup(groupId, updatePayload);
      } else {
        console.log('Skipping application assignment changes for admin group');
      }

      onGroupUpdated();
      handleClose();
    } catch (err: any) {
      setError('Failed to update group. Please try again.');
      console.error('Failed to update group:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
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

  // Available members = allMembers - selectedMembers, filtered by search term
  const availableMembers = allMembers.filter(
    (m) => !selectedMembers.some((sel) => sel.id === m.id) &&
           (() => {
             const matches = searchTerm === '' || 
                            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.email.toLowerCase().includes(searchTerm.toLowerCase());
             return matches;
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

      <div class="oj-dialog" role="dialog" aria-labelledby="edit-dialog-title">
        <div class="oj-dialog-header">
          <h2 id="edit-dialog-title" class="oj-dialog-title">Edit Group: {groupName}</h2>
          <p class="oj-typography-body-sm oj-text-color-secondary">
            Edit group members and accessible applications.
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

              {/* Group Name Display (Read-only) */}
              <div class="oj-sm-margin-4x-bottom">
                <oj-label for="groupNameDisplay">Group Name</oj-label>
                <oj-input-text
                  id="groupNameDisplay"
                  value={groupName}
                  readonly
                  class="oj-form-control-full-width"
                />
                <div class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-top">
                  Group name cannot be edited.
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
                    <h4 class="oj-typography-heading-sm oj-text-color-primary">Current Members</h4>
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
                  {groupName.toLowerCase() === 'admin group' && (
                    <span class="oj-typography-body-sm oj-text-color-secondary" style="margin-left: 8px;">
                      (Read-only for admin group)
                    </span>
                  )}
                </h4>
                <div class="oj-flex oj-sm-flex-direction-column applications-checkboxes">
                  {applications.map(app => (
                    <oj-c-checkbox 
                      key={app.id}
                      ref={(el: any) => {
                        if (el) checkboxRefs.current[app.id] = el;
                      }}
                      value={currentCheckboxValues[app.id] ?? checkedAppIds.includes(app.id)}
                      disabled={groupName.toLowerCase() === 'admin group'}
                      on-value-changed={(event: any) => handleCheckboxChange(app.id, event.detail.value)}
                    >
                      {app.name}
                    </oj-c-checkbox>
                  ))}
                </div>
                <div class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-top">
                  {groupName.toLowerCase() === 'admin group' 
                    ? 'Application assignments cannot be modified for the admin group.'
                    : 'At least one application must be selected for the group.'
                  }
                </div>
                <div class="oj-typography-body-sm oj-text-color-secondary" style="color: red;">
                  Debug: checkedAppIds: {JSON.stringify(checkedAppIds)} | Selected from refs: {JSON.stringify(Object.keys(checkboxRefs.current).filter(appId => checkboxRefs.current[appId]?.value === true))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div class="oj-dialog-footer">
          <oj-button on-oj-action={handleClose} onClick={handleClose} disabled={isUpdating}>
            Cancel
          </oj-button>
          <oj-button 
            chroming="callToAction" 
            on-oj-action={handleUpdateGroup} onClick={handleUpdateGroup}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Group'}
          </oj-button>
        </div>
      </div>
    </div>
  );
} 