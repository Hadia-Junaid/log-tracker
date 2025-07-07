import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GroupData } from '../types/userManagement';
import { userGroupService } from '../services/userGroupServices';
import { AddGroupDialog } from '../components/AddGroupDialog';
import { EditGroupDialog } from '../components/EditGroupDialog';
import { DeleteGroupDialog } from '../components/DeleteGroupDialog';

type Props = {
  path?: string; // required by preact-router
};

export default function UserManagement(props: Props) {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const groupsData = await userGroupService.fetchUserGroups();
      setGroups(groupsData);
    } catch (err: any) {
      setError('Failed to load groups. Please try again.');
      console.error('Failed to load groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setSearchTerm(target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const filteredGroups = groups.filter(group =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGroups = filteredGroups.slice(startIndex, startIndex + itemsPerPage);

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
    <div class="oj-hybrid-padding">
      <div class="oj-flex oj-sm-flex-direction-column">
        <div class="oj-flex oj-sm-margin-4x-bottom">
          <h1 class="oj-typography-heading-lg oj-text-color-primary">Groups</h1>
        </div>

        {/* Global Banner */}
        {error && (
          <div class="oj-sm-margin-4x-bottom error-banner">
            {error}
          </div>
        )}

        {/* Search and Add Group Row */}
        <div class="oj-flex oj-sm-align-items-center oj-sm-flex-wrap oj-sm-margin-4x-bottom">
          <div class="oj-flex-item">
            <input
              type="search"
              class="oj-inputsearch oj-form-control-full-width"
              placeholder="Search groups..."
              value={searchTerm}
              onInput={handleSearchChange}
            />
          </div>

          <div class="oj-sm-margin-2x-start">
            <button
              class="oj-button oj-button-outlined-chrome"
              onClick={handleAddGroup}
            >
              <span class="oj-ux-ico-plus" style="margin-right: 8px;"></span>
              Add Group
            </button>
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
            Manage user groups and their members. Groups are used to control access to application logs.
          </p>
        </div>
      </div>

      {/* Groups List */}
      <div class="oj-flex oj-sm-flex-direction-column" style="min-height: 70vh;">
        <div style="min-height: 50vh;" class="oj-flex-item-auto">
          {paginatedGroups.length > 0 ? (
            <div class="groups-list">
              {paginatedGroups.map(group => (
                <div key={group.groupId} class="group-item oj-list-item-layout">
                  <div class="oj-flex oj-sm-flex-direction-column">
                    {/* Group Name */}
                    <span class="oj-typography-heading-sm oj-text-color-primary">
                      {group.groupName}
                    </span>

                    {/* Description */}
                    {group.description && (
                      <span class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-top">
                        {group.description}
                      </span>
                    )}

                    {/* Member Count and Date */}
                    <span class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-top">
                      Created: {group.createdDate} • {group.createdAgo}
                    </span>
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px; margin-top: 0.5rem;">
                    {/* Members Dropdown */}
                    <select class="oj-form-control" style="min-width: 220px;">
                      <option>Members: {group.members?.length || 0}</option>
                      {group.members?.map(member => (
                        <option key={member}>{member}</option>
                      ))}
                    </select>

                    {/* Applications Dropdown */}
                    <select class="oj-form-control" style="min-width: 220px;">
                      <option>Applications: {group.assigned_applications?.length || 0}</option>
                      {group.assigned_applications?.map(app => (
                        <option key={app}>{app}</option>
                      ))}
                    </select>
                  </div>

                  <div class="oj-flex oj-sm-align-items-center" style="margin-top: 8px;">
                    <button
                      class="oj-button oj-button-sm"
                      onClick={() => handleEditGroup(group)}
                    >
                      <span class="oj-ux-ico-edit" style="margin-right: 4px;"></span>
                      Edit
                    </button>
                    
                    {!group.is_admin && (
                      <button
                        class="oj-button oj-button-sm"
                        onClick={() => handleDeleteGroup(group)}
                        style="margin-left: 8px;"
                      >
                        <span class="oj-ux-ico-trash" style="margin-right: 4px;"></span>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div class="oj-flex oj-sm-align-items-center demo-nodata-content">
              <div class="oj-flex oj-sm-align-items-center oj-sm-flex-direction-column demo-nodata-inner">
                <h5>No groups found!</h5>
                <p class="oj-text-color-secondary">
                  {searchTerm ? 'No groups match your search criteria.' : 'Create your first user group to get started.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        <div class="pagination-container">
          <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center">
            <button
              class="oj-button"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            <div class="pagination-info">
              Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredGroups.length)} of {filteredGroups.length} groups
            </div>
            
            <button
              class="oj-button"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
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
