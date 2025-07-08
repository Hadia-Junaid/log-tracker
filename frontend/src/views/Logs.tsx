/** @jsx h */
import { h } from "preact";
import { useEffect, useState, useMemo } from "preact/hooks";
import "ojs/ojtable";
import "ojs/ojprogress-circle";
import "ojs/ojinputtext";
// import { ojTable } from "ojs/ojtable";
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
  const [logLevels, setLogLevels] = useState<string[]>([]); 
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // const userId = "68650fd57a72d0b64525da71"; // hardcoded for postman 

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
        const res = await axios.get(`/logs`, {
          params: {
            search: debouncedSearch,
            app_ids: Array.from(selectedAppIds).join(','),
            log_levels: logLevels.join(','),
            page,
          },
        });

        setLogs(res.data.data);
        setApplications(res.data.assigned_applications || []);
        setTotalPages(res.data.total_pages || 1);

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
  }, [debouncedSearch, selectedAppIds, logLevels, page]); 

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
    <div class="oj-sm-padding-6x logs-page" style="width: 100%; min-height: 100vh; display: flex; flex-direction: column;">
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
      {/* Pagination Controls */}
      <div style={{
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '2rem',
        position: 'sticky',
        bottom: 0,
        // background: '#fff',
        zIndex: 10,
        padding: '1rem 0 0.5rem 0',
      }}>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          style={{
            padding: '0.5em 1.2em',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: page === 1 ? '#f0f0f0' : '#fff',
            color: page === 1 ? '#aaa' : '#1976d2',
            fontWeight: 600,
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            marginRight: '1.5em',
            transition: 'all 0.2s',
          }}
        >
          Previous
        </button>
        <span style={{ fontWeight: 600, fontSize: '1.1em', color: '#222', minWidth: '5em', textAlign: 'center' }}>
          Page {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          style={{
            padding: '0.5em 1.2em',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: page === totalPages ? '#f0f0f0' : '#fff',
            color: page === totalPages ? '#aaa' : '#1976d2',
            fontWeight: 600,
            cursor: page === totalPages ? 'not-allowed' : 'pointer',
            marginLeft: '1.5em',
            transition: 'all 0.2s',
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
