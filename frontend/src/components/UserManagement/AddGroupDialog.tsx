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

  const loadAllData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Use cached data if available and fresh
      if (isBackgroundDataLoaded && cachedApplications.length > 0 && cachedUsers.length > 0) {
        setApplications(cachedApplications);
        setCheckedAppIds([]);
        setAllMembers(cachedUsers);
        
        // Only fetch current groups for reference
        const currentGroups = await userGroupService.fetchUserGroups(1, 1000, '');
        localStorage.setItem('userGroups', JSON.stringify(currentGroups.data));
        
        setIsDataLoaded(true);
        return;
      }

      // Fallback to full API loading if no cached data
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

  const handleCreateGroup = async () => {
    const groupName = groupNameRef.current?.value || '';
    const selectedAppIds = Object.keys(checkboxRefs.current).filter(appId => 
      checkboxRefs.current[appId]?.value === true
    );

    setIsCreating(true);
    setError('');

    try {
      const payload = {
        name: groupName,
        members: selectedMembers.map(m => m.email),
        assigned_applications: selectedAppIds,
        is_admin: false
      };

      await userGroupService.createUserGroup(payload);

      // Set success message
      setSuccessMessage('Group created successfully');
      
      // Close dialog after a short delay to show the message
      setTimeout(() => {
        onGroupCreated();
        handleClose();
      }, 1500);
      
    } catch (err: any) {
      // Handle validation errors from backend (400) and display the exact error message
      if (err.response?.status === 400) {
        setError(err.response.data.error);
        //unset error after 3 seconds
        setTimeout(() => {
          setError('');
        }, 3000);
      } else {
        setError('Failed to create group. Please try again.');
        // Only log unexpected errors (not validation errors)
        console.error('Failed to create group:', err);
      }
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
           (searchTerm === '' || 
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
                
                <h4 class="oj-typography-heading-sm oj-text-color-primary oj-sm-margin-1x-bottom" style={{ marginTop: 0, fontWeight: 'bold' }}>
                  Available Members
                </h4>

                {/* Search Input */}
                <div class="oj-sm-margin-4x-bottom">
                  <oj-input-text
                    class="oj-form-control-full-width"
                    placeholder="Search directory..."
                    value={searchTerm}
                    onrawValueChanged={(event: any) => {
                      setSearchTerm(event.detail.value || '');
                    }}
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
                <h4 class="oj-typography-heading-sm oj-text-color-primary oj-sm-margin-1x-bottom" style={{ marginTop: 0, fontWeight: 'bold' }}>
                  Selected Members
                </h4>
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
                        <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between" style="width: 100%;">
                          <div class="oj-flex oj-sm-align-items-center" style="min-width: 0; flex: 1;">
                            <oj-avatar size="xs" initials={member.initials}></oj-avatar>
                            <div class="oj-sm-margin-2x-start" style="min-width: 0; flex: 1;">
                              <div class="oj-typography-body-md oj-text-color-primary" style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                                {member.email}
                              </div>
                              <div class="oj-typography-body-sm oj-text-color-secondary" style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                                {member.name}
                              </div>
                            </div>
                          </div>
                          <div style="flex-shrink: 0; margin-left: 8px;">
                            <oj-button 
                              class="member-remove-btn oj-button-sm" 
                              chroming="borderless"
                              display="icons"
                              on-oj-action={() => handleRemoveMember(member)} 
                              onClick={() => handleRemoveMember(member)}
                              title="Remove member"
                            >
                              <span slot="startIcon" class="oj-ux-ico-close"></span>
                            </oj-button>
                          </div>
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
              <div class="applications-checkboxes">
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