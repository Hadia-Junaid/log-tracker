// src/views/Applications.tsx
import { h } from "preact";
import ApplicationCard from "../components/applications/ApplicationCard";
import { useState, useEffect } from "preact/hooks";
import "../styles/applications.css";
import axios from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import AddApplicationDialog from "../components/applications/AddApplicationDialog";
import { Application } from "src/types/applications";
import DeleteConfirmationDialog from "../components/applications/DeleteConfirmationDialog";
import EditApplicationDialog from "../components/applications/EditApplicationDialog";

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

  // Fetch applications from API
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/applications", {
        params: {
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: searchQuery,
        },
      });

      console.log("Fetched applications:", response.data);

      setApplications(response.data.data);
      setTotalCount(response.data.total);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setLoading(false);
      setError("Failed to fetch applications");
    }
  };

  useEffect(() => {
    
    //use debounce delay here to search
    const delayDebounceFn = setTimeout(() => {
      fetchApplications();
    }, 300); // Adjust the delay as needed (300ms here)

    return () => clearTimeout(delayDebounceFn); // Cleanup the timeout on unmount or when dependencies change

  }, [currentPage, searchQuery]);

  const pushNewApplication = (newApp: Application) => {
    setApplications((prevApps) => [...prevApps, newApp]);
  };

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

  return (
    <div class="page-container">
      <div class="applications-page-content">
        <div class="applications-header">
          <h1 class="applications-title">Applications</h1>
          <div class="applications-controls">
            <oj-input-text
              placeholder="Search applications"
              value={searchQuery}
              onrawValueChanged={(e) => setSearchQuery(e.detail.value)}
              class="search-input"
            ></oj-input-text>
            <oj-button
              chroming="solid"
              class="add-button"
              onojAction={() => setIsAddDialogOpen(true)} // This line opens the dialog
            >
              <span slot="startIcon" class="oj-ux-ico-plus"></span>
              Add Application
            </oj-button>
          </div>
        </div>

        {loading && <LoadingSpinner message="Loading applications..." />}
        {error && <p class="oj-text-color-danger">{error}</p>}

        <div class="applications-container">
          {applications.map((app) => (
            <ApplicationCard
              key={app._id}
              app={app}
              onDeleteClick={(id, name) => handleDeleteClick(id, name)}
              onEditClick={() => handleEditClick(app)}
            />
          ))}
        </div>
      </div>

      {/* Add Application Dialog */}
      <AddApplicationDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onApplicationAdded={fetchApplications}
      />

      {/* Edit Application Dialog */}
      <EditApplicationDialog
        isOpen={isEditDialogOpen}
        application={selectedApp}
        onClose={() => setEditDialogOpen(false)}
        onApplicationUpdated={updateSelectedApplication}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        applicationId={selectedAppId}
        applicationName={selectedAppName}
        onClose={() => setDeleteDialogOpen(false)}
        onDeleteSuccess={()=>{
          setCurrentPage(1); // Reset to first page after deletion
          console.log("Reset page after deletion")
          fetchApplications();
        }}
      />

      <div class="pagination-footer">
        {!loading && applications.length > 0 && (
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
