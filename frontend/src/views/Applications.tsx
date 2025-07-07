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

type Props = {
  path?: string;
};

export default function Applications({ path }: Props) {
  const [searchText, setSearchText] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedAppName, setSelectedAppName] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    // Fetch applications from API
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/applications");

        console.log("Fetched applications:", response.data);

        setApplications(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching applications:", error);
        setLoading(false);
        setError("Failed to fetch applications");
      }
    };

    fetchApplications();
  }, []);

  const pushNewApplication = (newApp: Application) => {
    setApplications((prevApps) => [...prevApps, newApp]);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setSelectedAppId(id);
    setSelectedAppName(name);
    setDeleteDialogOpen(true);
  };

  return (
    <div class="page-container">
      <div class="applications-header">
        <h1 class="applications-title">Applications</h1>
        <div class="applications-controls">
          <oj-input-text
            placeholder="Search applications"
            value={searchText}
            onvalueChanged={(e) => setSearchText(e.detail.value)}
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
          />
        ))}
      </div>

      {/* Add the new AddApplicationDialog component */}
      <AddApplicationDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onApplicationAdded={pushNewApplication} // Pass the function to add new application
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        applicationId={selectedAppId}
        applicationName={selectedAppName}
        onClose={() => setDeleteDialogOpen(false)}
        onDeleteSuccess={() => {
          setApplications((prev) =>
            prev.filter((a) => a._id !== selectedAppId)
          );
        }}
      />
    </div>
  );
}
