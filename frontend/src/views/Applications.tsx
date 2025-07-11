// src/views/Applications.tsx
import { h } from "preact";
import { useState, useEffect, useMemo } from "preact/hooks";
import "../styles/applications.css";
import axios from "../api/axios";
import AddApplicationDialog from "../components/applications/AddApplicationDialog";
import { Application } from "src/types/applications";
import DeleteConfirmationDialog from "../components/applications/DeleteConfirmationDialog";
import EditApplicationDialog from "../components/applications/EditApplicationDialog";
import ApplicationsList from "../components/applications/ApplicationsList"; // Import the new component
import "ojs/ojselectcombobox";
import "ojs/ojselectsingle";
import ArrayDataProvider from "ojs/ojarraydataprovider";
import "oj-c/select-multiple";
import qs from "qs";

type Props = {
  path?: string;
};

export default function Applications({ path }: Props) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedAppName, setSelectedAppName] = useState<string | undefined>(
    undefined
  );
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const [pageSize, setPageSize] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState("all");
  const [environmentFilter, setEnvironmentFilter] = useState<Set<string>>(
    new Set()
  );
  const [sortOption, setSortOption] = useState("name");

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const environmentOptions = [
    { value: "Production", label: "Production" },
    { value: "Staging", label: "Staging" },
    { value: "Development", label: "Development" },
    { value: "Testing", label: "Testing" },
  ];

  const sortOptions = [
    { value: "name", label: "Name (A-Z)" },
    { value: "nameDesc", label: "Name (Z-A)" },
    { value: "createdAtDesc", label: "Created Date (Newest First)" },
    { value: "createdAt", label: "Created Date (Oldest First)" },
    // { value: "updatedAtDesc", label: "Last Updated (Newest First)" },
    // { value: "updatedAt", label: "Last Updated (Oldest First)" },
  ];

  const pageSizeOptions = [
    { value: 4, label: "4 per page" },
    { value: 6, label: "6 per page" },
    { value: 10, label: "10 per page" },
    { value: 20, label: "20 per page" },
  ];

  const statusDataProvider = useMemo(() => {
    return new ArrayDataProvider(statusOptions, { keyAttributes: "value" });
  }, []);

  const environmentDataProvider = useMemo(() => {
    return new ArrayDataProvider(environmentOptions, {
      keyAttributes: "value",
    });
  }, []);

  // Set the default sort option to "name" for initial load
  const sortDataProvider = useMemo(() => {
    return new ArrayDataProvider(sortOptions, { keyAttributes: "value" });
  }, []);

  const pageSizeDataProvider = useMemo(() => {
    return new ArrayDataProvider(pageSizeOptions, { keyAttributes: "value" });
  }, []);

  const fetchApplications = async (showLoading: boolean = true) => {
    if (showLoading) {
      setLoading(true);
      setIsInitialLoading(true);
    }
    setError(null); // Clear previous errors

    try {
      console.log("Fetching applications with filters:", {
        currentPage,
        searchQuery,
        statusFilter,
        environmentFilter: environmentFilter ? Array.from(environmentFilter) : [],
        sortOption,
        pageSize,
      });
      const response = await axios.get("/applications", {
        params: {
          page: currentPage,
          pageSize: pageSize,
          search: searchQuery,
          status: statusFilter,
          environment: Array.from(environmentFilter),
          sort: sortOption,
        },
        paramsSerializer: (params) =>
          qs.stringify(params, { arrayFormat: "repeat" }),
      });
      console.log("Fetched applications:", response);
      setApplications(response.data.data);
      setTotalCount(response.data.total);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("Failed to fetch applications. Please try again.");
    } finally {
      if (showLoading) {
        setLoading(false);
        setIsInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Always show loading for both search and pagination
      fetchApplications(true);
    }, searchQuery ? 300 : 0); // Debounce for search, no delay for pagination
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchQuery, statusFilter, environmentFilter, sortOption, pageSize]);

  const updateSelectedApplication = (updatedApp: Application) => {
    setApplications((prevApps) =>
      prevApps.map((app) =>
        app._id === updatedApp._id ? { ...app, ...updatedApp } : app
      )
    );
  };

  const handleEditClick = (app: Application) => {
    setSelectedApp(app);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setSelectedAppId(id);
    setSelectedAppName(name);
    setDeleteDialogOpen(true);
  };

  const handleSuccessfulDelete = () => {
    // If the last item on a page > 1 is deleted, go to the previous page
    if (applications.length === 1 && currentPage > 1) {
      setCurrentPage((p) => p - 1);
    } else {
      fetchApplications();
    }
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setEnvironmentFilter(new Set());
    setSortOption("name");
    setSearchQuery("");
    setCurrentPage(1);
    setPageSize(6);
  };

  return (
    <div class="page-container">
      <div class="applications-page-content">
        <div class="applications-header">
          {/* LEFT: Title + description */}
          <div class="applications-title-block">
            <h1 class="applications-title">Applications</h1>
            <p class="applications-description">
              Manage and monitor all your applications in one place.
            </p>
          </div>

          {/* RIGHT: Add Button + Total */}
          <div class="applications-header-actions">
            <oj-button
              chroming="solid"
              class="add-button"
              onojAction={() => setIsAddDialogOpen(true)}
            >
              <span slot="startIcon" class="oj-ux-ico-plus"></span>
              Add Application
            </oj-button>
            <div class="applications-total">
              Total Applications: {totalCount}
            </div>
          </div>

          <div class="applications-toolbar">
            {/* Left: Search */}
            <div class="search-wrapper">
              <oj-input-text
                placeholder="Search applications"
                value={searchQuery}
                onrawValueChanged={(e:CustomEvent) => {
                  setSearchQuery(e.detail.value);
                  setCurrentPage(1);
                }}
                class="search-input"
              ></oj-input-text>
            </div>

            {/* Right: Filters */}
            <div class="filters-group">
              <oj-select-single
                class="filter-dropdown"
                label-hint="Status"
                data={statusDataProvider}
                value={statusFilter}
                onvalueChanged={(e: CustomEvent) => {
                  console.log("Status filter changed:", e);
                  setStatusFilter(e.detail.value);
                  setCurrentPage(1);
                }}
              ></oj-select-single>

              <oj-c-select-multiple
                class="filter-dropdown"
                labelHint="Environments"
                data={environmentDataProvider}
                // Bind the component's value to your state
                value={environmentFilter}
                item-text="label"
                // Use the event handler to update your state
                onvalueChanged={(event) => {
                  const newValue = event.detail.value as Set<string> | null;
                  console.log("Environment filter changed:", newValue);
                  setEnvironmentFilter(newValue ?? new Set<string>());
                  setCurrentPage(1);
                }}
                placeholder="Select Environments"
              ></oj-c-select-multiple>

              <oj-select-single
                class="filter-dropdown"
                label-hint="Sort"
                data={sortDataProvider}
                value={sortOption}
                onvalueChanged={(e: CustomEvent) => {
                  setSortOption(e.detail.value);
                  setCurrentPage(1);
                }}
              ></oj-select-single>

              {/* Reset Filters Button */}
              <oj-button
                chroming="solid"
                class="add-button"
                onojAction={handleResetFilters}
              >
                <span slot="startIcon" class="oj-ux-ico-refresh"></span>
                Reset
              </oj-button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div
          class="oj-flex oj-sm-flex-direction-column"
          style="flex: 1; min-height: 0;"
        >
          <div style="flex: 1; min-height: 0;" class="oj-flex-item-auto">
            <ApplicationsList
              loading={isInitialLoading}
              error={error}
              applications={applications}
              searchTerm={searchQuery}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
            />
          </div>

          {/* Pagination controls */}
          <div class="pagination-container">
            {!loading && totalCount > 0 && (
              <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center">
                <oj-button 
                  disabled={currentPage === 1}
                  onojAction={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                >
                  Previous
                </oj-button>

                <div class="pagination-info">
                  Page {currentPage} of {Math.ceil(totalCount / pageSize)} • Showing {((currentPage - 1) * pageSize) + 1}-
                  {Math.min(currentPage * pageSize, totalCount)} of{" "}
                  {totalCount} applications
                </div>

                <oj-button
                  disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                  onojAction={() =>
                    setCurrentPage((p) =>
                      p < Math.ceil(totalCount / pageSize) ? p + 1 : p
                    )
                  }
                >
                  Next
                </oj-button>

                <div class="oj-sm-margin-2x-start">
                  <oj-select-single
                    class="oj-form-control"
                    label-hint="Page Size"
                    data={pageSizeDataProvider}
                    value={pageSize}
                    onvalueChanged={(e: CustomEvent) => {
                      setPageSize(e.detail.value);
                      setCurrentPage(1); // Reset to first page when changing page size
                    }}
                    style="min-width: 150px; height: 36px;"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Might need to use state variables rather than oracles opening logic here especially for edit as they sometimes open and close unprompted */}
      <AddApplicationDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onApplicationAdded={() => fetchApplications(true)}
      />
      <EditApplicationDialog
        isOpen={isEditDialogOpen}
        application={selectedApp}
        onClose={() => setEditDialogOpen(false)}
        onApplicationUpdated={updateSelectedApplication}
      />
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        applicationId={selectedAppId}
        applicationName={selectedAppName}
        onClose={() => setDeleteDialogOpen(false)}
        onDeleteSuccess={handleSuccessfulDelete}
      />
    </div>
  );
}
