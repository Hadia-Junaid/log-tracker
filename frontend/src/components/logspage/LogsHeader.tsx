import { h } from "preact";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "ojs/ojinputtext";
import 'oj-c/select-multiple';

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
  setLogLevels: (value: string[] | ((prevState: string[]) => string[])) => void; // ✅ FIXED
}

export default function LogsHeader({
  search,
  setSearch,
  applications,
  selectedAppIds,
  setSelectedAppIds,
  logLevels,
  setLogLevels,
}: LogsHeaderProps) {

  const appDataProvider = new ArrayDataProvider(applications, { keyAttributes: "_id" });

  const toggleLogLevel = (level: string) => {
  setLogLevels((prev: string[]) =>
    prev.includes(level) ? prev.filter((l: string) => l !== level) : [...prev, level]
  );
  };

  const logLevelOptions = ["INFO", "ERROR", "WARN", "DEBUG"];

  // Color map for log levels
  const logLevelStyles: Record<string, { bg: string; text: string; border: string }> = {
    INFO:   { bg: '#e3f0ff', text: '#0b3d91', border: '#0b3d91' }, // blue
    WARN:   { bg: '#fffbe3', text: '#b88600', border: '#b88600' }, // yellow
    ERROR:  { bg: '#ffe3e3', text: '#b00020', border: '#b00020' }, // red
    DEBUG:  { bg: '#f0f0f0', text: '#444', border: '#888' },      // grey
  };

  return (
    <>
      <h2 class="oj-typography-heading-lg oj-sm-margin-4x-bottom">Logs</h2>
      <div class="oj-flex oj-sm-margin-4x-bottom" style="gap: 1rem; align-items: flex-end;">
        <oj-input-text
          placeholder="Search messages..."
          value={search}
          onvalueChanged={(e: any) => setSearch(e.detail.value)}
          class="oj-form-control-max-width-md oj-sm-margin-end input-filter"
        ></oj-input-text>
        <oj-c-select-multiple
          id="applicationsDropdown"
          label-edge="none"
          placeholder="Services"
          class="oj-form-control-max-width-md input-filter dropdown"
          data={appDataProvider}
          value={selectedAppIds}
          onvalueChanged={(e: any) => setSelectedAppIds(e.detail.value ?? [])}
          item-text="name"
        ></oj-c-select-multiple>
      </div>

      {/* Log Level Buttons */}
      <div class="oj-flex oj-sm-margin-4x-bottom" style="gap: 1rem; align-items: center;">
        <span class="oj-typography-body-md">Log Levels:</span>
        {logLevelOptions.map((level) => {
          const selected = logLevels.includes(level);
          const style = selected
            ? {
                background: logLevelStyles[level].bg,
                color: logLevelStyles[level].text,
                border: `2px solid ${logLevelStyles[level].border}`,
                fontWeight: 600,
                borderRadius: '6px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                padding: '0.4em 1.2em',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }
            : {
                background: '#fff',
                color: '#222',
                border: '1px solid #bbb',
                fontWeight: 500,
                borderRadius: '6px',
                boxShadow: 'none',
                padding: '0.4em 1.2em',
                transition: 'all 0.2s',
                cursor: 'pointer',
              };
          return (
            <button
              type="button"
              style={style}
              onClick={() => toggleLogLevel(level)}
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