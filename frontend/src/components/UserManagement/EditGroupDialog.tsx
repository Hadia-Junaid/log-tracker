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
      
      setIsDataLoaded(true);
    } catch (err: any) {
      setError('Failed to load data. Please try again.');
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
    setShowCancelConfirmation(true);
  };

  const handleConfirmCancel = () => {
    handleClose();
  };

  const handleAbortCancel = () => {
    setShowCancelConfirmation(false);
  };

  const handleRemoveMember = (member: MemberData) => {
    // Prevent removing superadmins from admin group
    if (groupName.toLowerCase() === 'admin group' && superAdminEmails.includes(member.email)) {
      setError('Cannot remove superadmin users from admin group');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setSelectedMembers((prev) => prev.filter((m) => m.id !== member.id));
  };

  const handleAddMember = (member: MemberData) => {
    setSelectedMembers((prev) => [...prev, member]);
  };

  const handleRemoveAllMembers = () => {
    // Filter out superadmins if this is admin group
    if (groupName.toLowerCase() === 'admin group') {
      setSelectedMembers(prev => prev.filter(member => superAdminEmails.includes(member.email)));
      return;
    }
    setSelectedMembers([]);
  };

  // Available members = allMembers - selectedMembers, filtered by search term
  const availableMembers = allMembers.filter(
    (m: MemberData) => !selectedMembers.some((sel) => sel.id === m.id) &&
           (searchTerm === '' || 
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleApplicationToggle = (appId: string) => {
    // Skip for admin group
    if (groupName.toLowerCase() === 'admin group') {
      return;
    }
    
    const checkbox = checkboxRefs.current[appId];
    if (checkbox) {
      checkbox.value = !checkbox.value;
    }
  };

  const handleUpdateGroup = async () => {
    // Show confirmation dialog instead of directly updating
    setShowUpdateConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    // Store the selected application IDs immediately after successful validation
    const selectedAppIds = Object.keys(checkboxRefs.current).filter(appId => 
      checkboxRefs.current[appId]?.value === true
    );

    setIsUpdating(true);
    setError('');
    setShowUpdateConfirmation(false);

    try {
      const payload = {
        name: groupName,
        members: selectedMembers.map(m => m.email),
        assigned_applications: selectedAppIds,
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
      const originalAppIdsSorted = [...originalAppIds].sort();
      
      const addedApps = currentAppIds.filter(id => !originalAppIdsSorted.includes(id));
      const removedApps = originalAppIdsSorted.filter(id => !currentAppIds.includes(id));
      
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

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

            

            <div class="member-sections-container">
              {/* Available Members Section */}
              <div class="available-members-section">
                <h4 class="oj-typography-heading-sm oj-text-color-primary">Available Members</h4>

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
                                {groupName.toLowerCase() === 'admin group' && superAdminEmails.includes(member.email) && (
                                  <span class="oj-typography-body-xs oj-text-color-info" style="margin-left: 8px;">(Superadmin)</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Only show remove button if not a superadmin in admin group */}
                          {!(groupName.toLowerCase() === 'admin group' && superAdminEmails.includes(member.email)) && (
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
                          )}
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
                   {applications.filter(app => app.isActive).map(app => (
                     <oj-c-checkbox 
                       key={app.id}
                       ref={(el: any) => {
                         if (el) checkboxRefs.current[app.id] = el;
                       }}
                       value={assignedAppIds.includes(app.id)}
                       disabled={groupName.toLowerCase() === 'admin group'}
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
            </div>
          </div>
        )}
      </div>

      <div slot="footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <oj-button on-oj-action={handleClose} onClick={handleClose}>Cancel</oj-button>
        <oj-button 
          chroming="callToAction" 
          on-oj-action={handleUpdateGroup} 
          onClick={handleUpdateGroup} 
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
            <oj-button on-oj-action={handleAbortUpdate} onClick={handleAbortUpdate}>Cancel</oj-button>
            <oj-button chroming="callToAction" on-oj-action={handleConfirmUpdate} onClick={handleConfirmUpdate}>
              Confirm
            </oj-button>
          </div>
        </oj-c-dialog>
      )}
    </oj-c-dialog>
  );
} 