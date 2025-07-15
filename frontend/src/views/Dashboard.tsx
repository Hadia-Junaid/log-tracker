import { h } from 'preact';
import PinnedAppsDashboard from '../components/Dashboard/PinnedApps/PinnedAppDashboard';
import ActiveAppsDashboard from '../components/Dashboard/ActiveApps/ActiveAppDashboard';
import AtRiskAppsCard from '../components/Dashboard/AtRiskApps/AtRIskAppsCard';
import LogActivityChart from '../components/Dashboard/LogActivity/LogActivityChart'; // adjust path accordingly
import '../styles/dashboard/dashboard.css';

type Props = {
  path?: string; // required by preact-router
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

        <PinnedAppsDashboard />
        <div class="dashboard-cards-grid equal-height">
          <ActiveAppsDashboard />
          <AtRiskAppsCard />
        </div>
        <LogActivityChart />
      </div>
    </div>
  );
}
