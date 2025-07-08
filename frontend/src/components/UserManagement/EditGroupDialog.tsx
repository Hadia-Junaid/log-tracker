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
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [assignedAppIds, setAssignedAppIds] = useState<string[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const searchInputRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkboxRefs = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (isOpen && !isDataLoaded) {
      loadAllData();
    }
  }, [isOpen, groupId]);

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
      // Load all data in parallel
      const [groupDetails, allApplications, members, currentGroups] = await Promise.all([
        userGroupService.fetchGroupById(groupId),
        userGroupService.fetchApplications(),
        userGroupService.searchUsers(''),
        userGroupService.fetchUserGroups(1, 1000, '')
      ]);

      // Set current members
      const membersData: MemberData[] = groupDetails.members?.map((member: any) => ({
        id: member._id || `fallback-id-${member.email}`,
        name: member.name || member.email,
        email: member.email,
        initials: getInitials(member.name || member.email)
      })) || [];
      setSelectedMembers(membersData);

      // Set assigned applications
      const assignedAppIds = groupDetails.assigned_applications?.map((app: any) => app._id) || [];
      console.log('Assigned app IDs from group details:', assignedAppIds);
      setAssignedAppIds(assignedAppIds);

      setApplications(allApplications);
      
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
    // Skip for admin group
    if (groupName.toLowerCase() === 'admin group') {
      return;
    }
    
    const checkbox = checkboxRefs.current[appId];
    if (checkbox) {
      checkbox.value = !checkbox.value;
    }
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
    const validatedAppIds = Object.keys(checkboxRefs.current).filter(appId => 
      checkboxRefs.current[appId]?.value === true
    );
    console.log('Selected app IDs after successful validation:', validatedAppIds);

    setIsUpdating(true);
    setError('');

    try {
      const payload = {
        name: groupName,
        members: selectedMembers.map(m => m.email),
        assigned_applications: validatedAppIds,
        is_admin: false
      };
      console.log('Sending payload:', payload);

      await userGroupService.updateUserGroup(groupId, payload);

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
    setIsDataLoaded(false);
    
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

  // Don't render the dialog until data is loaded
  if (!isOpen || !isDataLoaded) return null;

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
        <p>Edit group members and accessible applications.</p>

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
        <oj-button chroming="callToAction" on-oj-action={handleUpdateGroup} onClick={handleUpdateGroup} disabled={isUpdating}>
          {isUpdating ? 'Updating...' : 'Update Group'}
        </oj-button>
      </div>
    </oj-c-dialog>
  );
} 