// src/components/applications/ApplicationsList.tsx
import { h } from "preact";
import { Application } from "src/types/applications";
import ApplicationCard from "./ApplicationCard";

type Props = {
  loading: boolean;
  error: string | null;
  applications: Application[];
  onEditClick: (app: Application) => void;
  onDeleteClick: (id: string, name: string) => void;
};

export default function ApplicationsList({ loading, error, applications, onEditClick, onDeleteClick }: Props) {

  if (error) {
    return <p class="oj-text-color-danger" style={{ textAlign: 'center', marginTop: '20px' }}>{error}</p>;
  }

  if (applications.length === 0) {
    return <p style={{ textAlign: 'center', marginTop: '20px' }}>No applications found.</p>;
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