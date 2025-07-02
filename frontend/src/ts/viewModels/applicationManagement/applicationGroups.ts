import * as ko from 'knockout';

export const availableGroups = ko.observableArray<string>([
  'Admin Group',
  'Development Team',
  'QA Team',
  'Operations Team',
  'Security Team'
]);

export const selectedGroupsForAdd = ko.observableArray<string>(['Admin Group']);
export const selectedGroupsForEdit = ko.observableArray<string>([]);
