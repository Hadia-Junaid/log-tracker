/** @jsxImportSource preact */
import { h } from "preact";
import SettingsPanel from "../components/logviewsettings/SettingsPanel";

type SettingsProps = {
    path?: string; // for Preact Router
};

const Settings = (_props: SettingsProps) => {
    return <SettingsPanel />;
};

export default Settings;
