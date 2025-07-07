/** @jsxImportSource preact */
import { h } from "preact";
import "ojs/ojselectsingle";
import "../../styles/settings/LogsPerPage.css";
import ArrayDataProvider = require("ojs/ojarraydataprovider");

export type LogsPerPageValue = "25" | "50" | "100";

type LogsPerPageProps = {
  value: LogsPerPageValue;
  onChange: (value: LogsPerPageValue) => void;
};

const options: { value: LogsPerPageValue; label: string }[] = [
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

const dataProvider = new ArrayDataProvider(options, {
  keyAttributes: "value",
});

const LogsPerPage = ({ value, onChange }: LogsPerPageProps) => {
  return (
    <div class="logs-per-page-container">
      <label htmlFor="logsPerPage" class="oj-label">Logs per page</label>
      <oj-select-single
        id="logsPerPage"
        value={value}
        onvalueChanged={(e) => {
          const newValue = e.detail.value as LogsPerPageValue;
          if (newValue) onChange(newValue);
        }}
        data={dataProvider}
        class="custom-select"
      ></oj-select-single>
    </div>
  );
};

export default LogsPerPage;
