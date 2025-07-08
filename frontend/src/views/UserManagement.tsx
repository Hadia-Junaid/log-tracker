import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { GroupData } from "../types/userManagement";
import { userGroupService } from "../services/userGroupServices";
import { AddGroupDialog } from "../components/UserManagement/AddGroupDialog";
import { EditGroupDialog } from "../components/UserManagement/EditGroupDialog";
import { DeleteGroupDialog } from "../components/UserManagement/DeleteGroupDialog";
import "ojs/ojinputsearch";
import "ojs/ojbutton";

type Props = {
  path?: string; // required by preact-router
};

function formatDateDMY(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function UserManagement(props: Props) {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<any>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    setError("");

    try {
      const groupsData = await userGroupService.fetchUserGroups();
      setGroups(groupsData);
    } catch (err: any) {
      setError("Failed to load groups. Please try again.");
      console.error("Failed to load groups:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGroups = groups.filter(
    (group) =>
      group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGroups = filteredGroups.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Helper to find all oj-buttons and attach listeners
    const addGroupBtn = container.querySelector('.oj-button-outlined-chrome');
    const editBtns = container.querySelectorAll('.oj-button-sm:not(.oj-button-danger)');
    const deleteBtns = container.querySelectorAll('.oj-button-danger');
    const prevBtn = container.querySelector('.pagination-container oj-button:first-of-type');
    const nextBtn = container.querySelector('.pagination-container oj-button:last-of-type');

    // Store listeners for cleanup
    const listeners: { el: Element, fn: EventListener }[] = [];

    if (addGroupBtn) {
      const fn = (e: Event) => { e.preventDefault(); handleAddGroup(); };
      addGroupBtn.addEventListener('ojAction', fn);
      listeners.push({ el: addGroupBtn, fn });
    }
    editBtns.forEach((btn, idx) => {
      const fn = (e: Event) => { e.preventDefault(); handleEditGroup(paginatedGroups[idx]); };
      btn.addEventListener('ojAction', fn);
      listeners.push({ el: btn, fn });
    });
    deleteBtns.forEach((btn, idx) => {
      // Only non-admin groups are deletable, so filter paginatedGroups
      const nonAdminGroups = paginatedGroups.filter(g => !g.is_admin);
      const fn = (e: Event) => { e.preventDefault(); handleDeleteGroup(nonAdminGroups[idx]); };
      btn.addEventListener('ojAction', fn);
      listeners.push({ el: btn, fn });
    });
    if (prevBtn) {
      const fn = (e: Event) => { e.preventDefault(); goToPrevPage(); };
      prevBtn.addEventListener('ojAction', fn);
      listeners.push({ el: prevBtn, fn });
    }
    if (nextBtn) {
      const fn = (e: Event) => { e.preventDefault(); goToNextPage(); };
      nextBtn.addEventListener('ojAction', fn);
      listeners.push({ el: nextBtn, fn });
    }

    // Attach search bar listener
    if (searchInputRef.current) {
      const searchListener = (e: Event) => {
        const ce = e as CustomEvent;
        setSearchTerm(ce.detail.value);
        setCurrentPage(1);
      };
      searchInputRef.current.addEventListener('rawValueChanged', searchListener);
      listeners.push({ el: searchInputRef.current, fn: searchListener });
    }

    return () => {
      listeners.forEach(({ el, fn }) => {
        el.removeEventListener('ojAction', fn);
        el.removeEventListener('rawValueChanged', fn);
      });
    };
  }, [paginatedGroups]);

  const handleAddGroup = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditGroup = (group: GroupData) => {
    setSelectedGroup(group);
    setIsEditDialogOpen(true);
  };

  const handleDeleteGroup = (group: GroupData) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  const handleGroupCreated = () => {
    loadGroups();
  };

  const handleGroupUpdated = () => {
    loadGroups();
  };

  const handleGroupDeleted = () => {
    loadGroups();
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (isLoading) {
    return (
      <div class="oj-hybrid-padding">
        <div class="oj-flex oj-sm-justify-content-center">
          <div class="oj-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div class="oj-hybrid-padding" ref={containerRef}>
      <div class="oj-flex oj-sm-flex-direction-column">
        <div class="oj-flex oj-sm-margin-4x-bottom">
          <h1 class="oj-typography-heading-lg oj-text-color-primary">Groups</h1>
        </div>

        {/* Global Banner */}
        {error && (
          <div class="oj-sm-margin-4x-bottom error-banner">{error}</div>
        )}

        {/* Search and Add Group Row */}
        <div class="oj-flex oj-sm-align-items-center oj-sm-flex-wrap oj-sm-margin-4x-bottom">
          <div class="oj-flex-item">
            <oj-input-search
              class="oj-form-control-full-width"
              placeholder="Search groups..."
              raw-value={searchTerm}
              ref={searchInputRef}
            />
          </div>

          <div class="oj-sm-margin-2x-start">
            <oj-button
              display="all"
              class="oj-button-outlined-chrome"
            >
              <span
                slot="startIcon"
                class="oj-ux-ico-plus"
                style="position: relative; top: -4px;"
              ></span>
              Add Group
            </oj-button>
          </div>
        </div>

        <div class="oj-flex oj-sm-align-items-start oj-sm-margin-4x-bottom">
          <h2 class="oj-typography-heading-md oj-text-color-primary oj-flex-item">
            Registered Groups
          </h2>

          <div style="display: inline-flex; flex-direction: column; align-items: flex-start; margin-left: 24px;">
            <span class="oj-typography-body-sm oj-text-color-secondary padding-2x-left">
              Total: {groups.length} groups
            </span>
          </div>
        </div>

        <div class="oj-flex oj-sm-flex-direction-column oj-sm-margin-4x-bottom">
          <p class="oj-typography-body-md oj-text-color-secondary">
            Manage user groups and their members. Groups are used to control
            access to application logs.
          </p>
        </div>
      </div>

      {/* Groups List */}
      <div
        class="oj-flex oj-sm-flex-direction-column"
        style="min-height: 70vh;"
      >
        <div style="min-height: 50vh;" class="oj-flex-item-auto">
          {paginatedGroups.length > 0 ? (
            <div class="groups-list">
              {paginatedGroups.map((group) => (
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
                    >
                      <span slot="startIcon" class="oj-ux-ico-edit"></span>
                      Edit
                    </oj-button>

                    {!group.is_admin && (
                      <oj-button
                        display="all"
                        class="oj-button-sm oj-button-danger"
                      >
                        <span slot="startIcon" class="oj-ux-ico-trash"></span>
                        Delete
                      </oj-button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )}
        </div>

        {/* Pagination controls */}
        <div class="pagination-container">
          <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center">
            <oj-button disabled={currentPage === 1}>
              Previous
            </oj-button>

            <div class="pagination-info">
              Page {currentPage} of {totalPages} • Showing {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, filteredGroups.length)} of{" "}
              {filteredGroups.length} groups
            </div>

            <oj-button
              disabled={currentPage === totalPages}
            >
              Next
            </oj-button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddGroupDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      {selectedGroup && (
        <EditGroupDialog
          isOpen={isEditDialogOpen}
          groupId={selectedGroup.groupId}
          groupName={selectedGroup.groupName}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedGroup(null);
          }}
          onGroupUpdated={handleGroupUpdated}
        />
      )}

      {selectedGroup && (
        <DeleteGroupDialog
          isOpen={isDeleteDialogOpen}
          groupId={selectedGroup.groupId}
          groupName={selectedGroup.groupName}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedGroup(null);
          }}
          onGroupDeleted={handleGroupDeleted}
        />
      )}
    </div>
  );
}