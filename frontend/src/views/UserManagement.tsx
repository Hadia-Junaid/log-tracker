import { h } from "preact";
import { useState, useEffect, useRef, useMemo} from "preact/hooks";
import { GroupData } from "../types/userManagement";
import { userGroupService } from "../services/userGroupServices";
import { AddGroupDialog } from "../components/UserManagement/AddGroupDialog";
import { EditGroupDialog } from "../components/UserManagement/EditGroupDialog";
import { DeleteGroupDialog } from "../components/UserManagement/DeleteGroupDialog";
import ArrayDataProvider from "ojs/ojarraydataprovider";
import UserGroupsList from "../components/UserManagement/UserGroupsList";
import "ojs/ojinputsearch";
import "ojs/ojbutton";
import "ojs/ojselectsingle";

type Props = {
  path?: string; // required by preact-router
};

export default function UserManagement(props: Props) {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all"); // "all", "active", "inactive"
  const [error, setError] = useState("");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);

  // Pagination
  const [pageSize, setPageSize] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevSearchTermRef = useRef<string>("");

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const pageSizeOptions = [
    { value: 4, label: "4 per page" },
    { value: 6, label: "6 per page" },
    { value: 10, label: "10 per page" },
    { value: 20, label: "20 per page" },
  ];

   const statusDataProvider = useMemo(() => {
      return new ArrayDataProvider(statusOptions, { keyAttributes: "value" });
    }, []);

  const pageSizeDataProvider = useMemo(() => {
    return new ArrayDataProvider(pageSizeOptions, { keyAttributes: "value" });
  }, []);
  

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
      let status: boolean | undefined;
      status = statusFilter === "all" ? undefined : statusFilter === "active";

      const response = await userGroupService.fetchUserGroups(currentPage, pageSize, searchTerm, status);
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
      // Always show loading for both search and pagination
      loadGroups(true);
      prevSearchTermRef.current = searchTerm;
    }, searchTerm ? 300 : 0); // Debounce for search, no delay for pagination
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm, statusFilter, pageSize]);

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
    if (currentPage < Math.ceil(totalCount / pageSize)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
    setPageSize(4);
  };

  return (
    <div class="oj-hybrid-padding" ref={containerRef}>
     <div class="oj-flex oj-sm-flex-direction-column">

  {/* Title Row: "Groups" and Add Group button */}
  <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center oj-sm-margin-1x-bottom">
    <h1 class="oj-typography-heading-lg oj-text-color-primary">Groups</h1>
    
    <div class="oj-flex oj-sm-flex-direction-column oj-sm-align-items-flex-end">
      <oj-button
        chroming="solid"
        class="add-button"
        onojAction={handleAddGroup}
      >
        <span slot="startIcon" class="oj-ux-ico-plus"></span>
        Add Group
      </oj-button>
      <span class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-1x-top" style="margin-bottom: 0;">
        Total: {totalCount} groups
      </span>
    </div>
    
  </div>
  <p class="oj-typography-body-md oj-text-color-secondary">
      Manage user groups and their members. Groups are used to control access to application logs.
    </p>

  {/* Error Banner */}
  {error && (
    <div class="oj-sm-margin-4x-bottom error-banner">{error}</div>
  )}
  
  {/* Search, Status Filter, Reset Button Row */}
<div class="oj-flex oj-sm-align-items-center oj-sm-flex-wrap oj-sm-margin-4x-bottom" style="width: 100%;">
  <div class="oj-flex-item" style="flex: 1 1 auto; min-width: 200px;">
    <oj-input-text
      class="oj-form-control-full-width"
      placeholder="Search groups..."
      value={searchTerm}
      onrawValueChanged={(e:any) => {
        setSearchTerm(e.detail.value);
        setCurrentPage(1);
      }}
    />
  </div>

  <div class="oj-flex-item oj-sm-margin-2x-start" style="flex-shrink: 0;">
    <oj-select-single
      class="oj-form-control"
      label-hint="Status"
      data={statusDataProvider}
      value={statusFilter}
      onvalueChanged={(e) => {
        setStatusFilter(e.detail.value);
        setCurrentPage(1);
      }}
    />
  </div>

  <div class="oj-flex-item oj-sm-margin-2x-start" style="flex-shrink: 0;">
    <oj-button
      chroming="solid"
      class="add-button"
      onojAction={handleResetFilters}
    >
      <span slot="startIcon" class="oj-ux-ico-refresh"></span>
      Reset
    </oj-button>
  </div>
</div>

</div>


      {/* Groups List */}
      <div
        class="oj-flex oj-sm-flex-direction-column"
        style="flex: 1; min-height: 0;"
      >
        <div style="flex: 1; min-height: 0;" class="oj-flex-item-auto">
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
          {!isLoading && totalCount > 0 && (
            <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center">
              <oj-button 
                disabled={currentPage === 1}
                onojAction={goToPrevPage}
              >
                Previous
              </oj-button>

              <div class="pagination-info">
                Page {currentPage} of {Math.ceil(totalCount / pageSize)} • Showing {((currentPage - 1) * pageSize) + 1}-
                {Math.min(currentPage * pageSize, totalCount)} of{" "}
                {totalCount} groups
              </div>

              <oj-button
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                onojAction={goToNextPage}
              >
                Next
              </oj-button>

                <div style="margin-left: auto;">
                <oj-select-single
                  class="oj-form-control"
                  data={pageSizeDataProvider}
                  value={pageSize}
                  onvalueChanged={(e: CustomEvent) => {
                  setPageSize(e.detail.value);
                  setCurrentPage(1); // Reset to first page when changing page size
                  }}
                  style="padding:0px 0;min-width: 150px; height: 45px;"
                />
                </div>
            </div>
          )}
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
          isAdmin={selectedGroup.is_admin} // Pass isAdmin status
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