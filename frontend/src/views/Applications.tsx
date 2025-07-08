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
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [sortOption, setSortOption] = useState("all");

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "development", label: "In Development" },
  ];

  const environmentOptions = [
    { value: "all", label: "All Environments" },
    { value: "production", label: "Production" },
    { value: "staging", label: "Staging" },
    { value: "development", label: "Development" },
  ];

  const sortOptions = [
    { value: "name", label: "Name (A-Z)" },
    { value: "createdAt", label: "Created Date" },
    { value: "updatedAt", label: "Last Updated" },
  ];

  const statusDataProvider = useMemo(() => {
    return new ArrayDataProvider(statusOptions, { keyAttributes: "value" });
  }, []);

  const environmentDataProvider = useMemo(() => {
    return new ArrayDataProvider(environmentOptions, {
      keyAttributes: "value",
    });
  }, []);

  const sortDataProvider = useMemo(() => {
    return new ArrayDataProvider(sortOptions, {
      keyAttributes: "value",
    });
  }, []);

  const fetchApplications = async () => {
    try {
      // setLoading(true);  //commenting this out because i dont want this every time i search
      const response = await axios.get("/applications", {
        params: {
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: searchQuery,
        },
      });
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
  }, [currentPage, searchQuery]);

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
            <div class="applications-total">{totalCount} total</div>
          </div>

        <div class="applications-toolbar">
  {/* Left: Search */}
  <div class="search-wrapper">
    <oj-input-text
      placeholder="Search applications"
      value={searchQuery}
      onrawValueChanged={(e) => {
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
      onvalue-changed={(e: any) => setStatusFilter(e.detail.value)}
    ></oj-select-single>

    <oj-select-single
      class="filter-dropdown"
      label-hint="Environment"
      data={environmentDataProvider}
      value={environmentFilter}
      onvalue-changed={(e: any) => setEnvironmentFilter(e.detail.value)}
    ></oj-select-single>

    <oj-select-single
      class="filter-dropdown"
      label-hint="Sort"
      data={sortDataProvider}
      value={sortOption}
      onvalue-changed={(e: any) => setSortOption(e.detail.value)}
    ></oj-select-single>
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
          <div class="oj-flex oj-sm-flex-direction-column oj-sm-align-items-center oj-sm-margin-2x-vertical">
            <div class="oj-sm-margin-1x-bottom">
              Page {currentPage} of {Math.ceil(totalCount / PAGE_SIZE)}
            </div>
            <div class="oj-flex oj-sm-flex-wrap-nowrap oj-sm-align-items-center">
              <oj-button
                chroming="outlined"
                onojAction={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                class="oj-sm-margin-1x-end"
              >
                ← Previous
              </oj-button>
              <oj-button
                chroming="outlined"
                onojAction={() =>
                  setCurrentPage((p) =>
                    p < Math.ceil(totalCount / PAGE_SIZE) ? p + 1 : p
                  )
                }
                disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
              >
                Next →
              </oj-button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
