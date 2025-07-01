import * as ko from "knockout";
import { GroupData } from "./types";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import { fetchUserGroups } from '../../services/group-service';
import logger from '../../services/logger-service';
import { ConfigService } from '../../services/config-service';

export const groupListObservables = {
    groupDataArray: ko.observableArray<GroupData>([]),
    dataProvider: null as any,
    isDataEmpty: ko.pureComputed(() => true)
};

groupListObservables.dataProvider = new ArrayDataProvider(groupListObservables.groupDataArray, { keyAttributes: "groupId" });
groupListObservables.isDataEmpty = ko.pureComputed(() => groupListObservables.groupDataArray().length === 0);

export const groupListMethods = {
    async loadGroups() {
        try {
            const rawGroups = await fetchUserGroups();
            const processedGroups: GroupData[] = rawGroups.map((group: any, index: number) => {
                const createdDate = new Date(group.createdAt);
                const createdAgoText = groupListMethods.getRelativeTime(createdDate);
                return {
                    groupId: group._id || `fallback-id-${index}`,
                    groupName: group.name || `Unnamed Group ${index}`,
                    description: group.is_admin ? 'Admin group with full privileges' : 'Regular user group',
                    memberCount: group.members?.length || 0,
                    createdDate: createdDate.toLocaleDateString(),
                    createdAgo: createdAgoText
                };
            });
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
    }
}; 