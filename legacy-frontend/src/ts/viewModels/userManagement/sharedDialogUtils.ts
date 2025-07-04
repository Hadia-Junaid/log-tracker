import * as ko from "knockout";
import { ConfigService } from '../../services/config-service';
import logger from '../../services/logger-service';
import { MemberData } from "./types";

// Shared constants
export const DEBOUNCE_DELAY = 300; // milliseconds

// Helper function to get user initials
export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);
};

// Interface for search configuration
export interface SearchConfig {
    availableMembersObservable: ko.ObservableArray<MemberData>;
    excludedMembersObservable: ko.ObservableArray<MemberData>;
    errorObservable: ko.Observable<string>;
    logContext: string;
}

// Shared search functionality
export const performUserSearch = async (searchString: string, config: SearchConfig): Promise<void> => {
    logger.debug(`User search initiated ${config.logContext}`, { searchString });
    
    if (!searchString || searchString.trim().length === 0) {
        config.availableMembersObservable([]);
        return;
    }

    try {
        // Get configuration and auth token
        const apiUrl = ConfigService.getApiUrl();
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${apiUrl}/admin/users/search?searchString=${encodeURIComponent(searchString)}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        
        // Filter out users who are already excluded members
        const excludedMemberEmails = config.excludedMembersObservable().map(member => member.email);
        const availableUsers = users
            .filter((user: any) => !excludedMemberEmails.includes(user.email))
            .map((user: any, index: number) => ({
                id: index + 1, // Use index as ID since we need a number
                email: user.email,
                name: user.name || user.email,
                initials: getInitials(user.name || user.email)
            }));
        
        config.availableMembersObservable(availableUsers);
        logger.info(`User search completed successfully ${config.logContext}`, { 
            searchString, 
            foundUsers: availableUsers.length 
        });
        
    } catch (error) {
        logger.error(`Failed to search users from backend API ${config.logContext}`, { 
            searchString, 
            error: error instanceof Error ? error.message : String(error) 
        });
        config.availableMembersObservable([]);
        config.errorObservable('Failed to search for users. Please try again.');
    }
};

// Factory function to create debounced search handler
export const createSearchInputHandler = (
    searchConfig: SearchConfig,
    timeoutRef: { current: ReturnType<typeof setTimeout> | undefined }
) => {
    return (event: CustomEvent<any>) => {
        const searchString = event.detail.value;
        
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        // Set a new timeout for the debounced search
        timeoutRef.current = setTimeout(() => {
            performUserSearch(searchString, searchConfig);
        }, DEBOUNCE_DELAY);
    };
};

// Utility function to clear timeout
export const clearSearchTimeout = (timeoutRef: { current: ReturnType<typeof setTimeout> | undefined }) => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
    }
};

// Utility function to reset search state
export const resetSearchState = (
    searchValue: ko.Observable<string>,
    searchRawValue: ko.Observable<string>,
    availableMembers: ko.ObservableArray<MemberData>,
    errorObservable: ko.Observable<string>
) => {
    searchValue("");
    searchRawValue("");
    availableMembers([]);
    errorObservable("");
}; 