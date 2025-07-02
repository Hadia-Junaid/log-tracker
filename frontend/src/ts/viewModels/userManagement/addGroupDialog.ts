import * as ko from "knockout";
import { MemberData, ApplicationOption } from "./types";
import {
  fetchUserGroups,
  createUserGroup,
  fetchApplicationsWithIds,
} from "../../services/group-service";
import { ObservableKeySet } from "ojs/ojknockout-keyset";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import logger from "../../services/logger-service";
import {
  createSearchInputHandler,
  clearSearchTimeout,
  resetSearchState,
  SearchConfig,
} from "./sharedDialogUtils";
import { KeySetImpl } from "ojs/ojkeyset";

// Timeout tracking for search debouncing
const searchTimeoutRef = {
  current: undefined as ReturnType<typeof setTimeout> | undefined,
};

export const addGroupDialogObservables = {
  newGroupName: ko.observable(""),
  searchValue: ko.observable(""),
  searchRawValue: ko.observable(""),
  createDialogAvailableMembers: ko.observableArray<MemberData>([]),
  createDialogSelectedMembers: ko.observableArray<MemberData>([]),
  createDialogApplications: ko.observableArray<ApplicationOption>([]),
  isCreating: ko.observable(false),
  createError: ko.observable(""),
  createDialogAvailableSelectedKeySet: ko.observable(new KeySetImpl()),
};

// Search configuration for add group dialog
const searchConfig: SearchConfig = {
  availableMembersObservable:
    addGroupDialogObservables.createDialogAvailableMembers,
  excludedMembersObservable:
    addGroupDialogObservables.createDialogSelectedMembers,
  errorObservable: addGroupDialogObservables.createError,
  logContext: "in add group dialog",
};

export const addGroupDialogMethods = {
  openAddGroupDialog: async () => {
    // Reset all observables
    addGroupDialogObservables.newGroupName("");
    addGroupDialogObservables.createDialogSelectedMembers([]);
    addGroupDialogObservables.createDialogApplications([]);
    addGroupDialogObservables.isCreating(false);

    // Reset search state using shared utility
    resetSearchState(
      addGroupDialogObservables.searchValue,
      addGroupDialogObservables.searchRawValue,
      addGroupDialogObservables.createDialogAvailableMembers,
      addGroupDialogObservables.createError
    );

    // Clear search timeout
    clearSearchTimeout(searchTimeoutRef);

    try {
      // Fetch applications from the API
      const applications = await fetchApplicationsWithIds();
      const applicationOptions: ApplicationOption[] = applications.map(
        (app) => ({
          id: app.id,
          name: app.name,
          checked: ko.observable(false), // All checkboxes unchecked initially
        })
      );
      addGroupDialogObservables.createDialogApplications(applicationOptions);
    } catch (error) {
      logger.error("Failed to fetch applications for add group dialog:", error);
      addGroupDialogObservables.createError("Failed to load applications.");
    }

    (document.getElementById("addGroupDialog") as any).open();
  },

  closeAddGroupDialog: () => {
    (document.getElementById("addGroupDialog") as any).close();

    // Reset all observables
    addGroupDialogObservables.newGroupName("");
    addGroupDialogObservables.createDialogSelectedMembers([]);
    addGroupDialogObservables.createDialogApplications([]);
    addGroupDialogObservables.isCreating(false);

    // Reset search state using shared utility
    resetSearchState(
      addGroupDialogObservables.searchValue,
      addGroupDialogObservables.searchRawValue,
      addGroupDialogObservables.createDialogAvailableMembers,
      addGroupDialogObservables.createError
    );

    // Clear search timeout
    clearSearchTimeout(searchTimeoutRef);
  },

  // Use shared search handler
  handleMemberSearchInput: createSearchInputHandler(
    searchConfig,
    searchTimeoutRef
  ),

  //method to add selected members from available members to selected members
  addMemberToSelected(member: MemberData) {
    console.log("Adding member to selected:", member);
    const selectedList =
      addGroupDialogObservables.createDialogSelectedMembers();
    const alreadyAdded = selectedList.some((m) => m.id === member.id);
    if (!alreadyAdded) {
      addGroupDialogObservables.createDialogSelectedMembers.push(member);
    }

    // Remove from available members
    const availableList =
      addGroupDialogObservables.createDialogAvailableMembers();
    const updatedAvailableList = availableList.filter(
      (m) => m.id !== member.id
    );
    addGroupDialogObservables.createDialogAvailableMembers(
      updatedAvailableList
    );
  },

  //method to remove selected members from the selected members list
  removeMemberFromSelected(member: MemberData) {
    console.log("Removing member from selected:", member);
    const selectedList =
      addGroupDialogObservables.createDialogSelectedMembers();
    const updatedSelectedList = selectedList.filter((m) => m.id !== member.id);
    addGroupDialogObservables.createDialogSelectedMembers(
        updatedSelectedList
    );
    // Add back to available members
    const availableList =
        addGroupDialogObservables.createDialogAvailableMembers();
    const alreadyAvailable = availableList.some((m) => m.id === member.id);
    if (!alreadyAvailable) {
        addGroupDialogObservables.createDialogAvailableMembers.push(member);
    }
  },

  removeAllMembers: () => {
    const currentList = addGroupDialogObservables.createDialogSelectedMembers();
    addGroupDialogObservables.createDialogSelectedMembers([]);
    // Add all removed members back to available members
    addGroupDialogObservables.createDialogAvailableMembers.push(...currentList);
  },

  addSelectedMembersToGroup: () => {},
  removeSelectedMembersFromGroup: () => {},
  removeAllSelectedMembers: () => {},
  createGroup: async () => {
    try {
      // Clear any previous errors
      addGroupDialogObservables.createError("");

      // Validate group name
      const groupName = addGroupDialogObservables.newGroupName().trim();
      if (!groupName) {
        addGroupDialogObservables.createError("Group name is required.");
        return;
      }

      // Validate that at least one application is selected
      const selectedApplications = addGroupDialogObservables
        .createDialogApplications()
        .filter((app) => app.checked());
      if (selectedApplications.length === 0) {
        addGroupDialogObservables.createError(
          "Please select at least one accessible application."
        );
        return;
      }

      // Set loading state
      addGroupDialogObservables.isCreating(true);

      // Prepare the payload with selected applications
      const payload = {
        name: groupName,
        is_admin: false,
        assigned_applications: selectedApplications.map((app) => app.id),
        //push the emails of users in the form of an array of strings
        members: addGroupDialogObservables.createDialogSelectedMembers().map(
          (member) => member.email
        ),
      };

      logger.info("Creating user group with payload:", payload);

      // Call the backend API
      const createdGroup = await createUserGroup(payload);

      logger.info("User group created successfully:", createdGroup);

      // Show success message
      const banner = document.getElementById("globalSuccessBanner");
      if (banner) {
        banner.textContent = `Group "${groupName}" created successfully!`;
        banner.style.display = "block";

        // Hide the banner after 5 seconds
        setTimeout(() => {
          banner.style.display = "none";
        }, 5000);
      }

      // Close the dialog
      addGroupDialogMethods.closeAddGroupDialog();

      // Refresh the group list by dispatching a custom event
      document.dispatchEvent(
        new CustomEvent("group-created", {
          detail: { groupId: createdGroup._id, groupName: createdGroup.name },
        })
      );
    } catch (error) {
      logger.error("Failed to create user group:", error);

      // Handle specific error cases
      if (error instanceof Error) {
        addGroupDialogObservables.createError(
          `Failed to create group: ${error.message}`
        );
      } else {
        addGroupDialogObservables.createError(
          "Failed to create group. Please try again."
        );
      }
    } finally {
      addGroupDialogObservables.isCreating(false);
    }
  },
};
