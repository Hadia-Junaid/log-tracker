import { h } from "preact";
import "ojs/ojtable";
import "ojs/ojprogress-circle";
import { ojTable } from "ojs/ojtable";
import "../../styles/logs.css";
interface LogsTableProps {
  loading: boolean;
  error: string | null;
  dataProvider: any;
  columns: any[];
}

export default function LogsTable({loading, error, dataProvider, columns }: LogsTableProps) {
  return (
    <>
      {loading ? (
        <div class="oj-flex oj-sm-justify-content-center" style="width: 100%;">
          <oj-progress-circle size="md" value={-1}></oj-progress-circle>
        </div>
      ) : error ? (
        <p class="oj-text-color-danger">{error}</p>
      ) : (
        <oj-table
          id="logsTable"
          aria-label="Logs Table"
          data={dataProvider}
          scroll-policy="loadMoreOnScroll"
          scroll-policy-options='{"fetchSize": 10}'
          columns={columns}
          class="demo-table-container"
        ></oj-table>
      )}
    </>
  );
}
