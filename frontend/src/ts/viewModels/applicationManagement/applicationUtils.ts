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
