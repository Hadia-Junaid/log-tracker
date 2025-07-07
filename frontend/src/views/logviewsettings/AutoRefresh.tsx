/** @jsxImportSource preact */
import { h } from "preact";
import "ojs/ojswitch";
import "../../styles/settings/AutoRefresh.css"; 

type AutoRefreshProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

const AutoRefresh = ({ value, onChange }: AutoRefreshProps) => {
  return (
    <div class="auto-refresh-container">
      <oj-switch
        id="autoRefreshSwitch"
        value={value}
        onvalueChanged={(e) => onChange(e.detail.value)}
        class="custom-switch"
      ></oj-switch>
    </div>
  );
};

export default AutoRefresh;