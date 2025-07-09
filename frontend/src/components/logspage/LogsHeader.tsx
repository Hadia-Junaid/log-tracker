import { h } from "preact";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "ojs/ojinputtext";
import 'oj-c/select-multiple';
import { useEffect, useState } from "preact/hooks";

interface Application {
  _id: string;
  name: string;
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
}: LogsHeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const appDataProvider = new ArrayDataProvider(applications, { keyAttributes: "_id" });
  const toggleLogLevel = (level: string) => {
    setLogLevels((prev: string[]) =>
      prev.includes(level) ? prev.filter((l: string) => l !== level) : [...prev, level]
    );
  };
  const logLevelOptions = ["INFO", "ERROR", "WARN", "DEBUG"];

  useEffect(() => {
    setPage(1);
  }, [search, selectedAppIds, logLevels]);

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
