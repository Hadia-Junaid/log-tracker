import { h } from "preact";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "ojs/ojinputtext";
import 'oj-c/select-multiple';
import 'oj-c/select-single';
import 'ojs/ojdatetimepicker';
import { useEffect, useState } from "preact/hooks";
import { useRef } from "preact/hooks";
import { useMemo } from "preact/hooks";

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
  selectedTimeRange: string;
  setSelectedTimeRange: (value: string) => void;

  customStart: string | null;
  setCustomStart: (value: string | null) => void;
  customEnd: string | null;
  setCustomEnd: (value: string | null) => void;
  onResetFilters: () => void;
  exportStatus?: { type: 'success' | 'error'; message: string } | null;
  logTTL?: number | null;
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
  selectedTimeRange,
  setSelectedTimeRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  onResetFilters,
  exportStatus,
  logTTL
}: LogsHeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportWrapperRef = useRef<HTMLDivElement>(null);

  const appDataProvider = useMemo(() => {
  return new ArrayDataProvider(applications, { keyAttributes: "_id" });
}, [applications]);

  const toggleLogLevel = (level: string) => {
    setLogLevels((prev: string[]) =>
      prev.includes(level) ? prev.filter((l: string) => l !== level) : [...prev, level]
    );
  };
  const logLevelOptions = ["INFO", "ERROR", "WARN", "DEBUG"];
  const [currentDateTime, setCurrentDateTime] = useState(new Date().toISOString());
  const timeRangeOptions: TimeRangeOption[] = [
    { value: "Last hour", label: "Last hour" },
    { value: "Last 24 hours", label: "Last 24 hours" },
    { value: "7 days", label: "7 days" },
    { value: "All", label: "All" },
    { value: "custom", label: "Custom" },
  ];
  // const handleResetFilters = () => {}

  const timeRangeDP = new ArrayDataProvider(timeRangeOptions, { keyAttributes: "value" });
  useEffect(() => {
    setPage(1);
  }, [search, selectedAppIds, logLevels, selectedTimeRange]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date().toISOString());
    }, 60000); // update every 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = (event: MouseEvent) => {
      if (
        exportWrapperRef.current &&
        !exportWrapperRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showExportMenu]);

  const minDate = logTTL ? new Date(Date.now() - logTTL * 1000).toISOString() : undefined;

  return (
    <>
      <div class="logs-page-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 class="oj-typography-heading-lg">Logs</h2>
          <div class="logs-description">Monitor your applications' logs.</div>
        </div>
        <div class="export-wrapper" ref={exportWrapperRef}>
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
          {exportStatus && (
            <div class={`export-status-message ${exportStatus.type}`}>{exportStatus.message}</div>
          )}
        </div>
      </div>
      
      <div class="oj-flex logs-page-filters">
        <oj-input-text
          placeholder="Search messages..."
          value={search}
          onrawValueChanged={(e: any) => {
            const value = e.detail.value || "";
            setSearch(value.replace(/\s+$/, ""));
            setPage(1);
          }}
          class="oj-form-control-max-width-md oj-sm-margin-end input-filter search"
        ></oj-input-text>

        <oj-c-select-multiple
          id="applicationsDropdown"
          label-edge="none"
          placeholder={selectedAppIds.length === 0 ? 'Applications' : ''}
          class="oj-form-control-max-width-md input-filter dropdown"
          data={appDataProvider}
          value={selectedAppIds}
          onvalueChanged={(e: any) => { setSelectedAppIds(e.detail.value ?? []); setPage(1); }}
          item-text="name"
        ></oj-c-select-multiple>

        <oj-c-select-single
          label-edge="none"
          placeholder="Time Range"
          class="oj-form-control-max-width-md input-filter dropdown"
          data={timeRangeDP}
          item-text="label"
          value={selectedTimeRange}
          onvalueChanged={(e: any) => {
            setSelectedTimeRange(e.detail.value);
            setPage(1);
          }}
        ></oj-c-select-single> 

        <oj-input-date-time
          id="startDateTime"
          label-edge="none"
          placeholder="Start Time"
          value={customStart ?? undefined}
          onvalueChanged={(event) => {
            const newStart = event.detail.value;
            setCustomStart(newStart);
            if (customEnd && newStart && new Date(newStart) > new Date(customEnd)) {
              setCustomEnd(null);
            }
          }}
          class="oj-form-control-max-width-md input-filter datetime"
          disabled={selectedTimeRange !== 'custom'}
          max={currentDateTime}
          min={minDate}
        ></oj-input-date-time>
      
        <div class="oj-typography-body-md" style="align-self: center; font-weight: bold;">to</div>

        <oj-input-date-time
          id="endDateTime"
          label-edge="none"
          placeholder="End Time"
          value={customEnd ?? undefined}
          onvalueChanged={(event) => setCustomEnd(event.detail.value)}
          class="oj-form-control-max-width-md input-filter datetime"
          disabled={selectedTimeRange !== 'custom'}
          max={currentDateTime}
          min={customStart ?? minDate}
        ></oj-input-date-time>

        <oj-button
                chroming="solid"
                class="add-button resetbutton"
                onojAction={onResetFilters} 
              >
                <span slot="startIcon" class="oj-ux-ico-refresh reset"></span>
                Reset
        </oj-button>
        
      </div>

      <div class="oj-flex log-level-btn-row">
        <span class="oj-typography-body-lg">Log Levels:</span>
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
