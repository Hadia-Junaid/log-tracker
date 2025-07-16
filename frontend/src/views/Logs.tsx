/** @jsx h */
import { h } from "preact";
import { useEffect, useState, useMemo, useRef } from "preact/hooks";
import "ojs/ojtable";
import "ojs/ojprogress-circle";
import "ojs/ojinputtext";
import "ojs/ojdatetimepicker"; // ✅ Add datetime picker component
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
  trace_id: string;
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
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const time = new Date();
  const initialStartTime = new Date(time.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const initialEndTime = time.toISOString();
  const [timeRange, setTimeRange] = useState("Last 24 hours");
  const [startTime, setStartTime] = useState<string | null>(initialStartTime);
  const [endTime, setEndTime] = useState<string | null>(initialEndTime);

  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);

  const [autoRefresh, setAutoRefresh] = useState<boolean | undefined>(undefined);
  const [autoRefreshTime, setAutoRefreshTime] = useState<number | undefined>(undefined);
  const [logTTL, setLogTTL] = useState<number | null>(null);

  // Ref to track last fetch time (ms since epoch)
  const lastFetchTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const updateStartEndTimesFromTimeRange = () => {
    const now = new Date();
    let start: Date | null = null;

    if (timeRange === "custom") {
      if (customStart && customEnd) {
        setStartTime(customStart);
        setEndTime(customEnd);
      }
    } else {
      switch (timeRange) {
        case "Last hour":
          start = new Date(now.getTime() - 60 * 60 * 1000);
          setStartTime(start.toISOString());
          setEndTime(now.toISOString());
          break;
        case "Last 24 hours":
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          setStartTime(start.toISOString());
          setEndTime(now.toISOString());
          break;
        case "7 days":
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          setStartTime(start.toISOString());
          setEndTime(now.toISOString());
          break;
        case "All":
          setStartTime(null);
          setEndTime(null);
          break;
        default:
          setStartTime(null);
          setEndTime(null);
      }
    }
  };

  useEffect(() => {
    updateStartEndTimesFromTimeRange();
    setPage(1);
  }, [timeRange]);

  // NEW: Separate effect for when both customStart and customEnd are filled
  useEffect(() => {
    if (timeRange === "custom" && customStart && customEnd) {
      setStartTime(customStart);
      setEndTime(customEnd);
      setPage(1);
    }
  }, [customStart, customEnd]);


  // Refactor fetchLogs so it can be called from anywhere
  const fetchLogs = async () => {
    setLoading(true);
    // updateStartEndTimesFromTimeRange(); 
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
      setTotalPages(res.data.total_pages || 1);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError("Could not load logs.");
    } finally {
      setLoading(false);
      lastFetchTimeRef.current = Date.now(); // Update last fetch time
    }
  };

  // Manual fetch: run when filters, page, etc. change
  useEffect(() => {
    fetchLogs();
  }, [debouncedSearch, selectedAppIds, logLevels, page, startTime, endTime]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !autoRefreshTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastFetchTimeRef.current >= autoRefreshTime * 1000) {
        updateStartEndTimesFromTimeRange();
        if(timeRange === "custom" && customStart && customEnd) {
          fetchLogs();
        }
        // fetchLogs();
      }
    }, 1000); // Check every second
    return () => clearInterval(interval);
  }, [autoRefresh, autoRefreshTime, debouncedSearch, selectedAppIds, logLevels, page, startTime, endTime]);

  useEffect(() => {
    // Fetch user data (applications, autoRefresh, autoRefreshTime, logTTL) on mount
    const fetchUserData = async () => {
      try {
        const res = await axios.get('/logs/userdata');
        setApplications(res.data.assigned_applications || []);
        setAutoRefresh(res.data.autoRefresh);
        setAutoRefreshTime(res.data.autoRefreshTime);
        setLogTTL(res.data.logTTL);
        const map: Record<string, string> = {};
        res.data.assigned_applications.forEach((app: Application) => {
          map[app._id] = app.name;
        });
        setAppMap(map);       
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };
    fetchUserData();
  }, []);

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
      headerText: "Application",
      field: "application_name",
      resizable: "enabled" as const,
      sortable: "disabled",
      id: "col_service",
    },
    {
      headerText: "Trace ID",
      field: "trace_id",
      resizable: "enabled" as const,
      sortable: "disabled",
      id: "col_trace_id",
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
  const handleResetFilters = () => {
  setSearch("");
  setDebouncedSearch(""); 
  setSelectedAppIds([]);
  setLogLevels([]);
  setTimeRange("Last 24 hours");
  setCustomStart(null);
  setCustomEnd(null);
  setPage(1);
  const now = new Date();
  let start: Date | null = null;
  start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  setStartTime(start.toISOString());
  setEndTime(now.toISOString());

  };
  
  const handleExport = async (format: "csv" | "json") => {
    try {
      // updateStartEndTimesFromTimeRange();
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

      if (format === "csv") {
        // Check if the blob is actually a JSON with emailSent
        const text = await res.data.text();
        try {
          const json = JSON.parse(text);
          if (json && json.emailSent) {
            setExportStatus({ type: 'success', message: 'You will receive an email.' });
            setTimeout(() => setExportStatus(null), 4000);
            return;
          }
        } catch (e) {
          // Not JSON, proceed to download as CSV
        }
        // If not emailSent, download as CSV
        const blob = new Blob([text], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `logs.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportStatus({ type: 'success', message: `Exported logs as CSV` });
      } else {
        // JSON export
        if (res.data && res.data.emailSent) {
          setExportStatus({ type: 'success', message: 'You will receive an email.' });
          setTimeout(() => setExportStatus(null), 4000);
          return;
        }
        const blob = new Blob([
          JSON.stringify(res.data.data, null, 2)
        ], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `logs.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportStatus({ type: 'success', message: `Exported logs as JSON` });
      }
    } catch (err) {
      console.error("Failed to export logs:", err);
      setExportStatus({ type: 'error', message: 'Failed to export logs.' });
    } finally {
      setTimeout(() => setExportStatus(null), 4000);
    }
  };

  return (
  <div class="oj-sm-padding-2x logs-page logs-page-root" style="display: flex; flex-direction: column; height: 100vh;">
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
      customStart={customStart}
      setCustomStart={setCustomStart}
      customEnd={customEnd}
      setCustomEnd={setCustomEnd}
      onResetFilters={handleResetFilters}
      exportStatus={exportStatus}
      logTTL={logTTL}
    />

    <div style="flex: 1; overflow: auto;">
      <LogsTable loading={loading} error={error} dataProvider={dataProvider} columns={columns} />
    </div>

    <div style="padding-top: 1px;">
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  </div>
);

}
