import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { GroupData } from "../types/userManagement";
import { userGroupService } from "../services/userGroupServices";
import { AddGroupDialog } from "../components/UserManagement/AddGroupDialog";
import { EditGroupDialog } from "../components/UserManagement/EditGroupDialog";
import { DeleteGroupDialog } from "../components/UserManagement/DeleteGroupDialog";
import UserGroupsList from "../components/UserManagement/UserGroupsList";
import "ojs/ojinputsearch";
import "ojs/ojbutton";

type Props = {
  path?: string; // required by preact-router
};

export default function UserManagement(props: Props) {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 4;

  const containerRef = useRef<HTMLDivElement>(null);
  const prevSearchTermRef = useRef<string>("");

  useEffect(() => {
    loadGroups(true); // Initial load
  }, []);

  const loadGroups = async (showLoading: boolean = true) => {
    if (showLoading) {
      setIsLoading(true);
      setIsInitialLoading(true);
    }
    setError("");

    try {
      const response = await userGroupService.fetchUserGroups(currentPage, PAGE_SIZE, searchTerm);
      setGroups(response.data);
      setTotalCount(response.total);
    } catch (err: any) {
      setError("Failed to load groups. Please try again.");
      console.error("Failed to load groups:", err);
    } finally {
      if (showLoading) {
        setIsLoading(false);
        setIsInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Show loading for search changes, but not for pagination
      const isSearchChange = searchTerm !== prevSearchTermRef.current;
      const showLoading = isSearchChange || currentPage === 1;
      loadGroups(showLoading);
      prevSearchTermRef.current = searchTerm;
    }, searchTerm ? 300 : 0); // Debounce for search, no delay for pagination
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm]);

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
    loadGroups(true);
  };

  const handleGroupUpdated = () => {
    loadGroups(true);
  };

  const handleGroupDeleted = () => {
    // If the last item on a page > 1 is deleted, go to the previous page
    if (groups.length === 1 && currentPage > 1) {
      setCurrentPage(p => p - 1);
    } else {
      loadGroups(true);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < Math.ceil(totalCount / PAGE_SIZE)) {
      setCurrentPage(currentPage + 1);
    }
  };

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
            <oj-input-text
              class="oj-form-control-full-width"
              placeholder="Search groups..."
              value={searchTerm}
              onrawValueChanged={(e: any) => {
                setSearchTerm(e.detail.value);
                setCurrentPage(1); // Reset to first page on new search
              }}
            />
          </div>

          <div class="oj-sm-margin-2x-start">
            <oj-button
              display="all"
              class="oj-button-outlined-chrome"
              onojAction={handleAddGroup}
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
              Total: {totalCount} groups
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
          <UserGroupsList
            loading={isInitialLoading}
            error={error}
            groups={groups}
            searchTerm={searchTerm}
            onEditClick={handleEditGroup}
            onDeleteClick={handleDeleteGroup}
          />
        </div>

        {/* Pagination controls */}
        <div class="pagination-container">
          <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center">
            <oj-button 
              disabled={currentPage === 1}
              onojAction={goToPrevPage}
            >
              Previous
            </oj-button>

            <div class="pagination-info">
              Page {currentPage} of {Math.ceil(totalCount / PAGE_SIZE)} • Showing {((currentPage - 1) * PAGE_SIZE) + 1}-
              {Math.min(currentPage * PAGE_SIZE, totalCount)} of{" "}
              {totalCount} groups
            </div>

            <oj-button
              disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
              onojAction={goToNextPage}
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