/** @jsx h */
import { h } from "preact";
import { useEffect, useState, useMemo } from "preact/hooks";
import "ojs/ojtable";
import "ojs/ojprogress-circle";
import "ojs/ojinputtext";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import axios from "../api/axios";
import "../styles/logs.css";
import LogsHeader from "../components/logspage/LogsHeader";
import LogsTable from "../components/logspage/LogsTable";
import Pagination from "../components/logspage/Pagination";

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

  // Time range state
  const time = new Date();
  const initialStartTime = new Date(time.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const initialEndTime = time.toISOString();
  const [timeRange, setTimeRange] = useState("Last 24 hours");
  const [startTime, setStartTime] = useState<string | null>(initialStartTime);
  const [endTime, setEndTime] = useState<string | null>(initialEndTime);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Time range effect
  useEffect(() => {
    const now = new Date();
    let start: Date | null = null;
    console.log("timeRange", timeRange);
    switch (timeRange) {
      case "Last hour":
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "Last 24 hours":
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7 days":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "All":
        start = null; 
      default:
        start = null;
    }
    setStartTime(start ? start.toISOString() : null);
    setEndTime(start ? now.toISOString(): null);
    setPage(1);
  }, [timeRange]);

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
            start_time: startTime ?? undefined,
            end_time: endTime ?? undefined,
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
  }, [debouncedSearch, selectedAppIds, logLevels, page, startTime, endTime]);

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
      sortable: "disabled",
      id: "col_time",
      headerStyle: "text-align: center;",
    },
    {
      headerText: "Level",
      field: "log_level",
      resizable: "enabled" as const,
      sortable: "disabled",
      id: "col_level",
    },
    {
      headerText: "Service",
      field: "application_name",
      resizable: "enabled" as const,
      sortable: "disabled",
      id: "col_service",
    },
    {
      headerText: "Message",
      field: "message",
      resizable: "enabled" as const,
      sortable: "disabled",
      id: "col_message",
      headerStyle: "text-align: center",
    },
  ];

  const handleExport = async (format: "csv" | "json") => {
    try {
      const res = await axios.get(`/logs/export`, {
        params: {
          search: debouncedSearch,
          app_ids: Array.from(selectedAppIds).join(','),
          log_levels: logLevels.join(','),
          start_time: startTime ?? undefined,
          end_time: endTime ?? undefined,
          is_csv: format === "csv",
        },
        responseType: format === "csv" ? "blob" : "json",
      });

      const blob = new Blob(
        [format === "csv" ? res.data : JSON.stringify(res.data.data, null, 2)],
        { type: format === "csv" ? "text/csv" : "application/json" }
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `logs.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export logs:", err);
    }
  };

  return (
    <div class="oj-sm-padding-6x logs-page logs-page-root">
      <LogsHeader
        search={search}
        setSearch={setSearch}
        applications={applications}
        selectedAppIds={selectedAppIds}
        setSelectedAppIds={setSelectedAppIds}
        logLevels={logLevels}
        setLogLevels={setLogLevels}
        setPage={setPage}
        onExport={handleExport}
        selectedTimeRange={timeRange}
        setSelectedTimeRange={setTimeRange}
      />
      <LogsTable loading={loading} error={error} dataProvider={dataProvider} columns={columns} />
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
}