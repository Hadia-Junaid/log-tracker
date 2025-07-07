import { h } from "preact";

interface LogsHeaderProps {
  search: string;
  setSearch: (value: string) => void;
}

export default function LogsHeader({ search, setSearch }: LogsHeaderProps) {
  return (
    <>
      <h2 class="oj-typography-heading-lg oj-sm-margin-4x-bottom">Logs</h2>
      <div class="oj-flex oj-sm-margin-4x-bottom">
        <oj-input-text
          placeholder="Search messages..."
          value={search}
          onvalueChanged={(e: any) => setSearch(e.detail.value)}
          class="oj-form-control-max-width-md"
        ></oj-input-text>
      </div>
    </>
  );
}
