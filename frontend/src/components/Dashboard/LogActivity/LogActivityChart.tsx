/** @jsx h */
import { h } from "preact";
import { useMemo, useEffect, useState, useRef } from "preact/hooks";
import ArrayDataProvider from "ojs/ojarraydataprovider";
import "oj-c/line-chart";
import axios from "../../../api/axios";

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

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>Loading log activity data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "red",
        }}
      >
        <div>{error}</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>No log data available for the last 7 days</div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: "1200px" }}>
      {/* Application Filter */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "10px",
          position: "relative",
        }}
      >
        <button
          onClick={() => setShowApplicationDropdown(!showApplicationDropdown)}
          style={{
            padding: "8px 16px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "white",
            cursor: "pointer",
            fontSize: "14px",
          }}
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
            style={{
              position: "absolute",
              top: "100%",
              right: "0",
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              zIndex: 1000,
              minWidth: "200px",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {applications.map((app) => (
              <label
                key={app._id}
                style={{
                  display: "block",
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
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
      <div
        style={{ width: "100%", overflowX: "auto", backgroundColor: "white" }}
      >
        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {series.map((level) => {
            const isLastChecked =
              visibleLogLevels.length === 1 && visibleLogLevels.includes(level);

            return (
              <label
                key={level}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isLastChecked ? 0.6 : 1,
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

        <div
          style={{ minHeight: "300px", minWidth: "1200px", overflow: "hidden" }}
        >
          {chartProvider && groups?.length && visibleSeries?.length ? (
            <oj-c-line-chart
              id="volumeLineChart"
              data={chartProvider}
              groups={groups}
              series={visibleSeries}
              orientation="vertical"
              track-resize="off"
              animation-on-display="auto"
              animation-on-data-change="auto"
              style="height: 300px; min-width: 1200px;"
              group-label-style="transform: rotate(-45deg); text-anchor: end; font-size: 12px;"
              hover-behavior="dim"
            >
              <template slot="seriesTemplate" render={chartSeries}></template>
              <template slot="itemTemplate" render={chartItem}></template>
            </oj-c-line-chart>
          ) : (
            <oj-progress-circle size="md" />
          )}
        </div>
      </div>
    </div>
  );
};

export default LogActivityChart;
