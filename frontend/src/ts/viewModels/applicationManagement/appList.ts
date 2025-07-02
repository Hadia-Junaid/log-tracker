import * as ko from 'knockout';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { ApplicationData } from './types';
import { ConfigService } from '../../services/config-service';

// --- Observables ---
export const applicationListObservables = {
    applicationDataArray: ko.observableArray<ApplicationData>([]),
    searchQuery: ko.observable(''),
    currentPage: ko.observable(1),
    pageSize: 5,
    sortOption: ko.observable<'nameAsc' | 'nameDesc' | 'createdAtAsc' | 'createdAtDesc' | 'updatedAtAsc' | 'updatedAtDesc'>('createdAtDesc')
};

// Reset to page 1 on search change
applicationListObservables.searchQuery.subscribe(() => {
    applicationListObservables.currentPage(1);
});

// Subscribe to sorting changes
applicationListObservables.sortOption.subscribe(() => {
    applicationListObservables.currentPage(1); // Reset to first page if sorting changes
});

// --- Computed ---
const paginatedApplications = ko.pureComputed<ApplicationData[]>(() => {
  const query = applicationListObservables.searchQuery().toLowerCase().trim();
  const sort = applicationListObservables.sortOption();

  const filtered = applicationListObservables.applicationDataArray().filter(app =>
    app.name.toLowerCase().includes(query) ||
    app.hostname.toLowerCase().includes(query) ||
    app.environment.toLowerCase().includes(query)
  );

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'nameAsc':
        return a.name.localeCompare(b.name);
      case 'nameDesc':
        return b.name.localeCompare(a.name);
      case 'createdAtAsc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'createdAtDesc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'updatedAtAsc':
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case 'updatedAtDesc':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const startIdx = (applicationListObservables.currentPage() - 1) * applicationListObservables.pageSize;
  return sorted.slice(startIdx, startIdx + applicationListObservables.pageSize);
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
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${baseUrl}/applications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
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
