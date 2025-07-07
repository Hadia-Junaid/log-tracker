import * as ko from 'knockout';
import { ConfigService } from '../../services/config-service';

export const selectedGroupsForAdd = ko.observableArray<string>([]);
export const selectedGroupsForEdit = ko.observableArray<string>([]);
