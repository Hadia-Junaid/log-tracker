import ArrayDataProvider = require('ojs/ojarraydataprovider');
import * as ko from 'knockout';


export const envOptions = new ArrayDataProvider(
  [
    { value: 'Development', label: 'Development' },
    { value: 'Testing', label: 'Testing' },
    { value: 'Production', label: 'Production' },
    { value: 'Staging', label: 'Staging' }
  ],
  { keyAttributes: 'value' }
);

export const sortOptions = new ArrayDataProvider(
  [
    { value: 'nameAsc', label: 'Name (A-Z)' },
    { value: 'nameDesc', label: 'Name (Z-A)' },
    { value: 'createdAtAsc', label: 'Created At (Oldest First)' },
    { value: 'createdAtDesc', label: 'Created At (Newest First)' },
    { value: 'updatedAtAsc', label: 'Updated At (Oldest First)' },
    { value: 'updatedAtDesc', label: 'Updated At (Newest First)' }  
  ],
  { keyAttributes: 'value' }
);

export const statusFilterOptions = new ArrayDataProvider(
  [
    { value: 'all', label: 'All Applications' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ],
  { keyAttributes: 'value' }
);

export const environmentFilterOptions = new ArrayDataProvider(
  [
    { value: 'all', label: 'All Environments' },
    { value: 'Development', label: 'Development' },
    { value: 'Testing', label: 'Testing' },
    { value: 'Production', label: 'Production' },
    { value: 'Staging', label: 'Staging' }
  ],
  { keyAttributes: 'value' }
);

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 1) {
    return 'Created today';
  } else if (diffInDays === 1) {
    return 'Created yesterday';
  } else if (diffInDays < 7) {
    return `Created ${diffInDays} days ago`;
  } else {
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) {
      return 'Created 1 week ago';
    } else {
      return `Created ${diffInWeeks} weeks ago`;
    }
  }
}
