/** @jsxImportSource preact */
import { h } from 'preact';
import SettingsPanel from './logviewsettings/SettingsPanel';

type SettingsProps = {
  path?: string; // for Preact Router
};

const Settings = (_props: SettingsProps) => {
  return (
    <div class="oj-hybrid-padding">
      <SettingsPanel />
    </div>
  );
};

export default Settings;
