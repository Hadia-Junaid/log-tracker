/** @jsxImportSource preact */
import { h } from 'preact';
import SettingsPanel from './logviewsettings/SettingsPanel';

type SettingsProps = {
  path?: string; // ✅ allow Preact Router to pass this
};

const Settings = (_props: SettingsProps) => {
  return <SettingsPanel />;
};

export default Settings;
