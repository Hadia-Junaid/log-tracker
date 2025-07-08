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
        {logLevelOptions.map((level) => (
          <button
            class={`oj-button-sm ${logLevels.includes(level) ? 'oj-button-primary' : 'oj-button-outlined'}`}
            onClick={() => toggleLogLevel(level)}
          >
            {level}
          </button>
        ))}
      </div>
    </>
  );
}
