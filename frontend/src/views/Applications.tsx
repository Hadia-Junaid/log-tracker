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
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedAppName, setSelectedAppName] = useState<string | undefined>(
    undefined
  );
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const PAGE_SIZE = 6;
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

  const fetchApplications = async () => {
    try {
      console.log("Fetching applications with filters:", {
        currentPage,
        searchQuery,
        statusFilter,
        environmentFilter: environmentFilter ? Array.from(environmentFilter) : [],
        sortOption,
      });
      // setLoading(true);  //commenting this out because i dont want this every time i search
      const response = await axios.get("/applications", {
        params: {
          page: currentPage,
          pageSize: PAGE_SIZE,
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
      setError(null); // Clear previous errors
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("Failed to fetch applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchApplications();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchQuery, statusFilter, environmentFilter, sortOption]);

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
  };

  return (
    <div class="page-container">
      <div class="applications-page-content">
        <div class="applications-header">
          <h1 class="applications-title">Applications</h1>
          <div class="applications-controls">
            <oj-input-text
              placeholder="Search applications"
              value={searchQuery}
              onrawValueChanged={(e: any) => {
                setSearchQuery(e.detail.value);
                setCurrentPage(1); // Reset to first page on new search
              }}
              class="search-input"
            ></oj-input-text>
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
                onrawValueChanged={(e: any) => {
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
        <ApplicationsList
          loading={loading}
          error={error}
          applications={applications}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />
      </div>

      {/* Might need to use state variables rather than oracles opening logic here especially for edit as they sometimes open and close unprompted */}
      <AddApplicationDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onApplicationAdded={fetchApplications}
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

      <div class="pagination-footer">
        {!loading && totalCount > 0 && (
          <div class="pagination-controls">
            <oj-button
              chroming="outlined"
              onojAction={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              class="pagination-btn"
            >
              ← Previous
            </oj-button>
            <span class="pagination-info">
              Page {currentPage} of {Math.ceil(totalCount / PAGE_SIZE)}
            </span>
            <oj-button
              chroming="outlined"
              onojAction={() =>
                setCurrentPage((p) =>
                  p < Math.ceil(totalCount / PAGE_SIZE) ? p + 1 : p
                )
              }
              disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
              class="pagination-btn"
            >
              Next →
            </oj-button>
          </div>
        )}
      </div>
    </div>
  );
}
