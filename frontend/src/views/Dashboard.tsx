import { h } from 'preact';
import PinnedAppsDashboard from '../components/Dashboard/PinnedApps/PinnedAppDashboard';
import '../styles/dashboard/dashboard.css';

type Props = {
  path?: string; // required by preact-router
  userId?: string; // user ID to fetch pinned apps
};

export default function Dashboard(props: Props) {
  return (
    <div class="dashboard-container">
      <div class="dashboard-inner">
        {/* Header */}
        <div class="dashboard-header">
          <h1 class="dashboard-title">Log Tracking Dashboard</h1>
          <p class="dashboard-subtitle">Monitor your applications and track critical logs</p>
        </div>

        <PinnedAppsDashboard userId={props.userId} />
      </div>
    </div>
  );
}
