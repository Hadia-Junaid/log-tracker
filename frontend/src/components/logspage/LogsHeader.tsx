import { h } from "preact";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "ojs/ojinputtext";
import 'oj-c/select-multiple';
import 'oj-c/select-single'; // ✅ Added for Time Range dropdown
import { useEffect, useState } from "preact/hooks";

interface Application {
  _id: string;
  name: string;
}

interface TimeRangeOption {
  value: string;
  label: string;
}
interface LogsHeaderProps {
  search: string;
  setSearch: (value: string) => void;
  applications: Application[];
  selectedAppIds: string[];
  setSelectedAppIds: (ids: string[]) => void;
  logLevels: string[];
  setLogLevels: (value: string[] | ((prevState: string[]) => string[])) => void;
  setPage: (page: number) => void;
  onExport: (format: "csv" | "json") => void;
  selectedTimeRange: string; // ✅ Added
  setSelectedTimeRange: (value: string) => void; // ✅ Added
}

export default function LogsHeader({
  search,
  setSearch,
  applications,
  selectedAppIds,
  setSelectedAppIds,
  logLevels,
  setLogLevels,
  setPage,
  onExport,
  selectedTimeRange, // ✅ Added
  setSelectedTimeRange, // ✅ Added
}: LogsHeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const appDataProvider = new ArrayDataProvider(applications, { keyAttributes: "_id" });
  const toggleLogLevel = (level: string) => {
    setLogLevels((prev: string[]) =>
      prev.includes(level) ? prev.filter((l: string) => l !== level) : [...prev, level]
    );
  };
  const logLevelOptions = ["INFO", "ERROR", "WARN", "DEBUG"];
  const timeRangeOptions: TimeRangeOption[] = [
    { value: "Last hour", label: "Last hour" },
    { value: "Last 24 hours", label: "Last 24 hours" },
    { value: "7 days", label: "7 days" },
    { value: "All", label: "All" },
    { value: "custom", label: "Custom" },
  ];
  const timeRangeDP = new ArrayDataProvider(timeRangeOptions, { keyAttributes: "value" });

  useEffect(() => {
    setPage(1);
  }, [search, selectedAppIds, logLevels, selectedTimeRange]); // ✅ include selectedTimeRange

  return (
    <>
      <div class="oj-flex oj-sm-margin-4x-bottom" style="justify-content: space-between; align-items: center;">
        <h2 class="oj-typography-heading-lg">Logs</h2>
        <div class="export-wrapper">
          <button
            class="export-btn"
            onClick={() => setShowExportMenu(prev => !prev)}
          >
            Export ▼
          </button>
          {showExportMenu && (
            <div class="export-menu">
              <button
                class="export-menu-item"
                onClick={() => { onExport("csv"); setShowExportMenu(false); }}
              >
                Download CSV
              </button>
              <button
                class="export-menu-item"
                onClick={() => { onExport("json"); setShowExportMenu(false); }}
              >
                Download JSON
              </button>
            </div>
          )}
        </div>
      </div>

      <div class="oj-flex oj-sm-margin-4x-bottom" style="gap: 1rem; align-items: flex-end;">
        <oj-input-text
          placeholder="Search messages..."
          value={search}
          onrawValueChanged={(e: any) => { setSearch(e.detail.value); setPage(1); }}
          class="oj-form-control-max-width-md oj-sm-margin-end input-filter"
        ></oj-input-text>

        <oj-c-select-multiple
          id="applicationsDropdown"
          label-edge="none"
          placeholder="Services"
          class="oj-form-control-max-width-md input-filter dropdown"
          data={appDataProvider}
          value={selectedAppIds}
          onvalueChanged={(e: any) => { setSelectedAppIds(e.detail.value ?? []); setPage(1); }}
          item-text="name"
        ></oj-c-select-multiple>
        {/* ✅ Time Range Filter */}
        {/* <span class="time-range-label">Time Range:</span> */}
        <oj-c-select-single
          label-edge="none"
          placeholder="Time Range"
          class="oj-form-control-max-width-md input-filter dropdown"
          data={timeRangeDP}
          item-text="label"
          value={selectedTimeRange}
          onvalueChanged={(e: any) => { setSelectedTimeRange(e.detail.value); setPage(1); }}
        ></oj-c-select-single>
      </div>

      <div class="oj-flex oj-sm-margin-4x-bottom log-level-btn-row">
        <span class="oj-typography-body-md">Log Levels:</span>
        {logLevelOptions.map((level) => {
          const selected = logLevels.includes(level);
          return (
            <button
              type="button"
              class={`log-level-btn${selected ? ` selected ${level}` : ''}`}
              onClick={() => { toggleLogLevel(level); setPage(1); }}
              key={level}
            >
              {level}
            </button>
          );
        })}
      </div>
    </>
  );
}
