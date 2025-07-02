import * as ko from 'knockout';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { ApplicationData } from './types';
import { ConfigService } from '../../services/config-service';

// --- Observables ---
export const applicationListObservables = {
    applicationDataArray: ko.observableArray<ApplicationData>([]),
    searchQuery: ko.observable(''),
    currentPage: ko.observable(1),
    pageSize: 5
};

// Reset to page 1 on search change
applicationListObservables.searchQuery.subscribe(() => {
    applicationListObservables.currentPage(1);
});

// --- Computed ---
const paginatedApplications = ko.pureComputed<ApplicationData[]>(() => {
    const query = applicationListObservables.searchQuery().toLowerCase().trim();
    const filtered = applicationListObservables.applicationDataArray().filter(app =>
        app.name.toLowerCase().includes(query) ||
        app.hostname.toLowerCase().includes(query) ||
        app.environment.toLowerCase().includes(query)
    );
    const startIdx = (applicationListObservables.currentPage() - 1) * applicationListObservables.pageSize;
    return filtered.slice(startIdx, startIdx + applicationListObservables.pageSize);
});

export const applicationListComputed = {
    totalPages: ko.pureComputed<number>(() => {
        const totalItems = applicationListObservables.applicationDataArray().filter(app => {
            const query = applicationListObservables.searchQuery().toLowerCase().trim();
            return (
                app.name.toLowerCase().includes(query) ||
                app.hostname.toLowerCase().includes(query) ||
                app.environment.toLowerCase().includes(query)
            );
        }).length;
        return Math.ceil(totalItems / applicationListObservables.pageSize);
    }),

    paginatedApplications,

    paginatedDataProvider: ko.pureComputed(() =>
        new ArrayDataProvider(paginatedApplications(), { keyAttributes: '_id' })
    ),

    isDataEmpty: ko.pureComputed<boolean>(() =>
        applicationListObservables.applicationDataArray().length === 0
    )
};


export const applicationListMethods = {
    loadApplicationData: async () => {
        try {
            const baseUrl = ConfigService.getApiUrl();
            const response = await fetch(`${baseUrl}/applications`);
            const json = await response.json();
            if (response.ok) {
                 const sorted = json.data.sort((a: ApplicationData, b: ApplicationData) => {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                console.log('Loaded applications:', sorted);
                applicationListObservables.applicationDataArray(sorted);
                console.log(`Loaded ${sorted.length} applications`);
            } else {
                console.error('API Error', json);
            }
        } catch (err) {
            console.error('Fetch error', err);
        }
    }
};
