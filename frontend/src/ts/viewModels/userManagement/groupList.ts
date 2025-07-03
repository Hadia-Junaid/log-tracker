import * as ko from "knockout";
import { GroupData } from "./types";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import { fetchUserGroups, fetchGroupById } from "../../services/group-service";
import logger from '../../services/logger-service';
import { ConfigService } from '../../services/config-service';

export const groupListObservables = {
    groupDataArray: ko.observableArray<GroupData>([]),
    searchTerm: ko.observable(""),
    currentPage: ko.observable(1),
    pageSize: 5,
    dataProvider: null as any,
    isDataEmpty: ko.pureComputed(() => true),
    totalPages: ko.pureComputed(() => 1),
    filteredGroups: ko.pureComputed<GroupData[]>(() => []),
    pagedGroups: ko.pureComputed<GroupData[]>(() => []),

    expandedGroups: ko.observableArray<string>([]), // updated from Set to array
    groupMembersMap: ko.observable<any>({}),
    groupAppsMap: ko.observable<any>({})
};

groupListObservables.filteredGroups = ko.pureComputed(() => {
    let term = groupListObservables.searchTerm().toLowerCase();
    if (!term) return groupListObservables.groupDataArray();
    const trimmedTerm = term.trim();
    if (!trimmedTerm) return groupListObservables.groupDataArray();
    return groupListObservables.groupDataArray().filter(group => {
        const name = group.groupName.toLowerCase();
        const desc = (group.description || '').toLowerCase();
        return name.includes(trimmedTerm) || desc.includes(trimmedTerm);
    });
});

groupListObservables.totalPages = ko.pureComputed(() => {
    return Math.max(1, Math.ceil(groupListObservables.filteredGroups().length / groupListObservables.pageSize));
});

groupListObservables.pagedGroups = ko.pureComputed(() => {
    const start = (groupListObservables.currentPage() - 1) * groupListObservables.pageSize;
    return groupListObservables.filteredGroups().slice(start, start + groupListObservables.pageSize);
});

groupListObservables.dataProvider = ko.pureComputed(() =>
    new ArrayDataProvider(groupListObservables.pagedGroups(), { keyAttributes: "groupId" })
);

groupListObservables.isDataEmpty = ko.pureComputed(() => groupListObservables.groupDataArray().length === 0);

export const groupListMethods = {
    async loadGroups() {
        try {
            const rawGroups = await fetchUserGroups();
            const processedGroups: GroupData[] = rawGroups.map((group: any, index: number) => {
                const createdDate = new Date(group.createdAt);
                const createdAgoText = groupListMethods.getRelativeTime(createdDate);

                 const emails: string[] = group.members?.map((m: any) => m.email) || [];
  const apps: string[] = group.assigned_applications?.map((a: any) => a.name) || [];

  const memberOptions = emails.map(e => ({ value: e, label: e }));
  const appOptions    = apps.map(a => ({ value: a, label: a }));

                return {
                    groupId: group._id || `fallback-id-${index}`,
                    groupName: group.name || `Unnamed Group ${index}`,
                    description: group.is_admin ? 'Admin group with full privileges' : 'Regular user group',
                    memberCount: group.members?.length || 0,
                    createdDate: createdDate.toLocaleDateString(),
                    createdAgo: createdAgoText,
                    is_admin: group.is_admin || false,
                    members: group.members?.map((member: any) => member.email) || [],
                    assigned_applications: group.assigned_applications?.map((app: any) => app.name) || [],
                };
            });
            processedGroups.sort((a, b) => {
                if (a.is_admin) return -1;
                if (b.is_admin) return 1;
                return 0;
            });

            console.log("Processed Groups:", processedGroups);
            groupListObservables.groupDataArray(processedGroups);
        } catch (e) {
            logger.error("Failed to load user groups", e);
        }
    },
    async init() {
        try {
            await ConfigService.loadConfig();
            await groupListMethods.loadGroups();
        } catch (e) {
            logger.error("Initialization failed", e);
        }
    },
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
    },
    goToNextPage() {
        if (groupListObservables.currentPage() < groupListObservables.totalPages()) {
            groupListObservables.currentPage(groupListObservables.currentPage() + 1);
        }
    },
    goToPrevPage() {
        if (groupListObservables.currentPage() > 1) {
            groupListObservables.currentPage(groupListObservables.currentPage() - 1);
        }
    },
    toggleGroupDetails: async (groupId: string) => {
        const expandedList = groupListObservables.expandedGroups();

        if (expandedList.includes(groupId)) {
            groupListObservables.expandedGroups.remove(groupId);
            return;
        }

        try {
            const groupData = await fetchGroupById(groupId);
            const members = groupData.members || [];
            const apps = groupData.assigned_applications || [];

            const membersMap = groupListObservables.groupMembersMap();
            if (membersMap) {
                membersMap[groupId] = members;
                groupListObservables.groupMembersMap.valueHasMutated();
            }

            const appsMap = groupListObservables.groupAppsMap();
            if (appsMap) {
                appsMap[groupId] = apps;
                groupListObservables.groupAppsMap.valueHasMutated();
            }

            groupListObservables.expandedGroups.push(groupId);
        } catch (e) {
            logger.error(`Failed to fetch details for group ${groupId}`, e);
        }
    }
};
