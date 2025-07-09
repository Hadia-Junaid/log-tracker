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
import '../../styles/AddGroupDialog.css';

interface AddGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
  cachedApplications?: ApplicationOption[];
  cachedUsers?: MemberData[];
  isBackgroundDataLoaded?: boolean;
}

export function AddGroupDialog({ 
  isOpen, 
  onClose, 
  onGroupCreated,
  cachedApplications = [],
  cachedUsers = [],
  isBackgroundDataLoaded = false
}: AddGroupDialogProps) {
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [allMembers, setAllMembers] = useState<MemberData[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [checkedAppIds, setCheckedAppIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const searchInputRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const groupNameRef = useRef<any>(null);
  const checkboxRefs = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (isOpen && !isDataLoaded) {
      loadAllData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsDataLoaded(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isDataLoaded) return;
    
    const interval = setInterval(() => {
      const currentSearchValue = searchInputRef.current?.value || '';
      if (currentSearchValue !== searchTerm) {
        console.log('Search value changed from ref:', currentSearchValue);
        setSearchTerm(currentSearchValue);
        setSearchTrigger(prev => prev + 1);
      }
    }, 100); // Check every 100ms
    
    return () => clearInterval(interval);
  }, [isOpen, isDataLoaded, searchTerm]);

  const loadAllData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Use cached data if available and fresh
      if (isBackgroundDataLoaded && cachedApplications.length > 0 && cachedUsers.length > 0) {
        console.log('Using cached data for fast dialog loading');
        
        setApplications(cachedApplications);
        setCheckedAppIds([]);
        setAllMembers(cachedUsers);
        
        // Only fetch current groups for validation (much faster)
        const currentGroups = await userGroupService.fetchUserGroups(1, 1000, '');
        localStorage.setItem('userGroups', JSON.stringify(currentGroups.data));
        
        setIsDataLoaded(true);
        console.log('Dialog loaded with cached data in ~100ms');
        return;
      }

      // Fallback to full API loading if no cached data
      console.log('No cached data available, loading from API...');
      const [allApplications, members, currentGroups] = await Promise.all([
        userGroupService.fetchApplications(),
        userGroupService.searchUsers(''),
        userGroupService.fetchUserGroups(1, 1000, '')
      ]);

      setApplications(allApplications);
      setCheckedAppIds([]);
      
      localStorage.setItem('allDirectoryMembers', JSON.stringify(members));
      setAllMembers(members);
      
      localStorage.setItem('userGroups', JSON.stringify(currentGroups.data));
      
      setIsDataLoaded(true);
    } catch (err: any) {
      setError('Failed to load data. Please try again.');
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
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
      const response = await userGroupService.fetchUserGroups(1, 1000, ''); // Get all groups for validation
    const currentGroups = response.data;
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

      // Set success message
      setSuccessMessage('Group created successfully');
      
      // Close dialog after a short delay to show the message
      setTimeout(() => {
        onGroupCreated();
        handleClose();
      }, 1500);
      
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
    restoreBodyScroll();

    setSelectedMembers([]);
    setAllMembers([]);
    setApplications([]);
    setSearchTerm('');
    setError('');
    setSuccessMessage(''); // Clear success message
    setShowCancelConfirmation(false); // Clear confirmation dialog
    setIsDataLoaded(false);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    onClose();
  };

  const handleCancelClick = () => {
    // Check if there's any data entered that would be lost
    const hasGroupName = groupNameRef.current?.value?.trim();
    const hasSelectedMembers = selectedMembers.length > 0;
    const hasSelectedApplications = Object.keys(checkboxRefs.current).some(appId => 
      checkboxRefs.current[appId]?.value === true
    );
    
    if (hasGroupName || hasSelectedMembers || hasSelectedApplications) {
      setShowCancelConfirmation(true);
    } else {
      handleClose();
    }
  };

  const handleConfirmCancel = () => {
    restoreBodyScroll();
    handleClose();
  };

  const handleAbortCancel = () => {
    setShowCancelConfirmation(false);
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

  const restoreBodyScroll = () => {
  document.body.style.overflow = 'auto';
};

  // Don't render the dialog until data is loaded
  if (!isOpen) return null;

  // Show dialog immediately with loading states
  return (
    <oj-c-dialog opened={isOpen} on-oj-close={handleClose} width="850px"
  height="800px"
  min-width="600px"
  max-width="90vw"
  min-height="300px"
  max-height="80vh">
      <div slot="header">
        <h2 id="add-dialog-title">Add New Group</h2>
      </div>

      <div slot="body">
        <p>Create a new group and manage members using the directory below.</p>

        {(!isDataLoaded || isLoading) ? (
          <div class="oj-flex oj-sm-flex-direction-column">
            {/* Loading skeleton */}
            <div class="oj-sm-margin-4x-bottom">
              <oj-c-skeleton height="60px" />
            </div>
            <div class="member-sections-container">
              <div class="available-members-section">
                <oj-c-skeleton height="200px" />
              </div>
              <div class="current-members-section">
                <oj-c-skeleton height="200px" />
              </div>
            </div>
            <div class="oj-sm-margin-4x-top">
              <oj-c-skeleton height="120px" />
            </div>
          </div>
        ) : (
          <div class="oj-flex oj-sm-flex-direction-column">
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
        <oj-button on-oj-action={handleCancelClick} onClick={handleCancelClick}>Cancel</oj-button>
        <oj-button 
          chroming="callToAction" 
          on-oj-action={handleCreateGroup} 
          onClick={handleCreateGroup} 
          disabled={isCreating || !isDataLoaded}
        >
          {isCreating ? 'Creating...' : 'Create Group'}
        </oj-button>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirmation && (
        <oj-c-dialog 
          opened={showCancelConfirmation} 
          on-oj-close={handleAbortCancel}
          width="500px"
          height="275px"
          min-width="300px"
          max-width="90vw"
          min-height="150px"
          max-height="80vh"
        >
          <div slot="header">
            <h3 id="cancel-confirmation-title">Discard Changes?</h3>
          </div>

            <div slot="body" style={{ marginBottom: '-8px' }}>
            <p style={{ marginBottom: '-8px' }}>You have unsaved changes. Are you sure you want to discard them?</p>
            </div>

            <div slot="footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0' }}>
            <oj-button on-oj-action={handleAbortCancel} onClick={handleAbortCancel}>Cancel</oj-button>
            <oj-button chroming="danger" on-oj-action={handleConfirmCancel} onClick={handleConfirmCancel}>
              Confirm
            </oj-button>
            </div>
        </oj-c-dialog>
      )}
    </oj-c-dialog>
  );
} 