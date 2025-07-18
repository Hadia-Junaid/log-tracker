/** @jsx h */
import { h } from 'preact';
import { useState } from 'preact/hooks';
import PinnedAppsDashboard from '../components/Dashboard/PinnedApps/PinnedAppDashboard';
import ActiveAppsDashboard from '../components/Dashboard/ActiveApps/ActiveAppDashboard';
import AtRiskAppsCard from '../components/Dashboard/AtRiskApps/AtRIskAppsCard';
import LogActivityChart from '../components/Dashboard/LogActivity/LogActivityChart';
import '../styles/dashboard/dashboard.css';
import 'ojs/ojbutton';


type Props = {
  path?: string; // required by preact-router
};

export default function Dashboard(props: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1); // triggers remount
  };

  return (
    <div class="dashboard-container">
      <div class="dashboard-inner">
        {/* Header */}
        <div class="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 class="dashboard-title">Dashboard</h1>
            <p class="dashboard-subtitle">Monitor your applications and track critical logs</p>
          </div>
           {/* Refresh Button aligned left */}
<div style={{ marginLeft: 'auto' }}>
  <oj-button onojAction={handleRefresh}>
    <span class="oj-ux-ico-refresh" slot="startIcon"></span>
    Refresh
  </oj-button>
</div>


        </div>
       
        {/* Pass refreshKey as key to force re-mount and re-fetch */}
        <PinnedAppsDashboard key={`pinned-${refreshKey}`} />
        <div class="dashboard-cards-grid equal-height">
          <ActiveAppsDashboard key={`active-${refreshKey}`} />
          <AtRiskAppsCard key={`risk-${refreshKey}`} />
        </div>
        <LogActivityChart key={`log-${refreshKey}`} />
      </div>
    </div>
  );
}
