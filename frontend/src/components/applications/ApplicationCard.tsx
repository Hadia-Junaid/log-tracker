// src/components/ApplicationCard.tsx
import { h } from 'preact';
import 'ojs/ojbutton';
import 'ojs/ojactioncard';

type Application = {
  _id: string;
  name: string;
  hostname: string;
  createdAt: string;
  isActive: boolean;
  environment: string;
description?: string;
};

type Props = {
  app: Application;
  onDeleteClick: (id: string, name: string) => void; // Uncomment if delete functionality is needed
};

export default function ApplicationCard({ app, onDeleteClick }: Props) {
  return (
    <ojactioncard key={app._id} class="application-card">
      <div class="card-content">
        <div class="app-name">{app.name}</div>
        <div class="app-detail">ID: {app._id}</div>
        <div class="app-detail">Hostname: {app.hostname}</div>
        <div class="app-detail">Created: {new Date(app.createdAt).toLocaleDateString()}</div>
        <div class="app-status">
          Status:{' '}
          <span class={app.isActive ? 'status-active' : 'status-inactive'}>
            {app.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Optional Description */}
        {app.description && (
          <div class="app-detail app-description">
            {app.description}
          </div>
        )}
      </div>

      <div slot="footer" class="card-footer">
        <span class="environment-tag">{app.environment}</span>
        <div class="action-buttons">
          <oj-button class="oj-button-sm edit-button" chroming="outlined">
            <span slot="startIcon" class="oj-ux-ico-edit"></span>
            Edit
          </oj-button>
          <oj-button class="oj-button-sm delete-button" chroming="outlined" onClick={() => onDeleteClick(app._id, app.name)}>
            <span slot="startIcon" class="oj-ux-ico-trash"></span>
            Delete
          </oj-button>
        </div>
      </div>
    </ojactioncard>
  );
}