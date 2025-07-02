import * as ko from "knockout";
import { MemberData, ApplicationOption } from "./types";
import logger from "../../services/logger-service";
import { ObservableKeySet } from "ojs/ojknockout-keyset";
import {
  updateUserGroup,
  fetchApplicationsWithIds,
  assignApplicationToGroup,
  fetchGroupById,
} from "../../services/group-service";
import {
  createSearchInputHandler,
  clearSearchTimeout,
  resetSearchState,
  SearchConfig,
} from "./sharedDialogUtils";
import { groupListObservables, groupListMethods } from "./groupList";

// Timeout tracking for search debouncing
const editSearchTimeoutRef = {
  current: undefined as ReturnType<typeof setTimeout> | undefined,
};

export const editGroupDialogObservables = {
  groupId: ko.observable<string>(""),
  selectedGroupName: ko.observable<string>(""),
  currentMembers: ko.observableArray<MemberData>([]),
  editDialogAvailableMembers: ko.observableArray<MemberData>([]),

  selectedAvailableMemberKeys: ko.observable<ObservableKeySet<string | number>>(
    new ObservableKeySet<string | number>()
  ),
  selectedAssignedMemberKeys: ko.observable<ObservableKeySet<string | number>>(
    new ObservableKeySet<string | number>()
  ),
  searchValue: ko.observable(""),
  searchRawValue: ko.observable(""),
  editError: ko.observable(""),
  editDialogApplications: ko.observableArray<ApplicationOption>([]),
};

// Search configuration for edit group dialog
const searchConfig: SearchConfig = {
  availableMembersObservable:
    editGroupDialogObservables.editDialogAvailableMembers,
  excludedMembersObservable: editGroupDialogObservables.currentMembers,
  errorObservable: editGroupDialogObservables.editError,
  logContext: "in edit group dialog",
};

export const editGroupDialogMethods = {
  handleAvailableMemberSelection: (member: MemberData) => {
    console.log("Adding member to selected in edit group dialog:", member);
    const selectedList = editGroupDialogObservables.currentMembers();
    const alreadyAdded = selectedList.some((m) => m.id === member.id);
    if (!alreadyAdded) {
      editGroupDialogObservables.currentMembers.push(member);
    }

    // Remove from available members
    const availableList =
      editGroupDialogObservables.editDialogAvailableMembers();
    const updatedAvailableList = availableList.filter(
      (m) => m.id !== member.id
    );
    editGroupDialogObservables.editDialogAvailableMembers(updatedAvailableList);
  },

  handleUnselectMember: (member: MemberData) => {
    console.log("Removing member from selected in edit group dialog:", member);
    const selectedList = editGroupDialogObservables.currentMembers();
    const updatedSelectedList = selectedList.filter((m) => m.id !== member.id);
    editGroupDialogObservables.currentMembers(updatedSelectedList);
    // Add back to available members
    const availableList =
      editGroupDialogObservables.editDialogAvailableMembers();
    const alreadyAvailable = availableList.some((m) => m.id === member.id);
    if (!alreadyAvailable) {
      editGroupDialogObservables.editDialogAvailableMembers.push(member);
    }
  },

  // Use shared search handler
  handleMemberSearchInput: createSearchInputHandler(
    searchConfig,
    editSearchTimeoutRef
  ),

  openEditGroupDialog: async (event: {
    detail: { groupId: string; groupName: string };
  }) => {
    const { groupId, groupName } = event.detail;
    editGroupDialogObservables.groupId(groupId);
    editGroupDialogObservables.selectedGroupName(groupName);
    editGroupDialogObservables.currentMembers([]);
    editGroupDialogObservables.selectedAvailableMemberKeys(
      new ObservableKeySet<string | number>()
    );
    editGroupDialogObservables.selectedAssignedMemberKeys(
      new ObservableKeySet<string | number>()
    );
    editGroupDialogObservables.editDialogApplications([]);

    // Reset search state using shared utility
    resetSearchState(
      editGroupDialogObservables.searchValue,
      editGroupDialogObservables.searchRawValue,
      editGroupDialogObservables.editDialogAvailableMembers,
      editGroupDialogObservables.editError
    );

    // Clear search timeout
    clearSearchTimeout(editSearchTimeoutRef);

    try {
      // Fetch all applications and group details in parallel
      const [applications, groupDetails] = await Promise.all([
        fetchApplicationsWithIds(),
        fetchGroupById(groupId),
      ]);

      // Get assigned application IDs from group details
      const assignedApplicationIds = new Set(
        groupDetails.assigned_applications.map((app: any) => app._id)
      );

      // Create application options with proper checked state
      const applicationOptions: ApplicationOption[] = applications.map(
        (app) => ({
          id: app.id,
          name: app.name,
          checked: ko.observable(assignedApplicationIds.has(app.id)), // Check if already assigned
        })
      );

      editGroupDialogObservables.editDialogApplications(applicationOptions);

      // Show the current members by adding them to the currentMembers observable
      const currentMembers: MemberData[] = groupDetails.members.map(
        (member: any) => ({
          id: member._id || `fallback-id-${member.email}`,
          name: member.name,
          email: member.email,
        })
      );
      editGroupDialogObservables.currentMembers(currentMembers);
    } catch (error) {
      logger.error(
        "Failed to fetch applications or group details for edit dialog:",
        error
      );
      editGroupDialogObservables.editError("Failed to load applications.");
    }

    (document.getElementById("editGroupDialog") as any).open();
  },

  closeEditDialog: () => {
    const dialog = document.getElementById("editGroupDialog") as HTMLElement & {
      close: () => void;
    };
    dialog?.close();

    // Reset observables
    editGroupDialogObservables.selectedGroupName("");
    editGroupDialogObservables.currentMembers([]);
    editGroupDialogObservables.selectedAvailableMemberKeys(
      new ObservableKeySet<string | number>()
    );
    editGroupDialogObservables.selectedAssignedMemberKeys(
      new ObservableKeySet<string | number>()
    );
    editGroupDialogObservables.editDialogApplications([]);

    // Reset search state using shared utility
    resetSearchState(
      editGroupDialogObservables.searchValue,
      editGroupDialogObservables.searchRawValue,
      editGroupDialogObservables.editDialogAvailableMembers,
      editGroupDialogObservables.editError
    );

    // Clear search timeout
    clearSearchTimeout(editSearchTimeoutRef);
  },

  updateGroup: async () => {
    const groupId = editGroupDialogObservables.groupId();
    const groupName = editGroupDialogObservables.selectedGroupName();
    const members = editGroupDialogObservables.currentMembers();
    const selectedApplications = editGroupDialogObservables
      .editDialogApplications()
      .filter((app) => app.checked());

    try {
      // Update group members and applications in one payload
      const updatedGroup = await updateUserGroup(groupId, {
        name: groupName,
        members: members.map((m) => m.email),
        applications: selectedApplications.map((app) => app.id),
      });

      logger.info(`Group ${groupId} updated successfully` + updatedGroup);
      console.log("Updated group details:", updatedGroup);

      // Update the group details in the observables array
      const updatedGroups = groupListObservables.groupDataArray();
      const groupIndex = updatedGroups.findIndex((g) => g.groupId === groupId);

      if (groupIndex !== -1) {
        const createdDate = new Date(updatedGroup.createdAt);
        updatedGroups[groupIndex] = {
          groupId: updatedGroup._id,
          groupName: updatedGroup.name,
          description: updatedGroup.is_admin
            ? "Admin group with full privileges"
            : "Regular user group",
          memberCount: updatedGroup.members.length,
          createdDate: createdDate.toLocaleDateString(),
          createdAgo: groupListMethods.getRelativeTime(createdDate),
          is_admin: updatedGroup.is_admin,
        };

        // Force the observableArray to update
        groupListObservables.groupDataArray.valueHasMutated();
      }

      // Show success message
      const banner = document.getElementById("globalSuccessBanner");
      if (banner) {
        banner.textContent = `Group "${groupName}" updated successfully!`;
        banner.style.display = "block";

        // Hide the banner after 5 seconds
        setTimeout(() => {
          banner.style.display = "none";
        }, 3000);
      }

      // Close the dialog
      const dialog = document.getElementById("editGroupDialog") as unknown as {
        close: () => void;
      };
      dialog?.close();

      // Dispatch event to refresh group list
      document.dispatchEvent(new CustomEvent("group-updated"));
    } catch (err) {
      logger.error("Error updating group", err);
      editGroupDialogObservables.editError(
        "Failed to update group. Please try again."
      );
    }
  },

  removeAllMembers: () => {
    const currentList = editGroupDialogObservables.currentMembers();
    editGroupDialogObservables.currentMembers([]);
    // Add all removed members back to available members
    editGroupDialogObservables.editDialogAvailableMembers.push(...currentList);
  },
};
