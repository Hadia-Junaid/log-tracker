// src/components/applications/ApplicationsList.tsx
import { h } from "preact";
import { Application } from "src/types/applications";
import ApplicationCard from "./ApplicationCard";

type Props = {
  loading: boolean;
  error: string | null;
  applications: Application[];
  searchQuery?: string;
  onEditClick: (app: Application) => void;
  onDeleteClick: (id: string, name: string) => void;
};

export default function ApplicationsList({
  loading,
  error,
  applications,
  searchQuery,
  onEditClick,
  onDeleteClick,
}: Props) {
  if (loading) {
    return (
      <div
        class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center"
        style="height: 40vh;"
      >
        <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center oj-sm-flex-direction-column">
          <oj-progress-circle value={-1} size="lg" />
          <p
            class="oj-typography-body-md oj-text-color-secondary"
            style="margin-top: 16px;"
          >
            Loading applications...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center"
        style="height: 40vh;"
      >
        <p class="oj-text-color-danger oj-typography-body-md">{error}</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div
        class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center"
        style="height: 40vh;"
      >
        <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center oj-sm-flex-direction-column">
          <p
            class="oj-text-color-secondary"
            style="font-weight: bold; font-size: 1.25rem; text-align: center;"
          >
            {searchQuery
              ? "No applications match your search criteria!"
              : "There are currently no applications to show."}{" "}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div class="applications-container">
      {applications.map((app) => (
        <ApplicationCard
          key={app._id}
          app={app}
          onDeleteClick={(id, name) => onDeleteClick(id, name)}
          onEditClick={() => onEditClick(app)}
        />
      ))}
    </div>
  );
}
