import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { MemberData, ApplicationOption } from '../../types/userManagement';
import 'ojs/ojavatar';
import 'ojs/ojinputtext';
import 'ojs/ojlabel';
import 'oj-c/checkbox';

interface GroupDialogBaseProps {
  isActive: boolean;
  isLoading: boolean;
  groupName?: string;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  availableMembers: MemberData[];
  selectedMembers: MemberData[];
  handleAddMember: (member: MemberData) => void;
  handleRemoveMember: (member: MemberData) => void;
  handleRemoveAllMembers: () => void;
  applications: ApplicationOption[];
  checkboxRefs: React.MutableRefObject<{ [key: string]: any }>;
  assignedAppIds?: string[];
  groupNameRef?: any;
  groupNameLabel?: string;
  disableApplicationSelection?: boolean;
  superAdminEmails?: string[];
  groupNameKey?: string;
}

export function GroupDialogBase({
  isActive,
  isLoading,
  groupName,
  searchTerm,
  setSearchTerm,
  availableMembers,
  selectedMembers,
  handleAddMember,
  handleRemoveMember,
  handleRemoveAllMembers,
  applications,
  checkboxRefs,
  assignedAppIds = [],
  groupNameRef,
  groupNameLabel = 'Group Name',
  disableApplicationSelection = false,
  superAdminEmails = [],
  groupNameKey = '',
}: GroupDialogBaseProps) {
  const isAdminGroup = groupNameKey.toLowerCase() === 'admin group';

  return (
    <div class="oj-flex oj-sm-flex-direction-column">
      {/* Group Name Input (optional) */}
      {groupNameRef && (
        <div class="oj-sm-margin-4x-bottom">
          <oj-label for="groupNameInput">{groupNameLabel}</oj-label>
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
      )}

      <div class="member-sections-container">
        {/* Available Members */}
        <div class="available-members-section">
          <h4 class="oj-typography-heading-sm oj-text-color-primary">Available Members</h4>
          <div class="oj-sm-margin-4x-bottom">
            <oj-input-text
              class="oj-form-control-full-width"
              placeholder="Search directory..."
              value={searchTerm}
              onrawValueChanged={(event: any) => setSearchTerm(event.detail.value || '')}
            />
          </div>
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
                      <div class="oj-typography-body-md oj-text-color-primary">{member.email}</div>
                      <div class="oj-typography-body-sm oj-text-color-secondary">{member.name}</div>
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

        {/* Selected Members */}
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
                on-oj-action={handleRemoveAllMembers}
                onClick={handleRemoveAllMembers}
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
                          {isAdminGroup && superAdminEmails.includes(member.email) && (
                            <span class="oj-typography-body-xs oj-text-color-info" style="margin-left: 8px;">(Superadmin)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!(isAdminGroup && superAdminEmails.includes(member.email)) && (
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

      {/* Accessible Applications */}
      <div class="oj-flex oj-sm-flex-direction-column oj-sm-margin-4x-top">
        <h4 class="oj-typography-heading-sm oj-text-color-primary oj-sm-margin-2x-bottom">
          Accessible Applications
          {isAdminGroup && (
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
              disabled={disableApplicationSelection || isAdminGroup}
            >
              {app.name}
            </oj-c-checkbox>
          ))}
        </div>
        <div class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-top">
          {isAdminGroup
            ? 'Application assignments cannot be modified for the admin group.'
            : 'At least one application must be selected for the group.'}
        </div>
      </div>
    </div>
  );
}
