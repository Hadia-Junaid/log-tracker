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
    sortOption: ko.observable<'nameAsc' | 'nameDesc' | 'createdAtAsc' | 'createdAtDesc' | 'updatedAtAsc' | 'updatedAtDesc'>('createdAtDesc'),
    statusFilter: ko.observable<'all' | 'active' | 'inactive'>('all'),
    environmentFilter: ko.observable<'all' | 'Development' | 'Testing' | 'Production' | 'Staging'>('all')
};

// Reset to page 1 on search change
applicationListObservables.searchQuery.subscribe(() => {
    applicationListObservables.currentPage(1);
});

// Subscribe to sorting changes
applicationListObservables.sortOption.subscribe(() => {
    applicationListObservables.currentPage(1); // Reset to first page if sorting changes
});

// Subscribe to status filter changes
applicationListObservables.statusFilter.subscribe(() => {
    applicationListObservables.currentPage(1); // Reset to first page if status filter changes
});

// Subscribe to environment filter changes
applicationListObservables.environmentFilter.subscribe(() => {
    applicationListObservables.currentPage(1); // Reset to first page if environment filter changes
});

// --- Computed ---
const paginatedApplications = ko.pureComputed<ApplicationData[]>(() => {
  const query = applicationListObservables.searchQuery().toLowerCase().trim();
  const sort = applicationListObservables.sortOption();
  const statusFilter = applicationListObservables.statusFilter();
  const environmentFilter = applicationListObservables.environmentFilter();

  const filtered = applicationListObservables.applicationDataArray().filter(app => {
    // Text search filter
    const matchesSearch = app.name.toLowerCase().includes(query) ||
                         app.hostname.toLowerCase().includes(query) ||
                         app.environment.toLowerCase().includes(query);
    
    // Status filter
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && app.isActive === true) ||
                         (statusFilter === 'inactive' && app.isActive !== true);
    
    // Environment filter
    const matchesEnvironment = environmentFilter === 'all' ||
                               app.environment === environmentFilter;
    
    return matchesSearch && matchesStatus && matchesEnvironment;
  });

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
        const query = applicationListObservables.searchQuery().toLowerCase().trim();
        const statusFilter = applicationListObservables.statusFilter();
        const environmentFilter = applicationListObservables.environmentFilter();
        
        const totalItems = applicationListObservables.applicationDataArray().filter(app => {
            // Text search filter
            const matchesSearch = app.name.toLowerCase().includes(query) ||
                                 app.hostname.toLowerCase().includes(query) ||
                                 app.environment.toLowerCase().includes(query);
            
            // Status filter
            const matchesStatus = statusFilter === 'all' ||
                                 (statusFilter === 'active' && app.isActive === true) ||
                                 (statusFilter === 'inactive' && app.isActive !== true);
            
            // Environment filter
            const matchesEnvironment = environmentFilter === 'all' ||
                                       app.environment === environmentFilter;
            
            return matchesSearch && matchesStatus && matchesEnvironment;
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
                console.log('Loaded applications with isActive values:', sorted.map((app: ApplicationData) => ({ name: app.name, isActive: app.isActive })));
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
