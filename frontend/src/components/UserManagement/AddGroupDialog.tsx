import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { userGroupService } from '../../services/userGroupServices';
import { MemberData, ApplicationOption } from '../../types/userManagement';
import 'ojs/ojinputsearch';
import 'ojs/ojbutton';
import 'ojs/ojlistview';
import 'ojs/ojavatar';
import 'ojs/ojcheckboxset';
import 'ojs/ojinputtext';
import 'ojs/ojlabel';
import 'oj-c/checkbox';
import 'oj-c/dialog';
import 'oj-c/form-layout';
import 'oj-c/list-view';
import 'oj-c/skeleton';
import 'oj-c/message-banner';
import '../../styles/AddGroupDialog.css';


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
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      const currentSearchValue = searchInputRef.current?.value || '';
      if (currentSearchValue !== searchTerm) {
        console.log('Search value changed from ref:', currentSearchValue);
        setSearchTerm(currentSearchValue);
        setSearchTrigger(prev => prev + 1);
      }
    }, 100); // Check every 100ms
    
    return () => clearInterval(interval);
  }, [isOpen, searchTerm]);

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
             console.log('Filtering members with searchTerm:', searchTerm);
             const matches = searchTerm === '' || 
                            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.email.toLowerCase().includes(searchTerm.toLowerCase());
             console.log(`Member ${m.email} matches:`, matches);
             return matches;
           })()
  );

    if (!isOpen) return null;

  return (
    <oj-c-dialog opened={isOpen} on-oj-close={handleClose}>
      <div slot="header">
        <h2 id="add-dialog-title">Add New Group</h2>
      </div>

      <div slot="body">
        <p>Create a new group and manage members using the directory below.</p>

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
                placeholder="Enter group name (5-20 characters)"
              />
              <div class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-top">
                5–20 letters, numbers, spaces, hyphens, underscores.
              </div>
            </div>

            <div class="member-sections-container">
              {/* Available Members Section */}
              <div class="available-members-section">
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
                      <p class="oj-text-color-secondary">
                        {searchTerm ? 'No members found' : 'No available members'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Members Section */}
              <div class="current-members-section">
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
            </div>
          </div>
        )}
      </div>

      <div slot="footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <oj-button on-oj-action={handleClose} onClick={handleClose}>Cancel</oj-button>
        <oj-button chroming="callToAction" on-oj-action={handleCreateGroup} onClick={handleCreateGroup} disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Group'}
        </oj-button>
      </div>
    </oj-c-dialog>
  );
} 