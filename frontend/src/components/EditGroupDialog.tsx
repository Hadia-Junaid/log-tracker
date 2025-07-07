import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { userGroupService } from '../services/userGroupServices';
import { MemberData, ApplicationOption } from '../types/userManagement';
import 'ojs/ojinputsearch';
import 'ojs/ojbutton';
import 'ojs/ojlistview';
import 'ojs/ojavatar';
import 'ojs/ojcheckboxset';

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
  const [currentMembers, setCurrentMembers] = useState<MemberData[]>([]);
  const [availableMembers, setAvailableMembers] = useState<MemberData[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [superAdminEmails, setSuperAdminEmails] = useState<string[]>([]);
  const [isAdminGroup, setIsAdminGroup] = useState(false);

  const searchInputRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGroupDetails();
    }
  }, [isOpen, groupId]);

  const loadGroupDetails = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch group details and applications in parallel
      const [groupDetails, allApplications] = await Promise.all([
        userGroupService.fetchGroupById(groupId),
        userGroupService.fetchApplications()
      ]);

      // Set current members
      const members: MemberData[] = groupDetails.members?.map((member: any) => ({
        id: member._id || `fallback-id-${member.email}`,
        name: member.name || member.email,
        email: member.email,
        initials: getInitials(member.name || member.email)
      })) || [];
      setCurrentMembers(members);

      // Set applications with checked state
      const assignedAppIds = new Set(groupDetails.assigned_applications?.map((app: any) => app._id) || []);
      const appOptions: ApplicationOption[] = allApplications.map(app => ({
        id: app.id,
        name: app.name,
        checked: assignedAppIds.has(app.id)
      }));
      setApplications(appOptions);

      // Set admin status
      setIsAdminGroup(groupDetails.is_admin || false);

      // Set super admin emails if available
      setSuperAdminEmails((groupDetails as any).superAdminEmails || []);

    } catch (err: any) {
      setError('Failed to load group details. Please try again.');
      console.error('Failed to load group details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInput = async (value: string) => {
    setSearchTerm(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      if (value.trim().length < 2) {
        setAvailableMembers([]);
        return;
      }

      try {
        const users = await userGroupService.searchUsers(value);
        // Filter out users already in current members
        const filteredUsers = users.filter(user => 
          !currentMembers.some(member => member.id === user.id)
        );
        setAvailableMembers(filteredUsers);
      } catch (err: any) {
        console.error('Failed to search users:', err);
        setAvailableMembers([]);
      }
    }, 300);
  };

  const handleAddMember = (member: MemberData) => {
    setCurrentMembers(prev => [...prev, member]);
    setAvailableMembers(prev => prev.filter(m => m.id !== member.id));
  };

  const handleRemoveMember = (member: MemberData) => {
    // Don't allow removal if the member is a super admin
    if (superAdminEmails.includes(member.email)) {
      return;
    }

    setCurrentMembers(prev => prev.filter(m => m.id !== member.id));
    setAvailableMembers(prev => {
      const alreadyAvailable = prev.some(m => m.id === member.id);
      if (!alreadyAvailable) {
        return [...prev, member];
      }
      return prev;
    });
  };

  const handleRemoveAllMembers = () => {
    // Keep only super admin members
    const remainingMembers = currentMembers.filter(member => 
      superAdminEmails.includes(member.email)
    );
    const removedMembers = currentMembers.filter(member => 
      !superAdminEmails.includes(member.email)
    );

    setCurrentMembers(remainingMembers);
    setAvailableMembers(prev => [
      ...prev,
      ...removedMembers.filter(removed => 
        !prev.some(existing => existing.id === removed.id)
      )
    ]);
  };

  const handleApplicationToggle = (appId: string) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === appId 
          ? { ...app, checked: !app.checked }
          : app
      )
    );
  };

  const handleUpdateGroup = async () => {
    setIsUpdating(true);
    setError('');

    try {
      const selectedApplications = applications
        .filter(app => app.checked)
        .map(app => app.id);

      await userGroupService.updateUserGroup(groupId, {
        name: groupName,
        members: currentMembers.map(m => m.email),
        assigned_applications: selectedApplications
      });

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
    setCurrentMembers([]);
    setAvailableMembers([]);
    setApplications([]);
    setSearchTerm('');
    setError('');
    setSuperAdminEmails([]);
    setIsAdminGroup(false);
    
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
      <div class="oj-dialog" role="dialog" aria-labelledby="edit-dialog-title">
        <div class="oj-dialog-header">
          <h2 id="edit-dialog-title" class="oj-dialog-title">
            Edit Group: {groupName}
          </h2>
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

              <p class="oj-typography-body-md oj-text-color-secondary oj-sm-margin-4x-bottom">
                Manage group members using the directory below.
              </p>

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
                  <div class="members-list available-members-list">
                    {availableMembers.length > 0 ? (
                      availableMembers.map(member => (
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
                          {searchTerm ? 'No members found' : 'Type a name/email to begin search'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Members Section */}
                <div class="oj-flex-item oj-flex oj-sm-flex-direction-column current-members-section">
                  <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between oj-sm-margin-4x-bottom">
                    <h4 class="oj-typography-heading-sm oj-text-color-primary">Current Members</h4>
                    <div class="oj-flex oj-sm-align-items-center">
                      <span class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-end">
                        {currentMembers.length} members
                      </span>
                      <oj-button 
                        class="oj-button-sm" 
                        chroming="outlined"
                        on-oj-action={handleRemoveAllMembers}
                      >
                        Remove All
                      </oj-button>
                    </div>
                  </div>

                  {/* Current Members List */}
                  <div class="members-list current-members-list">
                    {currentMembers.length > 0 ? (
                      currentMembers.map(member => (
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
                            {!superAdminEmails.includes(member.email) && (
                              <oj-button 
                                class="member-remove-btn oj-button-sm" 
                                chroming="borderless"
                                display="icons"
                                on-oj-action={() => handleRemoveMember(member)}
                                title="Remove member"
                              >
                                <span slot="startIcon" class="oj-ux-ico-close"></span>
                              </oj-button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div class="no-members-content">
                        <p class="oj-text-color-secondary">No members in this group</p>
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

  <div
    class="applications-grid"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      alignItems: 'start',
    }}
  >
    {applications.map(app => (
      <div
        key={app.id}
        style={{
          all: 'unset',
        }}
      >
        <oj-checkboxset
          value={app.checked ? [app.id] : []}
          on-value-changed={(e: any) => handleApplicationToggle(app.id)}
          disabled={isAdminGroup}
          class="custom-checkboxset"
        >
          <oj-option value={app.id} class="custom-option">
            {app.name}
          </oj-option>
        </oj-checkboxset>
      </div>
    ))}
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
            on-oj-action={handleUpdateGroup}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Group'}
          </oj-button>
        </div>
      </div>
    </div>
  );
} 