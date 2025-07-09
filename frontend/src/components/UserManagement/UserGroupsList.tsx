import { h } from "preact";
import { GroupData } from "../../types/userManagement";

type Props = {
  loading: boolean;
  error: string | null;
  groups: GroupData[];
  searchTerm?: string;
  onEditClick: (group: GroupData) => void;
  onDeleteClick: (group: GroupData) => void;
};

function formatDateDMY(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function UserGroupsList({ loading, error, groups, searchTerm = "", onEditClick, onDeleteClick }: Props) {

  if(loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <oj-progress-circle value={-1} size="lg" />
        <p>Loading groups...</p>
      </div>
    );
  }

  if (error) {
    return <p class="oj-text-color-danger" style={{ textAlign: 'center', marginTop: '20px' }}>{error}</p>;
  }

  if (groups.length === 0) {
    return (
      <div
        class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center"
        style="height: 40vh;"
      >
        <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center oj-sm-flex-direction-column">
          <p
            class="oj-text-color-secondary"
            style="font-weight: bold; font-size: 1.25rem; text-align: center;"
          >
            {searchTerm
              ? "No groups match your search criteria!"
              : "Create your first user group to get started."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div class="groups-list">
      {groups.map((group) => {
        console.log('Group data:', group.groupName, 'is_admin:', group.is_admin);
        return (
          <div key={group.groupId} class="group-item oj-list-item-layout">
            <div class="oj-flex oj-sm-flex-direction-column">
              {/* Group Name */}
              <div class="group-name-container">
                <span class="oj-typography-heading-sm oj-text-color-primary">
                  {group.groupName}
                </span>
                {group.is_admin && (
                  <span class="system-group-pill">System Group</span>
                )}
                <span
                  class={`status-pill ${group.is_admin ? "status-active" : "status-inactive"}`}
                >
                  {group.is_admin ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Description */}
              {group.description && (
                <span class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-top">
                  {group.description}
                </span>
              )}

              {/* Member Count and Date */}
              <span class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-top">
                Created: {formatDateDMY(group.createdDate)} •{" "}
                {group.createdAgo}
              </span>
              <div class="group-counts-row">
                <span class="group-count-bold">
                  Members: {group.members?.length || 0}
                </span>
                <span class="group-count-bold">
                  Applications: {group.assigned_applications?.length || 0}
                </span>
              </div>
            </div>

            <div class="action-buttons">
              <oj-button
                display="all"
                class="oj-button-sm"
                onojAction={() => onEditClick(group)}
              >
                <span slot="startIcon" class="oj-ux-ico-edit"></span>
                Edit
              </oj-button>

              {!group.is_admin && group.groupName.toLowerCase() !== 'admin group' && (
                <oj-button
                  display="all"
                  class="oj-button-sm oj-button-danger"
                  onojAction={() => onDeleteClick(group)}
                >
                  <span slot="startIcon" class="oj-ux-ico-trash"></span>
                  Delete
                </oj-button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 