import { h } from 'preact';
import PinnedAppsCard from '../components/Dashboard/PinnedApps/PinnedAppsCard';

type Props = {
  path?: string; // required by preact-router
  userId?: string; // user ID to fetch pinned apps
};

export default function Dashboard(props: Props) {
  return (
    <div className="min-h-screen bg-gray-50 p-6 oj-container">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Log Tracking Dashboard</h1>
          <p className="text-gray-600">Monitor your applications and track critical logs</p>
        </div>

        <PinnedAppsCard userId={props.userId} />

        {/* <AtRiskAppsCard /> */}
      </div>
    </div>
  );
}
