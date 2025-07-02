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