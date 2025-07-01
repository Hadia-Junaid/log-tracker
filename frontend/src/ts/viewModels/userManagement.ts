import * as AccUtils from "../accUtils";
import * as ko from "knockout";
import "ojs/ojknockout";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "ojs/ojlistview";
import "ojs/ojlistitemlayout";
import "ojs/ojbutton";
import "ojs/ojdialog";
import "ojs/ojinputsearch";
import 'oj-c/checkbox';
import logger from '../services/logger-service';
import { ConfigService } from '../services/config-service';
import { fetchUserGroups, createUserGroup, fetchApplications } from '../services/group-service';
import { KeySet } from 'ojs/ojkeyset'; // Provides the base KeySet interface
import { ObservableKeySet } from 'ojs/ojknockout-keyset'; // Provides the Knockout-observable version

interface MemberData {
    id: number | string;
    email: string;
    name: string;
    initials: string;
}

interface GroupData {
    groupId: string;
    groupName: string;
    description?: string;
    memberCount: number;
    createdDate?: string;
    createdAgo?: string;
}

interface ApplicationOption {
    name: string;
    checked: ko.Observable<boolean>;
}

class UserManagementViewModel {
    readonly groupDataArray = ko.observableArray<GroupData>([]);
    readonly dataProvider = new ArrayDataProvider(this.groupDataArray, { keyAttributes: "groupId" });
    readonly isDataEmpty: ko.Computed<boolean>;

    // Add-group dialog observables
    newGroupName = ko.observable("");
    searchValue = ko.observable(""); // Used by both dialogs for search input
    searchRawValue = ko.observable(""); // Used by both dialogs for search input

    private searchTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private readonly DEBOUNCE_DELAY = 500;

    createDialogAvailableMembers = ko.observableArray<MemberData>([]);
    createDialogSelectedMembers = ko.observableArray<MemberData>([]);
    createDialogApplications = ko.observableArray<ApplicationOption>([]);
    isCreating = ko.observable(false);
    createError = ko.observable("");

    // --- NEW / Corrected Observables for Edit Group Dialog ---
    selectedGroupName = ko.observable<string>(''); // For the Edit Group Dialog title
    currentMembers = ko.observableArray<MemberData>([]); // Members currently assigned to the group being edited
    editDialogAvailableMembers = ko.observableArray<MemberData>([]); // Available members for selection in the Edit Group Dialog

    // KeySets for selection in list views
    selectedAvailableMemberKeys = ko.observable<ObservableKeySet<string | number>>(new ObservableKeySet<string | number>());
    selectedAssignedMemberKeys = ko.observable<ObservableKeySet<string | number>>(new ObservableKeySet<string | number>());

    // --- END NEW / Corrected Observables ---
    applications = ko.observable({
        userService: false,
        paymentService: false,
        authService: false,
        notificationService: false,
        databaseService: false
    });
    readonly createDialogAvailableMembersDP = new ArrayDataProvider(this.createDialogAvailableMembers, { keyAttributes: "id" });
    readonly createDialogSelectedMembersDP = new ArrayDataProvider(this.createDialogSelectedMembers, { keyAttributes: "id" });

    // --- NEW DataProviders for Edit Group Dialog ---
    readonly currentMembersDP = new ArrayDataProvider(this.currentMembers, { keyAttributes: "id" });
    readonly editDialogAvailableMembersDP = new ArrayDataProvider(this.editDialogAvailableMembers, { keyAttributes: "id" });
    // --- END NEW DataProviders ---


    constructor() {
        this.isDataEmpty = ko.pureComputed(() => {
        return this.groupDataArray().length === 0;
         });
        this.init();
    }

    async init() {
        try {
            console.log("UserManagementViewModel: Initializing...");
            await ConfigService.loadConfig();
            console.log("UserManagementViewModel: ConfigService loaded. API URL:", ConfigService.getApiUrl());
            await this.loadGroups();
            console.log("UserManagementViewModel: Groups loaded successfully.");
        } catch (e) {
            logger.error("UserManagementViewModel: Initialization failed", e);
            this.createError("Application failed to initialize. Please try again.");
        }
    }

async loadGroups() {
  try {
    const rawGroups = await fetchUserGroups();
    console.log("🎯 Raw groups from API:", rawGroups);

    const processedGroups: GroupData[] = rawGroups.map((group: any, index: number) => {
      const createdDate = new Date(group.createdAt);
      const createdAgoText = this.getRelativeTime(createdDate);

      const mapped = {
        groupId: group._id || `fallback-id-${index}`,
        groupName: group.name || `Unnamed Group ${index}`,
        description: group.is_admin ? 'Admin group with full privileges' : 'Regular user group',
        memberCount: group.members?.length || 0,
        createdDate: createdDate.toLocaleDateString(),
        createdAgo: createdAgoText
      };

      console.log("✅ Mapped group:", mapped);
      return mapped;
    });

    this.groupDataArray(processedGroups);
    console.log("📦 Final observable array:", this.groupDataArray());
  } catch (e) {
    logger.error("Failed to load user groups", e);
    this.createError("Failed to load user groups. Check console for details.");
  }
}

    openAddGroupDialog = async () => {
        this.newGroupName("");
        this.searchValue("");
        this.searchRawValue("");
        this.createDialogAvailableMembers([]);
        this.createDialogSelectedMembers([]);
        this.createDialogApplications([]);
        this.createError("");
        this.selectedAvailableMemberKeys(new ObservableKeySet<string | number>()); // Reset keys for add dialog
        this.selectedAssignedMemberKeys(new ObservableKeySet<string | number>()); // Reset keys for add dialog

        try {
            await this.performMemberSearch(""); // Load initial members for add dialog
            // await this.loadApplications();
        } catch (e) {
            logger.error('Failed to pre-load members for add group dialog', e);
            this.createError('Failed to load available members for dialog.');
        }

        (document.getElementById("addGroupDialog") as any).open();
    };

    closeAddGroupDialog = () => {
        (document.getElementById("addGroupDialog") as any).close();
        if (this.searchTimeoutId) {
            clearTimeout(this.searchTimeoutId);
            this.searchTimeoutId = null;
        }
        this.newGroupName("");
        this.searchValue("");
        this.searchRawValue("");
        this.createDialogAvailableMembers([]);
        this.createDialogSelectedMembers([]);
        this.createDialogApplications([]);
        this.createError("");
        this.selectedAvailableMemberKeys(new ObservableKeySet<string | number>());
        this.selectedAssignedMemberKeys(new ObservableKeySet<string | number>()); 
    };


    handleMemberSearchInput = (event: CustomEvent<any>) => {
        const searchString = event.detail.value;
        this.searchValue(searchString);

        if (this.searchTimeoutId) {
            clearTimeout(this.searchTimeoutId);
        }

        this.searchTimeoutId = setTimeout(async () => {
            // Determine which list to update based on which dialog is open or context
            // For now, let's assume it primarily applies to the add group dialog's available members search
            // If used in the edit dialog, you'll need to adapt `performMemberSearch` to update `editDialogAvailableMembers`
            await this.performMemberSearch(searchString);
        }, this.DEBOUNCE_DELAY);
    };

    // Search functionality - calls backend API
    private performMemberSearch = async (searchString: string) => {
        logger.debug('User search initiated', { searchString });
        
        if (!searchString || searchString.trim().length === 0) {
            this.createDialogAvailableMembers([]);
            return;
        }

        try {
            // Get configuration and call the backend API
            const apiUrl = ConfigService.getApiUrl();
            const response = await fetch(`${apiUrl}/users/search?searchString=${encodeURIComponent(searchString)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const users = await response.json();
            
            // Filter out users who are already current members
            const currentMemberEmails = this.currentMembers().map(member => member.email);
            const availableUsers = users
                .filter((user: any) => !currentMemberEmails.includes(user.email))
                .map((user: any, index: number) => ({
                    id: user.email, // Use index as ID since we need a number
                    email: user.email,
                    name: user.name || user.email,
                    initials: this.getInitials(user.name || user.email)
                }));
            
            this.createDialogAvailableMembers(availableUsers);
            logger.info('User search completed successfully', { 
                searchString, 
                foundUsers: availableUsers.length 
            });
            
        } catch (error) {
            logger.error('Failed to search users from backend API', { 
                searchString, 
                error: error instanceof Error ? error.message : String(error) 
            });
            this.createDialogAvailableMembers([]);
            // You could show a user-friendly error message here
        }
    }

    // --- Member selection and management in the Add Group Dialog ---
    addSelectedMembersToGroup = () => {
        const selectedKeySetInstance = this.selectedAvailableMemberKeys();

        // Ensure proper type casting for 'values()'
        let keysToAdd: Array<string | number> = [];
        if (selectedKeySetInstance && typeof (selectedKeySetInstance as any).values === 'function') {
            keysToAdd = Array.from((selectedKeySetInstance as any).values());
        } else {
            logger.error("selectedAvailableMemberKeys() did not return a valid KeySet instance or it lacks 'values()' method. This is likely a type definition issue.");
            return;
        }

        const membersToAdd: MemberData[] = [];

        keysToAdd.forEach((key: string | number) => {
            const member = this.createDialogAvailableMembers().find((m: MemberData) => m.id === key);
            if (member) {
                membersToAdd.push(member);
            }
        });

        this.createDialogSelectedMembers.push(...membersToAdd);

        this.createDialogAvailableMembers.remove((member: MemberData) =>
            membersToAdd.some(m => m.id === member.id)
        );

        this.selectedAvailableMemberKeys(new ObservableKeySet<string | number>()); // Clear selection after moving
    };

    removeSelectedMembersFromGroup = () => {
        const selectedKeySetInstance = this.selectedAssignedMemberKeys();

        // Ensure proper type casting for 'values()'
        let keysToRemove: Array<string | number> = [];
        if (selectedKeySetInstance && typeof (selectedKeySetInstance as any).values === 'function') {
            keysToRemove = Array.from((selectedKeySetInstance as any).values());
        } else {
            logger.error("selectedAssignedMemberKeys() did not return a valid KeySet instance or it lacks 'values()' method. This is likely a type definition issue.");
            return;
        }

        const membersToRemove: MemberData[] = [];

        keysToRemove.forEach((key: string | number) => {
            // Note: This operates on createDialogSelectedMembers, which is for the Add Group dialog.
            // If you use removeSelectedMembersFromGroup for the Edit Group dialog,
            // it should operate on this.currentMembers
            const member = this.createDialogSelectedMembers().find((m: MemberData) => m.id === key);
            if (member) {
                membersToRemove.push(member);
            }
        });

        this.createDialogSelectedMembers.remove((member: MemberData) =>
            membersToRemove.some(m => m.id === member.id)
        );

        this.selectedAssignedMemberKeys(new ObservableKeySet<string | number>()); // Clear selection after removing
    };


    removeAllSelectedMembers = () => {
        this.createDialogSelectedMembers([]);
    };

    // --- NEW: handleAvailableMemberSelection for Edit Dialog ---
    handleAvailableMemberSelection = (event: CustomEvent) => {
        // Ensure proper type casting for 'values()' right when you access them
        const selectedKeys = event.detail.value;
        if (selectedKeys && typeof (selectedKeys as any).values === 'function' && (selectedKeys as any).values().size > 0) {
            const selectedId = Array.from((selectedKeys as any).values())[0]; // Access values() with cast
            const member = this.editDialogAvailableMembers().find((m: MemberData) => m.id === selectedId); // Use editDialogAvailableMembers

            if (member) {
                // Add to current members (members assigned to the group being edited)
                this.currentMembers.push(member);
                // Clear selection in the available members list
                this.selectedAvailableMemberKeys(new ObservableKeySet<string | number>()); // Clear the ObservableKeySet
                // Remove from available members to prevent duplicate additions
                this.editDialogAvailableMembers.remove((m: MemberData) => m.id === selectedId); // Remove from editDialogAvailableMembers
            }
        }
    };

    // --- NEW: Methods for Edit Group Dialog ---
    openEditGroupDialog = (event: CustomEvent) => {
        const groupId = (event.target as HTMLElement).dataset.groupId;
        const group = this.groupDataArray().find(g => g.groupId === groupId);

        this.selectedGroupName(group ? group.groupName : "Unknown Group");
        this.searchValue("");
        this.searchRawValue("");
        this.editDialogAvailableMembers([]);
        this.currentMembers([]);
        this.selectedAvailableMemberKeys(new ObservableKeySet<string | number>());
        this.selectedAssignedMemberKeys(new ObservableKeySet<string | number>());

        // TODO: In a real app, you'd fetch the actual members for this group
        // and populate this.currentMembers.
        // Then, fetch all possible members and filter out currentMembers to populate this.editDialogAvailableMembers.
        // Example placeholder:
        // this.currentMembers([{ id: '101', email: 'existing1@example.com', name: 'Existing 1', initials: 'E1' }]);
        // this.editDialogAvailableMembers([{ id: '201', email: 'new1@example.com', name: 'New 1', initials: 'N1' }]);

        (document.getElementById("editGroupDialog") as any).open();
    };

    closeEditDialog = () => {
        (document.getElementById("editGroupDialog") as any).close();
        // Clear observables specific to edit dialog on close
        this.selectedGroupName('');
        this.searchValue("");
        this.searchRawValue("");
        this.editDialogAvailableMembers([]);
        this.currentMembers([]);
        this.selectedAvailableMemberKeys(new ObservableKeySet<string | number>());
        this.selectedAssignedMemberKeys(new ObservableKeySet<string | number>());
    };

    updateGroupMembers = () => {
        // Implement logic to update the group members
        logger.info('Updating group members for: ' + this.selectedGroupName());
        // You'd send this.currentMembers() to your backend service
        this.closeEditDialog();
    };

    removeAllMembers = () => {
        // This is for the 'Remove All' button in the Edit Group Dialog's current members list
        this.currentMembers([]);
    };

    removeMember = (event: CustomEvent) => {
        // Logic to remove a single member from the currentMembers list
        const memberEmailToRemove = (event.target as HTMLElement).dataset.memberEmail;
        if (memberEmailToRemove) {
            const removedMember = this.currentMembers.remove((m: MemberData) => m.email === memberEmailToRemove);
            // Optionally, add the removed member back to the available members list
            if (removedMember.length > 0) {
                this.editDialogAvailableMembers.push(removedMember[0]);
            }
        }
    };


    async createGroup() {
        this.isCreating(true);
        this.createError("");

        if (!this.newGroupName().trim()) {
            this.createError('Group name is required.');
            this.isCreating(false);
            return;
        }
        if (this.createDialogSelectedMembers().length === 0) {
            this.createError('Please select at least one member for the group.');
            this.isCreating(false);
            return;
        }

        const groupPayload = {
            name: this.newGroupName(),
            members: this.createDialogSelectedMembers().map((m: MemberData) => m.email),
            assigned_applications: this.createDialogApplications()
                .filter(app => app.checked())
                .map(app => app.name),
            is_admin: false
        };

        try {
            await createUserGroup(groupPayload);
            this.closeAddGroupDialog();
            await this.loadGroups();
            alert('Group created successfully!');
        } catch (error) {
            logger.error("Error creating group", error);
            this.createError("Failed to create group. Please try again.");
        } finally {
            this.isCreating(false);
        }
    }

    getInitials(name: string): string {
        if (!name) return '';
        return name.split(' ')
            .map(w => w[0]?.toUpperCase())
            .join('')
            .substring(0, 2);
    }

    getRelativeTime(date: Date): string {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        const intervals: { [key: string]: number } = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
            second: 1
        };
        for (const [unit, val] of Object.entries(intervals)) {
            const count = Math.floor(seconds / val);
            if (count > 0) return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
        }
        return 'just now';
    }

    // Adjust editGroup to open the new dialog
    editGroup = (event: CustomEvent) => {
        const groupId = (event.target as HTMLElement).dataset.groupId;
        if (groupId) {
            this.openEditGroupDialog(event); // Pass the event to openEditGroupDialog
        } else {
            logger.warn('No group ID found for edit action.');
        }
    };
    deleteGroup = () => { /* logic goes here */ }; // Keep as is for now

    connected(): void {
        AccUtils.announce("User Management page loaded.");
        document.title = "User Management";
    }

    disconnected(): void {
        // implement if needed
    }

    transitionCompleted(): void {
        // implement if needed
    }
//     async loadApplications() {
//         try {
//             const apps = await fetchApplications(); 
//             const formattedApps: ApplicationOption[] = apps.map((appName) => ({
//             name: appName,
//             checked: ko.observable(false)
//             }));
//             this.createDialogApplications(formattedApps);
//         } catch (error) {
//             logger.error("Failed to load applications", error);
//             this.createDialogApplications([]);
//         }
//         }
 }

export = UserManagementViewModel;