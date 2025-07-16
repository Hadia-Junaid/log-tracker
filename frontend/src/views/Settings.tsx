/** @jsxImportSource preact */
import { h } from 'preact';
import SettingsPanel from './logviewsettings/SettingsPanel';

type SettingsProps = {
  path?: string; // for Preact Router
};

const Settings = (_props: SettingsProps) => {
  return (
    <div class="oj-hybrid-padding" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <SettingsPanel />
    </div>
  );
};

export default Settings;
