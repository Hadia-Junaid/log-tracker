/** @jsx h */
import { h } from "preact";
import { useEffect, useState, useMemo } from "preact/hooks";
import "ojs/ojtable";
import "ojs/ojprogress-circle";
import "ojs/ojinputtext";
import { ojTable } from "ojs/ojtable";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import axios from "../api/axios";
import "../styles/logs.css";
import LogsHeader from "../components/logspage/LogsHeader";
import LogsTable from "../components/logspage/LogsTable";

type LogEntry = {
  _id: string;
  application_id: string;
  timestamp: string;
  log_level: string;
  message: string;
};

type Application = {
  _id: string;
  name: string;
};

type Props = {
  path?: string;
};

export default function Logs(props: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [appMap, setAppMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [logLevels, setLogLevels] = useState<string[]>([]); // NEW

  const userId = "68650fd57a72d0b64525da71"; // hardcoded for now

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch logs from backend
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/logs/${userId}`, {
          params: {
            search: debouncedSearch,
            app_ids: Array.from(selectedAppIds).join(','),
            log_levels: logLevels.join(','),
          },
        });

        setLogs(res.data.data);
        setApplications(res.data.assigned_applications || []);

        const map: Record<string, string> = {};
        res.data.assigned_applications.forEach((app: Application) => {
          map[app._id] = app.name;
        });
        setAppMap(map);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        setError("Could not load logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [debouncedSearch, selectedAppIds, logLevels]); // logLevels included

  const dataProvider = useMemo(() => {
    const enrichedLogs = logs.map((log) => ({
      ...log,
      application_name: appMap[log.application_id] || "—",
      formatted_time: new Date(log.timestamp).toLocaleString(),
    }));

    return new ArrayDataProvider(enrichedLogs, { keyAttributes: "_id" });
  }, [logs, appMap]);

  const columns = [
    {
      headerText: "Time",
      field: "formatted_time",
      resizable: "enabled" as const,
      id: "col_time",
    },
    {
      headerText: "Level",
      field: "log_level",
      resizable: "enabled" as const,
      id: "col_level",
    },
    {
      headerText: "Service",
      field: "application_name",
      resizable: "enabled" as const,
      id: "col_service",
    },
    {
      headerText: "Message",
      field: "message",
      resizable: "enabled" as const,
      id: "col_message",
    },
  ];

  return (
    <div class="oj-sm-padding-6x logs-page" style="width: 100%;">
      <LogsHeader
        search={search}
        setSearch={setSearch}
        applications={applications}
        selectedAppIds={selectedAppIds}
        setSelectedAppIds={setSelectedAppIds}
        logLevels={logLevels}
        setLogLevels={setLogLevels}
      />
      <LogsTable loading={loading} error={error} dataProvider={dataProvider} columns={columns} />
    </div>
  );
}
