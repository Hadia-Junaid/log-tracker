import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { userGroupService } from '../../services/userGroupServices';
import { MemberData, ApplicationOption } from '../../types/userManagement';
import { GroupDialogBase } from './GroupDialogBase';
import { useUser } from '../../context/UserContext';
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
}

export function AddGroupDialog({ 
  isOpen, 
  onClose, 
  onGroupCreated
}: AddGroupDialogProps) {
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [allMembers, setAllMembers] = useState<MemberData[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const searchInputRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const groupNameRef = useRef<any>(null);
  const checkboxRefs = useRef<{ [key: string]: any }>({});

  // Get the refreshUser function from UserContext
  const { refreshUser } = useUser();

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
      const [allApplications, members] = await Promise.all([
        userGroupService.fetchApplications(),
        userGroupService.searchUsers(''),
      ]);

      console.log('Fetched applications:', allApplications);
      console.log('Active applications:', allApplications.filter(app => app.isActive));
      
      setApplications(allApplications);
      setAllMembers(members);
      
      setIsDataLoaded(true);
    } catch (err: any) {
      setError('Failed to load data. Please try again.');
      // close the dialog after 1.5 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
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
        members: selectedMembers.map(m => ({ name: m.name, email: m.email })),
        assigned_applications: selectedAppIds,
        is_active: isActive,
        is_admin: false
      };

      await userGroupService.createUserGroup(payload);

      // Set success message
      setSuccessMessage('Group created successfully');
      
      // Refresh user data to update header groups count
      await refreshUser();
      
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

  // Available members = allMembers - selectedMembers, filtered by search term
  const availableMembers = allMembers
    .filter(
      (m) => !selectedMembers.some((sel) => sel.id === m.id) &&
             (searchTerm === '' || 
              m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              m.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (searchTerm === '') return 0;
      
      const searchLower = searchTerm.toLowerCase();
      const aNameLower = a.name.toLowerCase();
      const bNameLower = b.name.toLowerCase();
      const aEmailLower = a.email.toLowerCase();
      const bEmailLower = b.email.toLowerCase();
      
      // Check if names start with search term
      const aNameStartsWith = aNameLower.startsWith(searchLower);
      const bNameStartsWith = bNameLower.startsWith(searchLower);
      
      // Check if emails start with search term
      const aEmailStartsWith = aEmailLower.startsWith(searchLower);
      const bEmailStartsWith = bEmailLower.startsWith(searchLower);
      
      // Priority order:
      // 1. Names that start with search term
      // 2. Emails that start with search term
      // 3. Names that contain search term
      // 4. Emails that contain search term
      // 5. Original order
      
      if (aNameStartsWith && !bNameStartsWith) return -1;
      if (!aNameStartsWith && bNameStartsWith) return 1;
      
      if (aEmailStartsWith && !bEmailStartsWith) return -1;
      if (!aEmailStartsWith && bEmailStartsWith) return 1;
      
      // If both have same priority, sort alphabetically by name
      return aNameLower.localeCompare(bNameLower);
    });

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
          
      </div>

      <div slot="body">
        <div class="oj-flex oj-sm-align-items-center oj-sm-margin-4x-bottom">
          <p style={{ margin: 0, flex: 1 }}>Create a new group and manage members using the directory below.</p>
          <div class="oj-flex oj-sm-align-items-center" style={{ marginLeft: '2rem' }}>
            <oj-label for="appIsActive" style={{ marginRight: '0.5rem', marginTop: '0.5rem' }}>Status (Active/Inactive)</oj-label>
            <oj-switch
              id="appIsActive"
              value={isActive}
              onvalueChanged={(e: CustomEvent) => setIsActive(e.detail.value)}
              disabled={isLoading}
              aria-label="Status"
              class="oj-form-control"
            ></oj-switch>
          </div>
        </div>

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
          <GroupDialogBase
            isActive={isActive}
            isLoading={isLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            availableMembers={availableMembers}
            selectedMembers={selectedMembers}
            handleAddMember={handleAddMember}
            handleRemoveMember={handleRemoveMember}
            handleRemoveAllMembers={handleRemoveAllMembers}
            applications={applications}
            checkboxRefs={checkboxRefs}
            groupNameRef={groupNameRef}
            groupNameLabel="Group Name"
            disableApplicationSelection={false}
            groupNameKey=""
          />
        )}
      </div>

      <div slot="footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>        
        <oj-button onojAction={handleCancelClick}>Cancel</oj-button>
        <oj-button 
          chroming="callToAction" 
          onojAction={handleCreateGroup} 
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
            <oj-button  onojAction={handleAbortCancel}>Cancel</oj-button>
            <oj-button chroming="danger" onojAction={handleConfirmCancel}>
              Confirm
            </oj-button>
            </div>
        </oj-c-dialog>
      )}
    </oj-c-dialog>
  );
} 