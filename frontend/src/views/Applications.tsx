// src/views/Applications.tsx
import { h } from "preact";
import ApplicationCard from "../components/applications/ApplicationCard";
import { useState, useEffect } from "preact/hooks";
import "../styles/applications.css";
import axios from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";

type Props = {
  path?: string;
};

type Application = {
  _id: string;
  name: string;
  hostname: string;
  createdAt: string;
  isActive: boolean;
  environment: string;
  description?: string;
};

const dummyApplications: Application[] = [
  {
    _id: "app-001",
    name: "Log Processor",
    hostname: "log-processor.local",
    createdAt: "2025-07-05T10:00:00Z",
    isActive: true,
    environment: "Production",
  },
  {
    _id: "app-002",
    name: "Analytics Service",
    hostname: "analytics.local",
    createdAt: "2025-07-01T09:15:00Z",
    isActive: false,
    environment: "Staging",
  },
 
];

export default function Applications({ path }: Props) {
  const [searchText, setSearchText] = useState("");
  const [applications, setApplications] =
    useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <oj-button chroming="solid" class="add-button">
            <span slot="startIcon" class="oj-ux-ico-plus"></span>
            Add Application
          </oj-button>
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading applications..." />}
      {error && <p class="oj-text-color-danger">{error}</p>}

      <div class="applications-container">
        {applications.map((app) => (
          <ApplicationCard key={app._id} app={app} />
        ))}
      </div>
    </div>
  );
}
