/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from "preact";
import { useMemo, useEffect, useState, useRef } from "preact/hooks";
import { ChartLine } from "lucide-preact";
import ArrayDataProvider from "ojs/ojarraydataprovider";
import "oj-c/line-chart";
import axios from "../../../api/axios";
import "../../../styles/dashboard/logactivitychart.css";
import { AxiosError } from 'axios';

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
  const [selectedApplication, setSelectedApplication] = useState<string>("");
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
        setLoading(true);
        setError(null);

        console.log("🔍 Starting to fetch log activity data...");

        // Build query parameters

        const localEnd = new Date(); // Now in local time
        const localStart = new Date(localEnd); // Clone
        localStart.setHours(localStart.getHours() - 23); // Subtract 24 *local* hours

        const params: any = {
          start_time: localStart.toISOString(), // will be in UTC
          end_time: localEnd.toISOString(), // will be in UTC
        };

        console.log("📊 Query parameters:", params);

        if (selectedApplication && selectedApplication !== "") {
          params.app_ids = selectedApplication;
        }

        console.log("📊 Fetching log activity with params:", params);

        const response = await axios.get("/logs/activity", { params });
        const data: LogActivityData = response.data;

        console.log("📊 Log activity response:", data);

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
      } catch (error) {
  const err = error as unknown as AxiosError<any>;
  console.error("❌ Failed to fetch log activity data:", err);

  const backendMessage =
    err.response?.data?.message || // if backend uses { message: "..." }
    err.response?.data?.error ||   // if backend uses { error: "..." }
    err.message ||                 // fallback to Axios error
    "Failed to load log activity data"; // default

  setError(backendMessage);
  setLoading(false);
}
    };

    fetchData();
  }, [selectedApplication]);

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

  if (error) {
    return (
      <div class="log-chart-error">
        <div>{error}</div>
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
            {chartData
              .reduce((sum, item) => sum + item.value, 0)
              .toLocaleString()}{" "}
            Total Logs
          </span>
        </div>
      </div>

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
                  color: "#6b7280",   //need a neutral color here same for all levels
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleLogLevels.includes(level)}
                  disabled={isLastChecked}
                  onChange={() => {
                    setVisibleLogLevels((prev) =>
                      prev.includes(level)
                        ? prev.length > 1
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

        {/* Single select dropdown */}
        <oj-select-single
          style={{ maxWidth: "240px" }}
          value={selectedApplication}
          onvalueChanged={(e) => {
            setSelectedApplication(e.detail.value as string);
          }}
          data={
            new ArrayDataProvider(
              [
                { value: "", label: "All Applications" },
                ...applications.map((app) => ({
                  value: app._id,
                  label: app.name,
                })),
              ],
              { keyAttributes: "value" }
            )
          }
        ></oj-select-single>
      </div>

      {/* Chart */}
      <div class="log-chart-box">
        {/* Conditionally render overlay or chart */}
        {loading ? (
          <div class="chart-overlay">
            <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center oj-sm-flex-direction-column">
          <oj-progress-circle value={-1} size="lg" />
          <p
            class="oj-typography-body-md oj-text-color-secondary"
            style="margin-top: 16px;"
          >
            Loading log activity...
          </p>
        </div>
          </div>
        ) : error ? (
          <div class="chart-overlay chart-overlay-error">
            <span>{error}</span>
          </div>
        ) : chartData.length === 0 ? (
          <div class="chart-overlay">
            <span>No log data available for the last 24 hours.</span>
          </div>
        ) : (
          <oj-c-line-chart
            data={chartProvider}
            groups={groups.length ? groups : ["00:00"]}
  series={visibleSeries.length ? visibleSeries : ["INFO"]} // Use the full 'series' state
            orientation="vertical"
            tooltip-renderer={tooltipRenderer}
            style={{ width: "100%", height: "100%" }}
            legend={{ position: "bottom", rendered: "on", maxSize: "50px" }}
          >
            <template slot="seriesTemplate" render={chartSeries} />
            <template slot="itemTemplate" render={chartItem} />
          </oj-c-line-chart>
        )}
      </div>
    </div>
  );
};

export default LogActivityChart;
