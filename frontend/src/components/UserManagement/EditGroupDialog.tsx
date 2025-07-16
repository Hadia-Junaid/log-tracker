import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { userGroupService } from '../../services/userGroupServices';
import { MemberData, ApplicationOption } from '../../types/userManagement';
import { GroupDialogBase } from './GroupDialogBase';
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

interface EditGroupDialogProps {
  isOpen: boolean;
  groupId: string;
  groupName: string;
  isAdmin?: boolean; // Optional prop to indicate if this is the admin group
  onClose: () => void;
  onGroupUpdated: () => void;
}

export function EditGroupDialog({
  isOpen,
  groupId,
  groupName,
  isAdmin = false, // Default to false if not provided
  onClose,
  onGroupUpdated
}: EditGroupDialogProps) {
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [allMembers, setAllMembers] = useState<MemberData[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [assignedAppIds, setAssignedAppIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [superAdminEmails, setSuperAdminEmails] = useState<string[]>([]);
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);
  
  // Store original data for comparison
  const [originalMembers, setOriginalMembers] = useState<MemberData[]>([]);
  const [originalAppIds, setOriginalAppIds] = useState<string[]>([]);
  const [originalIsActive, setOriginalIsActive] = useState(true);

  const searchInputRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      const [allApplications, members, groupDetails] = await Promise.all([
        userGroupService.fetchApplications(),
        userGroupService.searchUsers(''),
        userGroupService.fetchGroupById(groupId)
      ]);

      console.log('Fetched applications:', allApplications);
      console.log('Active applications:', allApplications.filter((app: ApplicationOption) => app.isActive));
      
      setApplications(allApplications);
      setAllMembers(members);

      // Set initial selected members and applications from group details
      if (groupDetails) {
        const groupMembers = groupDetails.members || [];
        const membersData = members.filter((member: MemberData) => 
          groupMembers.some((gm: { email: string }) => gm.email === member.email)
        );
        setSelectedMembers(membersData);
        setOriginalMembers([...membersData]); // Store original members

        // Set assigned applications
        const assignedAppIds = groupDetails.assigned_applications?.map((app: { _id: string }) => app._id) || [];
        console.log('Assigned app IDs from group details:', assignedAppIds);
        setAssignedAppIds(assignedAppIds);
        setOriginalAppIds([...assignedAppIds]); // Store original app IDs
        
        // Set is_active status
        const groupIsActive = groupDetails.is_active !== false; // Handle undefined as true
        setIsActive(groupIsActive);
        setOriginalIsActive(groupIsActive);
        
        // Store super admin emails if this is the admin group
        if (groupDetails.is_admin && groupDetails.super_admin_emails) {
          setSuperAdminEmails(groupDetails.super_admin_emails);
        }
      }

      isAdmin = groupDetails.is_admin || false; // Ensure isAdmin reflects the group details
      
      setIsDataLoaded(true);
    } catch (err: any) {
      setError('Failed to load data. Please try again.');
      setTimeout(() => {
        handleClose();
      }, 2000);
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedMembers([]);
    setAllMembers([]);
    setApplications([]);
    setSearchTerm('');
    setError('');
    setSuccessMessage('');
    setShowCancelConfirmation(false);
    setIsDataLoaded(false);
    setShowUpdateConfirmation(false);
    setOriginalMembers([]);
    setOriginalAppIds([]);
    setOriginalIsActive(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    onClose();
  };

  const handleCancelClick = () => {
    // Check if there's  NEW data entered that would be lost

    const hasChanges = 
      selectedMembers.length !== originalMembers.length ||
      !selectedMembers.every(m => originalMembers.some(om => om.email === m.email)) ||
      assignedAppIds.length !== originalAppIds.length ||
      !assignedAppIds.every(id => originalAppIds.includes(id)) ||
      isActive !== originalIsActive;
    
    

    if (hasChanges) {
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
  const handleRemoveMember = (member: MemberData) => {
    // Prevent removing superadmins from admin group
    if (isAdmin && superAdminEmails.includes(member.email)) {
      setError('Cannot remove superadmin users from admin group');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setSelectedMembers((prev) => prev.filter((m) => m.id !== member.id));
  };

  const handleAddMember = (member: MemberData) => {
    // if (selectedMembers.length >= 10) {
    //   setError('You can only add up to 10 members to a group in one action.');
    //   setTimeout(() => setError(''), 3000);
    //   return;
    // };
    setSelectedMembers((prev) => [...prev, member]);
  };

  const handleRemoveAllMembers = () => {
    // Filter out superadmins if this is admin group
    if (isAdmin) {
      setSelectedMembers(prev => prev.filter(member => superAdminEmails.includes(member.email)));
      return;
    }
    setSelectedMembers([]);
  };
const restoreBodyScroll = () => {
  document.body.style.overflow = 'auto';
};
  // Available members = allMembers - selectedMembers, filtered by search term
  const availableMembers = allMembers
    .filter(
      (m: MemberData) => !selectedMembers.some((sel) => sel.id === m.id) &&
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

  const handleUpdateGroup = async () => {
    // Show confirmation dialog instead of directly updating
    setShowUpdateConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    // Get currently selected active applications
    const selectedActiveAppIds = Object.keys(checkboxRefs.current).filter(appId => 
      checkboxRefs.current[appId]?.value === true
    );

    // Combine selected active apps with originally assigned inactive apps
    // This preserves inactive apps that were originally assigned
    const inactiveOriginalAppIds = originalAppIds.filter(appId => 
      !applications.some(app => app.id === appId && app.isActive)
    );
    const finalAssignedAppIds = [...selectedActiveAppIds, ...inactiveOriginalAppIds];

    setIsUpdating(true);
    setError('');
    setShowUpdateConfirmation(false);
    //if assigned_applications is empty, show error
    if (selectedActiveAppIds.length === 0) {
      setError('Please select at least one application for the group.');
      setIsUpdating(false);
      return;
    }

    try {
      const payload = {
        name: groupName,
        members: selectedMembers.map(m => ({ name: m.name, email: m.email })),
        assigned_applications: finalAssignedAppIds,
        is_admin: groupName.toLowerCase() === 'admin group',
        is_active: isActive
      };

      await userGroupService.updateUserGroup(groupId, payload);

      // Set success message
      setSuccessMessage('Group updated successfully');
      
      // Close dialog after a short delay to show the message
      setTimeout(() => {
        onGroupUpdated();
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
        setError('Failed to update group. Please try again.');
        // Only log unexpected errors (not validation errors)
        console.error('Failed to update group:', err);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAbortUpdate = () => {
    setShowUpdateConfirmation(false);
  };

  const getChangesSummary = () => {
    const changes: string[] = [];
    
    // Check member changes
    const currentMemberEmails = selectedMembers.map(m => m.email).sort();
    const originalMemberEmails = originalMembers.map(m => m.email).sort();
    
    const addedMembers = currentMemberEmails.filter(email => !originalMemberEmails.includes(email));
    const removedMembers = originalMemberEmails.filter(email => !currentMemberEmails.includes(email));
    
    if (addedMembers.length > 0) {
      changes.push(`Added ${addedMembers.length} member(s): ${addedMembers.join(', ')}`);
    }
    if (removedMembers.length > 0) {
      changes.push(`Removed ${removedMembers.length} member(s): ${removedMembers.join(', ')}`);
    }
    
    // Check application changes (skip for admin group)
    if (groupName.toLowerCase() !== 'admin group') {
      const currentAppIds = Object.keys(checkboxRefs.current).filter(appId => 
        checkboxRefs.current[appId]?.value === true
      ).sort();
      
      // Only consider original apps that are currently active (visible in UI)
      // This prevents showing "removed" for inactive apps that are simply not visible
      const activeOriginalAppIds = originalAppIds.filter(appId => 
        applications.some(app => app.id === appId && app.isActive)
      ).sort();
      
      const addedApps = currentAppIds.filter(id => !activeOriginalAppIds.includes(id));
      const removedApps = activeOriginalAppIds.filter(id => !currentAppIds.includes(id));
      
      if (addedApps.length > 0) {
        const addedAppNames = addedApps.map(id => applications.find(app => app.id === id)?.name || id);
        changes.push(`Added ${addedApps.length} application(s): ${addedAppNames.join(', ')}`);
      }
      if (removedApps.length > 0) {
        const removedAppNames = removedApps.map(id => applications.find(app => app.id === id)?.name || id);
        changes.push(`Removed ${removedApps.length} application(s): ${removedAppNames.join(', ')}`);
      }
    }
    
    // Check active/inactive status change
    if (isActive !== originalIsActive) {
      const statusChange = isActive ? 'Active' : 'Inactive';
      changes.push(`Status changed to: ${statusChange}`);
    }
    
    return changes;
  };

  

  // Don't render the dialog until opened
  if (!isOpen) return null;

  // Show dialog immediately with loading states  
  return (
    <oj-c-dialog opened={isOpen} on-oj-close={handleClose} width="800px"
  height="800px"
  min-width="600px"
  max-width="90vw"
  min-height="300px"
  max-height="80vh">
      <div slot="header">
        <h2 id="edit-dialog-title">Edit Group: {groupName}</h2>

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
          <p style={{ margin: 0, flex: 1 }}>Edit group members and accessible applications.</p>
          <div class="oj-flex oj-sm-align-items-center" style={{ marginLeft: '2rem' }}>
            <oj-label for="appIsActive" style={{ marginRight: '0.5rem', marginTop: '0.5rem' }}>Status (Active/Inactive)</oj-label>
            <oj-switch
              id="appIsActive"
              value={isActive}
              onvalueChanged={(e: CustomEvent) => setIsActive(e.detail.value)}
              disabled={isLoading || isAdmin}
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
            assignedAppIds={assignedAppIds}
            disableApplicationSelection={isAdmin}
            superAdminEmails={superAdminEmails}
            groupNameKey={groupName}
          />
        )}
      </div>

      <div slot="footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <oj-button onojAction={handleCancelClick}>Cancel</oj-button>
        <oj-button 
          chroming="callToAction" 
          onojAction={handleUpdateGroup} 
          disabled={isUpdating || !isDataLoaded}
        >
          {isUpdating ? 'Updating...' : 'Update Group'}
        </oj-button>
      </div>

      {/* Update Confirmation Dialog */}
      {showUpdateConfirmation && (
        <oj-c-dialog 
          opened={showUpdateConfirmation} 
          on-oj-close={handleAbortUpdate}
          width="600px"
          height="400px"
          min-width="500px"
          max-width="90vw"
          min-height="300px"
          max-height="80vh"
        >
          <div slot="header">
            <h3 id="update-confirmation-title">Confirm Group Update</h3>
          </div>

          <div slot="body">
            <p style={{ marginBottom: '16px' }}>
              You are about to update the group <strong>"{groupName}"</strong>.
            </p>
            
            {(() => {
              const changes = getChangesSummary();
              return changes.length > 0 ? (
                <div>
                  <p style={{ marginBottom: '12px', fontWeight: 'bold' }}>Summary of changes:</p>
                  <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
                    {changes.map((change, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>{change}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ marginBottom: '16px', fontStyle: 'italic', color: '#6c757d' }}>
                  No changes detected.
                </p>
              );
            })()}
            
            <p>Are you sure you want to proceed with these changes?</p>
          </div>

          <div slot="footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <oj-button  onojAction={handleAbortUpdate}>Cancel</oj-button>
            <oj-button chroming="callToAction" onojAction={handleConfirmUpdate}>
              Confirm
            </oj-button>
          </div>
        </oj-c-dialog>
      )}

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
            <oj-button onojAction={handleAbortCancel}>Cancel</oj-button>
            <oj-button chroming="danger" onojAction={handleConfirmCancel}>
              Confirm
            </oj-button>
            </div>
        </oj-c-dialog>
      )}
    </oj-c-dialog>
  );
} 