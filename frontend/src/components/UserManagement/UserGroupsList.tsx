import { h } from 'preact';
import { GroupData } from "../../types/userManagement";
import "oj-c/list-item-layout";
import "ojs/ojbutton";
import "ojs/ojprogress-circle";
import "../../styles/userManagement.css";

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

export default function UserGroupsList({
  loading,
  error,
  groups,
  searchTerm = "",
  onEditClick,
  onDeleteClick,
}: Props) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <oj-progress-circle value={-1} size="lg" />
        <p>Loading groups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <p class="oj-text-color-danger" style={{ textAlign: "center", marginTop: "20px" }}>
        {error}
      </p>
    );
  }

  if (groups.length === 0) {
    return (
      <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center" style="height: 40vh;">
        <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center oj-sm-flex-direction-column">
          <p class="oj-text-color-secondary" style="font-weight: bold; font-size: 1.25rem; text-align: center;">
            {searchTerm
              ? "No groups match your search criteria!"
              : "Create your first user group to get started."}
          </p>
        </div>
      </div>
    );
  }

  const renderGroupItem = (item: GroupData) => {
    return (
      <div class="group-list-item">
        <oj-c-list-item-layout inset="none">
          <div class="group-content">
            <div class="group-main-content">
              <div class="group-name-container">
                <span class="oj-typography-heading-sm oj-text-color-primary">
                  {item.groupName}
                </span>
                {item.is_admin && <span class="system-group-pill">System Group</span>}
                <span class={`status-pill ${item.is_admin ? 'status-active' : 'status-inactive'}`}>
                  {item.is_admin ? 'Active' : 'Inactive'}
                </span>
              </div>

              {item.description && (
                <div class="group-description">
                  {item.description}
                </div>
              )}

              <div class="group-meta">
                Created: {formatDateDMY(item.createdDate)} • {item.createdAgo}
              </div>

              <div class="group-counts-row">
                <span class="group-count-bold">Members: {item.members?.length || 0}</span>
                <span class="group-count-bold">Applications: {item.assigned_applications?.length || 0}</span>
              </div>
            </div>

            <div class="group-actions">
              <div class="action-buttons">
                <oj-button display="all" class="oj-button-sm" onojAction={() => onEditClick(item)}>
                  <span slot="startIcon" class="oj-ux-ico-edit"></span>
                  Edit
                </oj-button>

                {!item.is_admin && item.groupName.toLowerCase() !== 'admin group' && (
                  <oj-button
                    display="all"
                    class="oj-button-sm oj-button-danger"
                    onojAction={() => onDeleteClick(item)}
                  >
                    <span slot="startIcon" class="oj-ux-ico-trash"></span>
                    Delete
                  </oj-button>
                )}
              </div>
            </div>
          </div>
        </oj-c-list-item-layout>
      </div>
    );
  };

  return (
    <div class="groups-list-container">
      {groups.map((group) => (
        <div key={group.groupId}>
          {renderGroupItem(group)}
        </div>
      ))}
    </div>
  );
} 