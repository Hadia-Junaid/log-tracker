import "ojs/ojswitch"
import "../../styles/settings/AutoRefresh.css"

type AutoRefreshProps = {
  value: boolean
  onChange: (value: boolean) => void
}

const AutoRefresh = ({ value, onChange }: AutoRefreshProps) => {
  return (
      <oj-switch
        id="autoRefreshSwitch"
        value={value}
        onvalueChanged={(e) => onChange(e.detail.value)}
        class="professional-switch"
      ></oj-switch>
  )
}

export default AutoRefresh
