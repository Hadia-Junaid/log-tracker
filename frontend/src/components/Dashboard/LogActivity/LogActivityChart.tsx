/** @jsx h */
import { h } from "preact";
import { useMemo, useEffect, useState, useRef } from "preact/hooks";
import { ChartLine } from "lucide-preact";
import ArrayDataProvider from "ojs/ojarraydataprovider";
import "oj-c/line-chart";
import axios from "../../../api/axios";
import "../../../styles/dashboard/logactivitychart.css";

type ChartItem = { groupId: string; seriesId: string; value: number };

type Application = {
  _id: string;
  name: string;
};

type LogActivityData = {
  data: ChartItem[];
  groups: string[];
  series: string[];
  applications: Application[];
};

const LogActivityChart = () => {
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [series, setSeries] = useState<string[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationDropdown, setShowApplicationDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [visibleLogLevels, setVisibleLogLevels] = useState<string[]>([
    "DEBUG",
    "INFO",
    "WARN",
    "ERROR",
  ]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowApplicationDropdown(false);
      }
    };

    if (showApplicationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showApplicationDropdown]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // setLoading(true);
        setError(null);

        console.log("🔍 Starting to fetch log activity data...");

        // Build query parameters

        const localEnd = new Date(); // Now in local time
        const localStart = new Date(localEnd); // Clone
        localStart.setHours(localStart.getHours() - 24); // Subtract 24 *local* hours

        const params: any = {
          start_time: localStart.toISOString(), // will be in UTC
          end_time: localEnd.toISOString(), // will be in UTC
        };

        console.log("📊 Query parameters:", params);

        if (selectedApplications.length > 0) {
          params.app_ids = selectedApplications.join(",");
        }

        console.log("📊 Fetching log activity with params:", params);

        const response = await axios.get("/logs/activity", { params });
        const data: LogActivityData = response.data;

        console.log("📊 Log activity response:", data);
        console.log("📊 Chart data:", data.data);
        console.log("📊 Groups (hours):", data.groups);
        console.log("📊 Series (log levels):", data.series);
        console.log("📊 Available applications:", data.applications);

        setChartData(data.data);
        setGroups(
          data.groups.map(
            (g) =>
              new Date(g).toLocaleTimeString([], {
                hour: "2-digit",
                hour12: false,
              }) + ":00"
          )
        );
        setSeries(data.series);
        setApplications(data.applications);
        setLoading(false);
        console.log("✅ Log activity chart data loaded successfully!");
      } catch (err) {
        console.error("❌ Failed to fetch log activity data:", err);
        setError("Failed to load log activity data");
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedApplications]);

  const filteredChartData = useMemo(() => {
    return chartData.filter((item) => visibleLogLevels.includes(item.seriesId));
  }, [chartData, visibleLogLevels]);

  const chartProvider = useMemo(() => {
    const refinedData = filteredChartData.map((item) => ({
      ...item,
      groupId:
        new Date(item.groupId).toLocaleTimeString([], {
          hour: "2-digit",
          hour12: false,
        }) + ":00",

      seriesId: item.seriesId,
    }));

    return new ArrayDataProvider(refinedData, {
      keyAttributes: ["groupId", "seriesId"],
    });
  }, [filteredChartData]);

  const visibleSeries = useMemo(() => {
    return series.filter((s) => visibleLogLevels.includes(s));
  }, [series, visibleLogLevels]);

  const handleApplicationChange = (appId: string) => {
    setSelectedApplications((prev) => {
      if (prev.includes(appId)) {
        return prev.filter((id) => id !== appId);
      } else {
        return [...prev, appId];
      }
    });
  };

  const getApplicationName = (appId: string) => {
    return applications.find((app) => app._id === appId)?.name || "Unknown";
  };

  const chartSeries = () => {
    return (
      <oj-c-line-chart-series
        markerDisplayed="on"
        lineType="curved"
      ></oj-c-line-chart-series>
    );
  };

  const chartItem = (item: { data: any }) => {
    return (
      <oj-c-line-chart-item
        value={item.data.value}
        groupId={[item.data.groupId]}
        seriesId={item.data.seriesId}
      ></oj-c-line-chart-item>
    );
  };

  const tooltipRenderer = (context: any) => {
    const { group, series, value } = context;
    return {
      insert: `<div class="oj-sm-padding-2x">
      <div><strong>${series}</strong></div>
      <div>Time: ${group}</div>
      <div>Logs: ${value}</div>
    </div>`,
    };
  };

  const colorMap: Record<string, string> = {
    DEBUG: "#64748b",
    INFO: "#06b6d4",
    WARN: "#f59e0b",
    ERROR: "#ef4444",
  };


  const chartRef = useRef<HTMLElement>(null);

  // 3) whenever data, groups, or visibleSeries change, force a refresh
  useEffect(() => {
    if (chartRef.current && typeof (chartRef.current as any).refresh === "function") {
      (chartRef.current as any).refresh();
    }
  }, [chartProvider, groups, visibleSeries]);


  if (loading) {
    return (
      <div class="log-chart-loading">
        <div>Loading log activity data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="log-chart-error">
        <div>{error}</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div class="log-chart-empty">
        <div>No log data available for the last 7 days</div>
      </div>
    );
  }

  return (
    <div class="oj-panel log-chart-container">

      <div class="log-chart-header">
        <div class="log-chart-title">
          <ChartLine class="log-chart-icon" />
          Log Level Analytics
        </div>
        <div class="log-chart-total">
          <span class="oj-badge oj-badge-outline">
            {chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()} Total Logs
          </span>
        </div>
      </div>

      {/* Application Filter */}
      <div class="log-chart-filter-bar">
        <div class="log-chart-controls">
          {series.map((level) => {
            const isLastChecked =
              visibleLogLevels.length === 1 && visibleLogLevels.includes(level);

            return (
              <label
                key={level}
                class="log-chart-checkbox"
                style={{
                  opacity: isLastChecked ? 0.6 : 1,
                  color: colorMap[level],
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleLogLevels.includes(level)}
                  disabled={isLastChecked}
                  onChange={() => {
                    setVisibleLogLevels((prev) =>
                      prev.includes(level)
                        ? prev.length > 1 // Only allow unchecking if more than one is checked
                          ? prev.filter((l) => l !== level)
                          : prev
                        : [...prev, level]
                    );
                  }}
                />
                {level}
              </label>
            );
          })}
        </div>
        <button
          onClick={() => setShowApplicationDropdown(!showApplicationDropdown)}
          class="log-chart-app-dropdown-btn"
        >
          {selectedApplications.length === 0
            ? "All Applications"
            : selectedApplications.length === 1
              ? getApplicationName(selectedApplications[0])
              : `${selectedApplications.length} Applications Selected`}
          <span style={{ marginLeft: "8px" }}>▼</span>
        </button>

        {showApplicationDropdown && (
          <div
            ref={dropdownRef}
            class="log-chart-dropdown"
          >
            {applications.map((app) => (
              <label
                key={app._id}
                class="log-chart-dropdown-item"
              >
                <input
                  type="checkbox"
                  checked={selectedApplications.includes(app._id)}
                  onChange={() => handleApplicationChange(app._id)}
                  style={{ marginRight: "8px" }}
                />
                {app.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div class="log-chart-box">
        {chartProvider && groups.length > 0 && visibleSeries.length > 0 ? (
          <oj-c-line-chart
            id="volumeLineChart"
            data={chartProvider}
            ref={(el: HTMLElement | null) => {
              chartRef.current = el;
            }}
            groups={groups}
            series={visibleSeries}
            orientation="vertical"
            track-resize="on"
            animation-on-display="auto"
            animation-on-data-change="auto"
            class="log-chart"
            group-label-style="transform: rotate(-45deg); text-anchor: end; font-size: 12px;"
            hover-behavior="dim"
            tooltip-renderer={tooltipRenderer}
          >
            <template slot="seriesTemplate" render={chartSeries}></template>
            <template slot="itemTemplate" render={chartItem}></template>
          </oj-c-line-chart>
        ) : (
          <oj-progress-circle size="md" />
        )}

        <div class="log-chart-summary">
          {series.map((level) => {
            const total = chartData
              .filter((item) => item.seriesId === level)
              .reduce((sum, item) => sum + item.value, 0);
            const avg = Math.round(
              total / groups.length || 0
            );

            return (
              <div key={level} class="log-chart-summary-box">
                <div class="log-chart-label">
                  <div
                    class="log-chart-color-dot"
                    style={{ backgroundColor: colorMap[level] }}
                  />
                  {level}
                </div>
                <div class="log-chart-total">{total.toLocaleString()}</div>
                <div class="log-chart-avg">Average Logs per Hour: {avg}</div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default LogActivityChart;
