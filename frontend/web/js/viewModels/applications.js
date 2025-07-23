var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "../accUtils", "knockout", "../services/config-service", "./applicationManagement/appList", "./applicationManagement/addAppDialog", "./applicationManagement/editAppDialog", "./applicationManagement/deleteDialog", "./applicationManagement/applicationUtils", "./applicationManagement/applicationUtils", "../services/auth.service", "ojs/ojknockout", "ojs/ojlistview", "ojs/ojlistitemlayout", "ojs/ojbutton", "ojs/ojlabel", "ojs/ojdialog", "ojs/ojinputsearch", "ojs/ojformlayout", "ojs/ojavatar", "oj-c/input-text", "oj-c/text-area", "oj-c/select-single", "oj-c/checkbox", "ojs/ojswitch"], function (require, exports, AccUtils, ko, config_service_1, appList_1, addAppDialog_1, editAppDialog_1, deleteDialog_1, applicationUtils_1, applicationUtils_2, auth_service_1) {
    "use strict";
    class ApplicationViewModel {
        constructor() {
            this.applicationDataArray = appList_1.applicationListObservables.applicationDataArray;
            this.searchQuery = appList_1.applicationListObservables.searchQuery;
            this.currentPage = appList_1.applicationListObservables.currentPage;
            this.pageSize = appList_1.applicationListObservables.pageSize;
            this.sortOption = appList_1.applicationListObservables.sortOption;
            this.statusFilter = appList_1.applicationListObservables.statusFilter;
            this.environmentFilter = appList_1.applicationListObservables.environmentFilter;
            this.newApplication = addAppDialog_1.addAppDialogObservables.newApplication;
            this.envOptions = applicationUtils_1.envOptions;
            this.selectedApplicationId = editAppDialog_1.editAppDialogObservables.selectedApplicationId;
            this.selectedApplicationName = editAppDialog_1.editAppDialogObservables.selectedApplicationName;
            this.selectedApplicationHostName = editAppDialog_1.editAppDialogObservables.selectedApplicationHostName;
            this.selectedApplicationEnv = editAppDialog_1.editAppDialogObservables.selectedApplicationEnv;
            this.selectedApplicationDescription = editAppDialog_1.editAppDialogObservables.selectedApplicationDescription;
            this.selectedApplicationIsActive = editAppDialog_1.editAppDialogObservables.selectedApplicationIsActive;
            this.availableGroups = addAppDialog_1.addAppDialogObservables.availableGroups;
            this.availableGroupsEdit = editAppDialog_1.editAppDialogObservables.availableGroupsEdit;
            this.sortOptions = applicationUtils_2.sortOptions;
            this.isAdmin = ko.observable(false);
            this.statusFilterOptions = applicationUtils_1.statusFilterOptions;
            this.environmentFilterOptions = applicationUtils_1.environmentFilterOptions;
            this.addAppDialogError = addAppDialog_1.addAppDialogObservables.addAppDialogError;
            this.editAppDialogError = editAppDialog_1.editAppDialogObservables.editAppDialogError;
            this.totalPages = appList_1.applicationListComputed.totalPages;
            this.paginatedApplications = appList_1.applicationListComputed.paginatedApplications;
            this.paginatedDataProvider = appList_1.applicationListComputed.paginatedDataProvider;
            this.isDataEmpty = appList_1.applicationListComputed.isDataEmpty;
            this.loadApplicationData = appList_1.applicationListMethods.loadApplicationData;
            this.openAddDialog = addAppDialog_1.addAppDialogMethods.openAddDialog;
            this.closeAddDialog = addAppDialog_1.addAppDialogMethods.closeAddDialog;
            this.addNewApplication = addAppDialog_1.addAppDialogMethods.addNewApplication;
            this.resetNewAppForm = addAppDialog_1.addAppDialogMethods.resetNewAppForm;
            this.editApplication = editAppDialog_1.editAppDialogMethods.editApplication;
            this.gotoEditApplication = editAppDialog_1.editAppDialogMethods.gotoEditApplication;
            this.openEditDialog = editAppDialog_1.editAppDialogMethods.openEditDialog;
            this.closeEditDialog = editAppDialog_1.editAppDialogMethods.closeEditDialog;
            this.updateApplication = editAppDialog_1.editAppDialogMethods.updateApplication;
            this.getRelativeTime = applicationUtils_1.getRelativeTime;
            this.handleDeleteApp = deleteDialog_1.deleteDialogMethods.handleDeleteApp(this.applicationDataArray);
            this.cancelDelete = deleteDialog_1.deleteDialogMethods.cancelDelete;
            this.confirmDelete = deleteDialog_1.deleteDialogMethods.confirmDelete;
            this.isDeleting = deleteDialog_1.deleteDialogMethods.isDeleting;
            this.applicationName = deleteDialog_1.deleteDialogMethods.applicationName;
            this.authService = new auth_service_1.AuthService();
            this.isAdmin(this.authService.getIsAdminFromToken());
            window.addEventListener('authStateChanged', () => {
                this.isAdmin(this.authService.getIsAdminFromToken());
            });
            AccUtils.announce("Application page loaded", "assertive");
            document.title = "Applications";
        }
        connected() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    this.isAdmin(this.authService.getIsAdminFromToken());
                    yield config_service_1.ConfigService.loadConfig();
                    yield this.loadApplicationData();
                }
                catch (error) {
                    console.error("Error during ViewModel connected lifecycle:", error);
                }
            });
        }
        disconnected() {
        }
        transitionCompleted() {
        }
    }
    return ApplicationViewModel;
});
//# sourceMappingURL=applications.js.map